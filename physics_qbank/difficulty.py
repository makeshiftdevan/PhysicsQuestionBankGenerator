"""Deterministic, fully offline difficulty scorer.

No network, no randomness: the same question text always yields the same
rating. Every weight and threshold lives in config.py so the rubric can be
retuned (or switched to a 1-5 scale) without touching this logic.

Returns the scale token to write into DIF: plus the list of signals that fired
(for the run report) and a confidence flag.
"""

import re
from typing import List, Tuple

from . import config
from .cleaner import readable_ratio


def _word_present(text: str, phrase: str) -> bool:
    """Whole-word / phrase match (case-insensitive)."""
    return re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text) is not None


# A numeric quantity followed by a unit, e.g. "5 m", "9.8 m/s^2", "200 N".
_GIVEN_RE = re.compile(
    r"(?<![\w.])\d+(?:\.\d+)?\s*"
    r"(?:m/s\^?2|m/s|km/h|kg|m\b|s\b|n\b|j\b|w\b|v\b|a\b|c\b|hz|"
    r"rad|deg|°|ohm|pa|mol|k\b|cm|mm|km|g\b|ms)",
    re.IGNORECASE,
)

# Labelled parts (a) (b) (c) or a. b. c. at line starts for free response.
_PART_RE = re.compile(r"(?:^|\n)\s*\(?([a-h])\)?[.)]", re.IGNORECASE)

# A "variable answer" looks symbolic: letters and operators, no standalone
# number-with-unit. Used as a weak symbolic cue from the answer text.
_VARIABLE_ANSWER_RE = re.compile(r"[a-zA-Z]\s*[=/^]\s*[a-zA-Z(]")


def _verb_score(text: str) -> Tuple[float, str]:
    """Highest-level cognitive verb wins; higher order dominates."""
    if any(_word_present(text, v) for v in config.VERBS_HIGH):
        return config.W_VERB_HIGH, "higher-order verb"
    if any(_word_present(text, v) for v in config.VERBS_COMPUTE):
        return config.W_VERB_MED, "computation verb"
    if any(_word_present(text, v) for v in config.VERBS_RECALL):
        return config.W_VERB_LOW, "recall verb"
    return config.W_VERB_MED, "no explicit verb (assumed computation)"


def _count_givens(text: str) -> int:
    return len(_GIVEN_RE.findall(text))


def _math_load(text: str) -> int:
    count = 0
    for sym in config.MATH_SYMBOLS:
        count += text.count(sym)
    for fn in config.MATH_FUNCTIONS:
        count += len(re.findall(r"(?<!\w)" + fn + r"(?!\w)", text, re.IGNORECASE))
    # Fractions / exponents written in plain text.
    count += len(re.findall(r"\d+\s*/\s*\d+", text))
    return count


def _count_parts(text: str) -> int:
    letters = [m.group(1).lower() for m in _PART_RE.finditer(text)]
    # Only count if they form a plausible (a),(b),(c)... sequence start.
    distinct = sorted(set(letters))
    return len(distinct) if len(distinct) >= 2 else 0


def _distinct_domains(text: str) -> List[str]:
    hits = []
    for domain, keywords in config.PHYSICS_DOMAINS.items():
        if any(kw in text for kw in keywords):
            hits.append(domain)
    return hits


def score_question(stem: str, answer_text: str = "",
                   qtype: str = "") -> Tuple[str, List[str], bool]:
    """Return (difficulty_token, fired_signals, confident)."""
    text = (stem or "").strip()
    lower = text.lower()
    signals: List[str] = []

    # Confidence gate: too short or too garbled -> middle level, flagged.
    if len(text) < config.MIN_STEM_CHARS_FOR_SCORING or \
            readable_ratio(text) < config.GARBLED_READABLE_RATIO:
        return config.MIDDLE_TOKEN, ["low-confidence: garbled/short stem"], False

    raw = 0.0

    # 1. Cognitive verb level
    v_score, v_label = _verb_score(lower)
    raw += v_score
    signals.append(v_label)

    # 2. Symbolic derivation cues (strong)
    symbolic = any(_word_present(lower, cue) for cue in config.SYMBOLIC_CUES)
    if not symbolic and answer_text and _VARIABLE_ANSWER_RE.search(answer_text) \
            and not _GIVEN_RE.search(answer_text):
        symbolic = True
    if symbolic:
        raw += config.W_SYMBOLIC
        signals.append("symbolic derivation")

    # 3. Number of distinct given quantities
    givens = _count_givens(text)
    if givens:
        contribution = min(givens * config.W_PER_GIVEN, config.W_GIVENS_CAP)
        raw += contribution
        signals.append(f"{givens} given quantity/quantities")

    # 4. Math load
    math = _math_load(text)
    if math:
        contribution = min(math * config.W_PER_MATH, config.W_MATH_CAP)
        raw += contribution
        signals.append(f"math load ({math} tokens)")

    # 5. Multi-part structure (free response)
    parts = _count_parts(text)
    if parts:
        contribution = min(parts * config.W_PER_PART, config.W_PARTS_CAP)
        raw += contribution
        signals.append(f"{parts} labelled parts")

    # 6. Multi-concept synthesis
    domains = _distinct_domains(lower)
    if len(domains) >= 2:
        raw += config.W_SYNTHESIS
        signals.append("multi-domain synthesis (" + ", ".join(domains) + ")")

    # 7. Representation interpretation
    if any(cue in lower for cue in config.REPRESENTATION_CUES):
        raw += config.W_REPRESENTATION
        signals.append("references a figure/graph")

    # 8. Negative / exception phrasing (MC mainly) - match the capitalized form
    if any(re.search(r"(?<!\w)" + w.upper() + r"(?!\w)", text)
           for w in config.NEGATIVE_PHRASING):
        raw += config.W_NEGATIVE_PHRASING
        signals.append("negative/exception phrasing")

    # 9. Length / clause count weak tiebreaker
    clauses = text.count(",") + text.count(";") + 1
    if len(text) > 240 or clauses >= 4:
        raw += config.W_LENGTH_TIEBREAK
        signals.append("long multi-clause stem (tiebreaker)")

    token = _bucket(raw)
    return token, signals, True


def _bucket(raw_score: float) -> str:
    normalized = max(0.0, min(1.0, raw_score / config.SCORE_NORMALIZER))
    for i, threshold in enumerate(config.SCALE_THRESHOLDS):
        if normalized < threshold:
            return config.SCALE_TOKENS[i]
    return config.SCALE_TOKENS[-1]


def token_label(token: str) -> str:
    """Human-readable label for a scale token (for the report)."""
    try:
        return config.SCALE_LABELS[config.SCALE_TOKENS.index(token)]
    except (ValueError, IndexError):
        return token
