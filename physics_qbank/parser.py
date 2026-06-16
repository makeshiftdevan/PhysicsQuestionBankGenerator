"""Segment cleaned text into typed Question objects.

The parser is deliberately defensive: source files are messy (scoring guides,
answer keys, mixed MC + free response). It separates the real question stem
from surrounding answers, rubrics, points and explanations, and it never
guesses an answer it cannot find.
"""

import re
from typing import Dict, List, Optional, Tuple

from . import config
from .cleaner import readable_ratio
from .models import Choice, ParseResult, Question, TYPE_MC, TYPE_PROBLEM

# --- line classifiers -------------------------------------------------------

# A numbered question marker: number then '.', ')' or whitespace, at line start.
_Q_MARKER_DOT = re.compile(r"^\s*(\d{1,3})\s*[.)]\s+(\S.*)$")
_Q_MARKER_WS = re.compile(r"^\s*(\d{1,3})\s+([A-Z\"'(].*)$")

# A multiple-choice option line: a. b. c. ... optionally with a leading '*'.
_OPTION_RE = re.compile(r"^\s*(\*?)\s*([a-eA-E])\s*[.)]\s+(.*)$")

# Inline answer markers inside a block.
_ANS_INLINE = re.compile(
    r"^\s*(?:ans(?:wer)?|correct answer)\s*[:\-]?\s*(.+)$", re.IGNORECASE)
_ANS_LETTER = re.compile(r"^\s*answer\s+([a-eA-E])\b", re.IGNORECASE)

# Explanation / solution / rubric leads.
_EXPLAIN_LEAD = re.compile(
    r"^\s*(correct\.|explanation|rationale|because|note)\b", re.IGNORECASE)
_SOLUTION_LEAD = re.compile(r"^\s*(solution|worked solution|model answer)\b",
                            re.IGNORECASE)
_RUBRIC_LEAD = re.compile(r"^\s*\d+\s*point", re.IGNORECASE)

# Points: "(2 points)", "[3 pts]", "PTS: 4", "Points: 2".
_POINTS_RE = re.compile(
    r"(?:pts?|points?)\s*[:=]?\s*(\d+)|[\[(]\s*(\d+)\s*(?:pts?|points?)\s*[\])]",
    re.IGNORECASE)

# Figure / representation references.
_FIGURE_RE = re.compile(
    r"\b(figure|diagram|graph|chart|as shown|shown (?:above|below)|"
    r"the picture|the image|refer to the)\b", re.IGNORECASE)

# Section headers we recognize in the source text.
_KNOWN_HEADERS = {
    "MULTIPLE CHOICE": TYPE_MC,
    "PROBLEM": TYPE_PROBLEM,
    "PROBLEMS": TYPE_PROBLEM,
    "ESSAY": TYPE_PROBLEM,
    "FREE RESPONSE": TYPE_PROBLEM,
    "SHORT ANSWER": TYPE_PROBLEM,
}
_ANSWER_KEY_HEADER = re.compile(
    r"^\s*(answer key|answers|answer section|solutions?)\s*:?\s*$",
    re.IGNORECASE)

# "Questions 3-5 refer to..." style range for shared setups.
_SETUP_RANGE_RE = re.compile(
    r"questions?\s+(\d{1,3})\s*(?:[-–to]+|through)\s*(\d{1,3})",
    re.IGNORECASE)


def parse(lines: List[str], fallback_title: str = "") -> ParseResult:
    result = ParseResult()

    if not any(l.strip() for l in lines):
        result.raw_text_empty = True
        return result

    answer_key, body_lines = _split_off_answer_key(lines)

    result.title = _suggest_title(body_lines, fallback_title)

    blocks, setups = _segment(body_lines)
    if not blocks:
        result.warnings.append(
            "No numbered questions were detected in this PDF.")
        return result

    questions: List[Question] = []
    for block in blocks:
        q = _build_question(block)
        if q is not None:
            questions.append(q)

    _apply_answer_key(questions, answer_key)
    _attach_setups(questions, setups, result)
    _renumber(questions)

    result.questions = questions
    return result


# --- answer key separation --------------------------------------------------

