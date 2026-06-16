"""Generate a spec-compliant ExamView RTF import file (the real deliverable).

The RTF is intentionally minimal: a single default font, plain paragraphs, one
\\par per logical line, straight quotes only, no tables, no rich formatting.
Non-ASCII characters are emitted as \\uN escapes with a readable ASCII
fallback so nothing is silently dropped.
"""

import os
import re
from typing import List, Optional, Tuple

from . import config
from .difficulty import token_label
from .models import Question, TYPE_MC, TYPE_PROBLEM

# Smart punctuation -> straight ASCII (spec: straight quotes only).
_STRAIGHTEN = {
    "“": '"', "”": '"', "‘": "'", "’": "'",
    "–": "-", "—": "-", "…": "...", " ": " ",
}

# Readable ASCII fallbacks used in the \uN<fallback> escape so a non-Unicode
# reader still shows something sensible. Unmapped chars fall back to '?'.
_ASCII_FALLBACK = {
    "×": "x", "·": ".", "°": "deg", "π": "pi",
    "Δ": "D", "θ": "theta", "ω": "w", "α": "a",
    "β": "b", "√": "sqrt", "∫": "S", "∂": "d",
    "≈": "~", "≤": "<=", "≥": ">=", "∑": "sum",
    "²": "2", "³": "3", "½": "1/2", "µ": "u",
}


def _straighten(text: str) -> str:
    for bad, good in _STRAIGHTEN.items():
        text = text.replace(bad, good)
    return text


def _escape(text: str) -> str:
    """Escape a plain string into RTF body tokens (single logical line)."""
    text = _straighten(text)
    out = []
    for ch in text:
        code = ord(ch)
        if ch == "\\":
            out.append("\\\\")
        elif ch == "{":
            out.append("\\{")
        elif ch == "}":
            out.append("\\}")
        elif ch in ("\r", "\n", "\t"):
            out.append(" ")
        elif 32 <= code < 127:
            out.append(ch)
        else:
            signed = code if code < 32768 else code - 65536
            fallback = _ASCII_FALLBACK.get(ch, "?")
            # \uN must be followed by exactly one fallback unit; wrap multi-char
            # fallbacks so the reader skips the right amount.
            # \uN keeps the true Unicode char for ExamView; the trailing char
            # is the single ASCII fallback (\uc defaults to 1) for plain readers.
            if len(fallback) == 1:
                out.append("\\u%d %s" % (signed, fallback))
            else:
                out.append("\\u%d ?" % signed)
    return "".join(out)


def _line(text: str) -> str:
    """One logical line -> one RTF paragraph."""
    return _escape(text) + "\\par\n"


def _section_header(qtype: str) -> str:
    return (config.HEADER_MULTIPLE_CHOICE if qtype == TYPE_MC
            else config.HEADER_PROBLEM)


def build_rtf(title: str, questions: List[Question],
              subtitle: Optional[str] = None) -> str:
    """Build the full RTF document text for one bank."""
    title = _clip(title, config.MAX_TITLE_CHARS) or "Question Bank"

    parts: List[str] = []
    parts.append("{\\rtf1\\ansi\\ansicpg1252\\deff0\n")
    parts.append("{\\fonttbl{\\f0\\fmodern Courier New;}}\n")
    parts.append("\\pard\\plain\\f0\\fs20\n")

    parts.append(_line(title))
    if subtitle:
        sub = _clip(subtitle, config.MAX_TITLE_CHARS)
        if sub and sub.upper() not in (config.HEADER_MULTIPLE_CHOICE,
                                       config.HEADER_PROBLEM):
            parts.append(_line(sub))

    # Group questions by type, preserving order, MC first then PROBLEM, so each
    # type gets a single header. Numbering is consecutive across the whole bank.
    ordered = _order_for_sections(questions)
    current_section = None
    for q in ordered:
        if q.qtype != current_section:
            parts.append(_line(_section_header(q.qtype)))
            current_section = q.qtype
        parts.extend(_render_question(q))

    parts.append("}\n")
    return "".join(parts)


def _order_for_sections(questions: List[Question]) -> List[Question]:
    mc = [q for q in questions if q.qtype == TYPE_MC]
    pr = [q for q in questions if q.qtype == TYPE_PROBLEM]
    ordered = mc + pr
    for i, q in enumerate(ordered, start=1):
        q.number = i  # consecutive across the bank; number is first visible char
    return ordered


def _render_question(q: Question) -> List[str]:
    lines: List[str] = []
    lines.append(_line("%d. %s" % (q.number, q.stem)))

    if q.qtype == TYPE_MC:
        for c in q.choices:
            lines.append(_line("%s. %s" % (c.letter, c.text)))

    # Metadata tags, each on its own line, in a stable order.
    lines.append(_line("%s %s" % (config.TAG_ANS, q.answer or
                                  config.ANSWER_PLACEHOLDER)))
    lines.append(_line("%s %s" % (config.TAG_DIF, q.difficulty or
                                  config.MIDDLE_TOKEN)))
    lines.append(_line("%s %s" % (config.TAG_PTS, q.points or
                                  config.DEFAULT_POINTS)))
    if q.reference:
        lines.append(_line("%s %s" % (config.TAG_REF, q.reference)))
    if q.objective:
        lines.append(_line("%s %s" % (config.TAG_OBJ, q.objective)))
    if q.topic:
        lines.append(_line("%s %s" % (config.TAG_TOP, q.topic)))
    if q.notes:
        lines.append(_line("%s %s" % (config.TAG_NOT, q.notes)))
    if q.narrative:
        lines.append(_line("%s %s" % (config.TAG_NAR, q.narrative)))
    return lines


