"""Turn raw extracted page text into clean, de-boilerplated lines.

Responsibilities:
  * drop boilerplate / scoring-guide noise (Page X of Y, "4 points:", etc.)
  * remove repeating page headers and footers
  * de-duplicate blocks the source prints twice (common in scoring guides)
  * fix soft hyphenation and obvious mid-sentence line wraps

Everything here works on plain text, so it is fully unit-testable without a PDF.
"""

import re
from typing import List

from . import config

_BOILERPLATE = [re.compile(p, re.IGNORECASE) for p in config.BOILERPLATE_PATTERNS]

# A line that is mostly punctuation / dots (e.g. a leader line "......") is noise.
_LEADER_LINE = re.compile(r"^[\s.\-_·•]{6,}$")

# Replacement / unknown glyphs that survive bad extraction.
_UNKNOWN_GLYPHS = "�□"


def is_boilerplate(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if _LEADER_LINE.match(stripped):
        return True
    for pat in _BOILERPLATE:
        if pat.match(stripped):
            return True
    return False


def find_repeating_lines(pages: List[List[str]]) -> set:
    """Identify header/footer lines that repeat across many pages.

    A line counts as repeating only if its normalized form appears on at least
    REPEAT_HEADER_FRACTION of the pages. We ignore lines that look like real
    question content (start with a number) so we never delete a question.
    """
    if len(pages) < 2:
        return set()

    counts = {}
    for page in pages:
        seen_on_page = set()
        for line in page:
            key = _normalize_for_repeat(line)
            if not key or key in seen_on_page:
                continue
            seen_on_page.add(key)
            counts[key] = counts.get(key, 0) + 1

    threshold = max(2, int(len(pages) * config.REPEAT_HEADER_FRACTION))
    repeating = set()
    for key, count in counts.items():
        if count >= threshold and not _looks_like_question(key):
            repeating.add(key)
    return repeating


def _normalize_for_repeat(line: str) -> str:
    # Collapse whitespace and digits so "Page 3" and "Page 4" match as headers.
    norm = re.sub(r"\d+", "#", line.strip().lower())
    norm = re.sub(r"\s+", " ", norm)
    return norm


def _looks_like_question(normalized: str) -> bool:
    # After digit-masking a numbered question starts with "#." or "#)".
    return bool(re.match(r"^#\s*[.)]", normalized))


def repeated_heading_title(pages: List[List[str]]) -> str:
    """Return a repeated document heading that looks like a bank title, if any.

    The repeated header line (e.g. "Unit 2 Test: Forces and Motion") is the best
    title source, but clean_pages strips it as a repeating header - so we surface
    it here before cleaning.
    """
    repeating = find_repeating_lines(pages)
    if not repeating:
        return ""
    title_kw = re.compile(
        r"\b(unit|test|quiz|exam|chapter|midterm|final|review|assessment)\b",
        re.IGNORECASE)
    # Map normalized keys back to a representative original line.
    for page in pages:
        for line in page:
            if _normalize_for_repeat(line) in repeating and title_kw.search(line):
                return re.sub(r"\s+", " ", line).strip()
    return ""


def clean_pages(pages: List[List[str]]) -> List[str]:
    """Flatten pages into one cleaned list of logical lines."""
    repeating = find_repeating_lines(pages)

    cleaned: List[str] = []
    for page in pages:
        for line in page:
            if is_boilerplate(line):
                continue
            if _normalize_for_repeat(line) in repeating:
                continue
            cleaned.append(line)

    cleaned = _dedupe_blocks(cleaned)
    cleaned = _fix_hyphenation_and_wraps(cleaned)
    return cleaned


def _dedupe_blocks(lines: List[str], window: int = 6) -> List[str]:
    """Remove consecutive duplicate blocks (scoring guides repeat rubrics).

    We look for a run of identical lines immediately followed by the same run
    and drop the second copy. Kept deliberately conservative so we only remove
    true back-to-back duplication, never legitimately repeated short words.
    """
    norm = [re.sub(r"\s+", " ", l.strip().lower()) for l in lines]
    n = len(lines)
    keep = [True] * n
    i = 0
    while i < n:
        matched = False
        # size 1 catches a single rubric line printed twice in a row; larger
        # sizes catch repeated multi-line rubric blocks.
        for size in range(window, 0, -1):
            if i + 2 * size > n:
                continue
            first = norm[i:i + size]
            second = norm[i + size:i + 2 * size]
            # Require the block to carry some substance, not blank lines.
            if first == second and any(len(x) > 8 for x in first):
                for j in range(i + size, i + 2 * size):
                    keep[j] = False
                i += 2 * size
                matched = True
                break
        if not matched:
            i += 1
    return [lines[k] for k in range(n) if keep[k]]


# A line that clearly ends a thought; we should NOT merge the next line into it.
_SENTENCE_END = re.compile(r"[.!?:;)\]]\s*$")
# A new question / option / part marker; never merge these upward.
_NEW_ITEM = re.compile(r"^\s*(\d+\s*[.)]|[a-eA-E]\s*[.)]|\([a-e]\))")


def _fix_hyphenation_and_wraps(lines: List[str]) -> List[str]:
    out: List[str] = []
    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            out.append("")
            continue

        if out and out[-1].endswith("-") and not out[-1].endswith("--"):
            # Soft hyphen at end of previous line: join the word halves.
            prev = out[-1][:-1]
            # Only glue directly if the continuation starts lowercase (a word
            # split), otherwise keep a space.
            joiner = "" if line[:1].islower() else " "
            out[-1] = prev + joiner + line.lstrip()
            continue

        if (out and out[-1].strip() and not _SENTENCE_END.search(out[-1])
                and not _NEW_ITEM.match(line)):
            # Previous line did not end a sentence and this is not a new item:
            # treat as a wrapped continuation and join with a space.
            if _looks_like_continuation(out[-1], line):
                out[-1] = out[-1].rstrip() + " " + line.lstrip()
                continue

        out.append(line)
    return out


# Lines that begin answer/solution/rubric metadata must never be glued onto a
# wrapped stem above them.
_META_LEAD = re.compile(
    r"^\s*(ans(?:wer)?\b|correct answer\b|solution\b|model answer\b|"
    r"worked solution\b|explanation\b|rationale\b|correct\.|"
    r"\d+\s*points?\b)", re.IGNORECASE)


def _looks_like_continuation(prev: str, cur: str) -> bool:
    cur_s = cur.strip()
    # Don't merge if the current line starts a metadata tag or a header.
    if re.match(r"^[A-Z]{2,4}:", cur_s):
        return False
    if _META_LEAD.match(cur_s):
        return False
    if cur_s.isupper() and len(cur_s) > 3:
        return False
    return True


def readable_ratio(text: str) -> float:
    """Fraction of characters that are not unknown/replacement glyphs."""
    if not text:
        return 0.0
    bad = sum(1 for ch in text if ch in _UNKNOWN_GLYPHS)
    return 1.0 - bad / len(text)