def _split_off_answer_key(lines: List[str]) -> Tuple[Dict[int, str], List[str]]:
    """Pull a trailing answer-key section into a {number: answer} map."""
    key_start = None
    for i, line in enumerate(lines):
        if _ANSWER_KEY_HEADER.match(line):
            key_start = i
            break
    if key_start is None:
        return {}, lines

    body = lines[:key_start]
    key_lines = lines[key_start + 1:]
    answer_key = _parse_answer_key(key_lines)
    # Only treat it as an answer key if we actually extracted entries; else the
    # word "Answers" was probably part of a question.
    if not answer_key:
        return {}, lines
    return answer_key, body


def _parse_answer_key(lines: List[str]) -> Dict[int, str]:
    answers: Dict[int, str] = {}
    # Matches "1. B", "1) B", "12. ANS: C", possibly several per line.
    pair_re = re.compile(r"(\d{1,3})\s*[.)]\s*(?:ans:?\s*)?([A-Ea-e])\b",
                         re.IGNORECASE)
    for line in lines:
        for num, letter in pair_re.findall(line):
            answers[int(num)] = letter.upper()
    return answers


# --- title ------------------------------------------------------------------

def _suggest_title(lines: List[str], fallback_title: str) -> str:
    """Prefer a repeated/document heading; fall back to the cleaned filename."""
    for line in lines[:8]:
        s = line.strip()
        if not s:
            continue
        if _Q_MARKER_DOT.match(s) or _Q_MARKER_WS.match(s):
            break
        if s.upper() in _KNOWN_HEADERS:
            continue
        if re.search(r"\b(unit|test|quiz|exam|chapter|midterm|final|review)\b",
                     s, re.IGNORECASE) and len(s) <= config.MAX_TITLE_CHARS + 20:
            return _truncate_title(s)
    return _truncate_title(fallback_title or "Question Bank")


def _truncate_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title).strip()
    if len(title) > config.MAX_TITLE_CHARS:
        title = title[:config.MAX_TITLE_CHARS].rstrip()
    return title or "Question Bank"


# --- segmentation -----------------------------------------------------------

class _Block:
    def __init__(self, number: int, qtype_hint: str):
        self.number = number
        self.qtype_hint = qtype_hint  # section hint, may be overridden
        self.lines: List[str] = []


def _segment(lines: List[str]) -> Tuple[List["_Block"], List[Tuple]]:
    """Split lines into question blocks; collect shared-setup paragraphs.

    Returns (blocks, setups) where each setup is
    (text, applies_low, applies_high, position_index).
    """
    blocks: List[_Block] = []
    setups: List[Tuple] = []

    current_type = TYPE_MC  # default until a header says otherwise
    last_number = 0
    pending_pre: List[str] = []  # prose seen before the next numbered question

    def flush_setup_before(idx: int):
        nonlocal pending_pre
        text = " ".join(x.strip() for x in pending_pre if x.strip()).strip()
        pending_pre = []
        if len(text) < 25:
            return  # too short to be a real scenario
        low = high = None
        m = _SETUP_RANGE_RE.search(text)
        if m:
            low, high = int(m.group(1)), int(m.group(2))
        # idx is the position of the question block that follows this setup.
        setups.append((text, low, high, idx))

    for line in lines:
        header = _match_header(line)
        if header is not None:
            current_type = header
            last_number = 0  # numbering may restart per section
            pending_pre = []
            continue

        marker = _Q_MARKER_DOT.match(line)
        num = None
        rest = None
        if marker:
            num = int(marker.group(1))
            rest = marker.group(2)
        else:
            ws = _Q_MARKER_WS.match(line)
            if ws:
                cand = int(ws.group(1))
                # Accept the whitespace form only if it continues the sequence,
                # to avoid mistaking "5 meters per second" for a new question.
                if cand == last_number + 1 or (cand == 1 and last_number == 0):
                    num = cand
                    rest = ws.group(2)

        if num is not None:
            if pending_pre:
                flush_setup_before(len(blocks))
            block = _Block(num, current_type)
            block.lines.append(rest)
            blocks.append(block)
            last_number = num
            continue

        # Not a header, not a marker.
        if blocks and not _looks_like_setup_intro(line):
            blocks[-1].lines.append(line)
        else:
            # Could be a shared-setup paragraph introducing the next question.
            pending_pre.append(line)

    return blocks, setups