def _clip(text: str, limit: int) -> str:
    text = re.sub(r"\s+", " ", _straighten(text or "")).strip()
    return text[:limit].rstrip() if len(text) > limit else text


def write_rtf(path: str, title: str, questions: List[Question],
              subtitle: Optional[str] = None) -> str:
    content = build_rtf(title, questions, subtitle)
    with open(path, "w", encoding="ascii", errors="strict") as fh:
        fh.write(content)
    return content


# --- validation -------------------------------------------------------------

_NUM_LINE = re.compile(r"^\d+[.)]?\s")
_OPT_LINE = re.compile(r"^[a-e]\.\s")
_TABLE_TOKENS = ("\\trowd", "\\cell", "\\intbl", "\\row")


def validate_rtf(content: str, expected_questions: int) -> List[str]:
    """Return a list of spec violations; empty list means valid."""
    problems: List[str] = []

    if not content.startswith("{\\rtf1"):
        problems.append("File does not start with a valid RTF header.")
    if not content.rstrip().endswith("}"):
        problems.append("RTF is not properly closed with '}'.")

    for token in _TABLE_TOKENS:
        if token in content:
            problems.append("RTF unexpectedly contains a table (%s)." % token)

    # Curly quotes must not survive (we straighten them).
    if any(ch in content for ch in "“”‘’"):
        problems.append("RTF contains smart/curly quotes; must be straight.")

    # Inspect the human-visible paragraphs.
    body = _visible_lines(content)
    if not body:
        problems.append("RTF has no content lines.")
        return problems

    title = body[0]
    if len(title) > config.MAX_TITLE_CHARS:
        problems.append("Title line exceeds %d characters."
                        % config.MAX_TITLE_CHARS)

    headers = {config.HEADER_MULTIPLE_CHOICE, config.HEADER_PROBLEM,
               "ESSAY", "TRUE/FALSE", "YES/NO", "COMPLETION", "SHORT ANSWER",
               "MATCHING", "NUMERIC RESPONSE"}
    if not any(line.strip() in headers for line in body):
        problems.append("No question-type section header found.")

    numbered = [l for l in body if _NUM_LINE.match(l)]
    if expected_questions and len(numbered) != expected_questions:
        problems.append("Expected %d numbered questions, found %d."
                        % (expected_questions, len(numbered)))

    # Every numbered question must be followed (eventually) by ANS and DIF.
    ans_count = sum(1 for l in body if l.startswith(config.TAG_ANS))
    dif_count = sum(1 for l in body if l.startswith(config.TAG_DIF))
    if expected_questions:
        if ans_count < expected_questions:
            problems.append("Some questions are missing an ANS: tag.")
        if dif_count < expected_questions:
            problems.append("Some questions are missing a DIF: tag.")

    # DIF tokens must be in the configured scale.
    for l in body:
        if l.startswith(config.TAG_DIF):
            tok = l[len(config.TAG_DIF):].strip()
            if tok not in config.SCALE_TOKENS:
                problems.append("DIF token '%s' is not in the difficulty scale."
                                % tok)
                break

    if len(numbered) > config.MAX_QUESTIONS_PER_BANK:
        problems.append("Bank exceeds the %d-question limit."
                        % config.MAX_QUESTIONS_PER_BANK)

    return problems


def _visible_lines(content: str) -> List[str]:
    """Reconstruct the human-visible text of each \\par paragraph."""
    # Drop the header group up to the first \pard, then split on \par.
    idx = content.find("\\pard")
    body = content[idx:] if idx != -1 else content
    # Split on the \par paragraph terminator only - never on \pard (which
    # contains the substring "\par" followed by a letter).
    paragraphs = re.split(r"\\par(?![a-zA-Z])", body)
    lines = []
    for para in paragraphs:
        text = _decode_rtf_paragraph(para)
        if text is not None and text.strip():
            lines.append(text.strip())
    return lines


def _decode_rtf_paragraph(para: str) -> Optional[str]:
    # Remove control words like \pard \plain \f0 \fs20, keep \uN fallbacks.
    # Replace \uN<fallback> with the fallback char.
    para = re.sub(r"\\u(-?\d+)\s?(.)", lambda m: m.group(2), para)
    # Unescape literal braces/backslash.
    para = para.replace("\\\\", "\\").replace("\\{", "{").replace("\\}", "}")
    # Strip remaining control words.
    para = re.sub(r"\\[a-zA-Z]+-?\d* ?", "", para)
    para = para.replace("{", "").replace("}", "")
    return para