def _match_header(line: str) -> Optional[str]:
    s = line.strip().rstrip(":").upper()
    if s in _KNOWN_HEADERS:
        return _KNOWN_HEADERS[s]
    return None


def _looks_like_setup_intro(line: str) -> bool:
    """Lines that clearly introduce a shared block for following questions."""
    return bool(_SETUP_RANGE_RE.search(line) or
                re.search(r"use the following|refer to the following|"
                          r"based on the following|the following (?:information|"
                          r"passage|scenario|diagram)", line, re.IGNORECASE))


# --- per-block construction -------------------------------------------------

def _build_question(block: "_Block") -> Optional[Question]:
    stem_lines: List[str] = []
    choices: List[Choice] = []
    answer = ""
    notes_parts: List[str] = []        # explanation / rubric -> NOT:
    solution_parts: List[str] = []     # worked solution -> ANS: (free response)
    points = ""
    explicit_correct_letter = None

    mode = "stem"  # stem -> options -> trailing metadata
    for raw in block.lines:
        line = raw.rstrip()
        if not line.strip():
            continue

        opt = _OPTION_RE.match(line)
        if opt and _plausible_option_sequence(choices, opt.group(2)):
            star, letter, text = opt.group(1), opt.group(2).lower(), opt.group(3)
            is_correct = bool(star)
            if is_correct:
                explicit_correct_letter = letter
            # Strip an inline "*" used to flag the answer mid-text.
            text = text.strip()
            if text.startswith("*"):
                is_correct = True
                explicit_correct_letter = letter
                text = text[1:].strip()
            choices.append(Choice(letter=letter, text=text, is_correct=is_correct))
            mode = "options"
            continue

        # Inline answer.
        m_letter = _ANS_LETTER.match(line)
        m_ans = _ANS_INLINE.match(line)
        if m_letter:
            explicit_correct_letter = m_letter.group(1).lower()
            mode = "meta"
            continue
        if m_ans:
            payload = m_ans.group(1).strip()
            if re.fullmatch(r"[A-Ea-e]", payload):
                explicit_correct_letter = payload.lower()
            else:
                answer = payload
            mode = "meta"
            continue

        # Points.
        pm = _POINTS_RE.search(line)
        if pm and (mode != "stem" or _RUBRIC_LEAD.match(line)):
            points = pm.group(1) or pm.group(2) or points

        # Worked solution / model answer -> destined for ANS: (free response).
        if _SOLUTION_LEAD.match(line):
            solution_parts.append(_strip_label(line))
            mode = "meta"
            continue
        # Explanation / rationale / point-by-point rubric -> destined for NOT:.
        if _EXPLAIN_LEAD.match(line) or _RUBRIC_LEAD.match(line):
            notes_parts.append(line.strip())
            mode = "meta"
            continue

        # Otherwise: part of the stem (if still building it) or trailing notes.
        if mode == "stem":
            stem_lines.append(line.strip())
        elif mode == "options":
            # Continuation of the previous option's text (wrapped line).
            if choices:
                choices[-1].text = (choices[-1].text + " " + line.strip()).strip()
            else:
                stem_lines.append(line.strip())
        else:
            notes_parts.append(line.strip())

    stem = " ".join(stem_lines).strip()
    if not stem and not choices:
        return None

    qtype = TYPE_MC if choices else TYPE_PROBLEM
    # A "PROBLEM" section item with stray options is still MC if it has them;
    # but a section explicitly free-response with no options stays PROBLEM.

    q = Question(number=block.number, qtype=qtype, stem=stem, choices=choices)
    q.points = points or config.DEFAULT_POINTS
    q.notes = "  ".join(_dedupe_consecutive(notes_parts)).strip()

    # Resolve the answer.
    if qtype == TYPE_MC:
        letter = explicit_correct_letter
        if letter is None:
            for c in choices:
                if c.is_correct:
                    letter = c.letter
                    break
        if letter:
            q.answer = letter.upper()
            for c in choices:
                c.is_correct = (c.letter == letter)
        else:
            q.answer = config.ANSWER_PLACEHOLDER
            q.add_flag("Missing answer (not in text; may be highlight-only).")
        # Any explanation text already captured stays in NOT:.
    else:
        if answer:
            q.answer = answer
        elif solution_parts:
            q.answer = " ".join(_dedupe_consecutive(solution_parts)).strip()
        elif notes_parts:
            # No explicit solution: fall back to the explanation as the model
            # answer so ANS: is never empty.
            q.answer = q.notes
        else:
            q.answer = config.ANSWER_PLACEHOLDER
            q.add_flag("Missing model answer/solution for free response.")

    _validate_and_flag(q)
    return q


_LABEL_RE = re.compile(
    r"^\s*(solution|worked solution|model answer)\s*[:\-]?\s*",
    re.IGNORECASE)


def _strip_label(line: str) -> str:
    return _LABEL_RE.sub("", line).strip()


def _dedupe_consecutive(parts: List[str]) -> List[str]:
    out: List[str] = []
    for p in parts:
        key = re.sub(r"\s+", " ", p.strip().lower())
        if out and re.sub(r"\s+", " ", out[-1].strip().lower()) == key:
            continue
        out.append(p)
    return out


def _plausible_option_sequence(choices: List[Choice], letter: str) -> bool:
    """Letters should advance a..b..c; reject out-of-order false positives."""
    letter = letter.lower()
    if not choices:
        return letter in ("a", "b")  # tolerate a missing 'a' from extraction
    expected = chr(ord(choices[-1].letter) + 1)
    return letter == expected or letter == choices[-1].letter


def _validate_and_flag(q: Question) -> None:
    if q.qtype == TYPE_MC:
        real = [c for c in q.choices if c.text.strip() and
                readable_ratio(c.text) >= config.GARBLED_READABLE_RATIO]
        if len(real) < config.MIN_MC_OPTIONS:
            q.add_flag(
                f"Only {len(real)} usable option(s) - choices may be images; "
                "needs manual math/answer entry.")

    if _FIGURE_RE.search(q.stem):
        q.add_flag("References a figure/graph - image not imported; see NOT:.")
        placeholder = ("[FIGURE NOT IMPORTED - the original question relies on "
                       "an image/figure. Re-add it manually in ExamView.]")
        q.notes = (q.notes + "  " + placeholder).strip() if q.notes else placeholder

    if q.stem and readable_ratio(q.stem) < config.GARBLED_READABLE_RATIO:
        q.add_flag("Garbled text (likely equation rendered as an image).")


# --- answer key + setups ----------------------------------------------------

def _apply_answer_key(questions: List[Question], answer_key: Dict[int, str]):
    if not answer_key:
        return
    for q in questions:
        if q.qtype != TYPE_MC:
            continue
        if q.answer and q.answer != config.ANSWER_PLACEHOLDER:
            continue
        letter = answer_key.get(q.number)
        if letter:
            q.answer = letter.upper()
            for c in q.choices:
                c.is_correct = (c.letter == letter.lower())
            # Clear the "missing answer" flag now that the key supplied it.
            q.flags = [f for f in q.flags if not f.startswith("Missing answer")]


def _attach_setups(questions: List[Question], setups: List[Tuple],
                   result: ParseResult) -> None:
    """Prepend each shared setup to its dependent question(s) and flag it."""
    if not setups:
        return
    by_number = {q.number: q for q in questions}

    for text, low, high, position in setups:
        targets: List[Question] = []
        if low is not None and high is not None:
            for n in range(low, high + 1):
                if n in by_number:
                    targets.append(by_number[n])
        elif 0 <= position < len(questions):
            # No explicit range: attach to the question that follows the setup.
            targets.append(questions[position])

        for q in targets:
            if not q.shared_setup_prepended:
                q.stem = (text.strip() + " " + q.stem).strip()
                q.shared_setup_prepended = True
                q.add_flag("Shared setup attached - confirm it applies here.")


def _renumber(questions: List[Question]) -> None:
    """Number consecutively across the whole bank (1..N)."""
    for i, q in enumerate(questions, start=1):
        q.number = i
