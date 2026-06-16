"""Plain-language run report and a separate review punch list.

Both are written as readable text files and also returned as strings for the
GUI summary screen.
"""

from collections import Counter
from typing import Dict, List

from . import config
from .difficulty import token_label
from .models import Question, TYPE_MC, TYPE_PROBLEM


def difficulty_distribution(questions: List[Question]) -> Dict[str, int]:
    counts = Counter(q.difficulty or config.MIDDLE_TOKEN for q in questions)
    return {tok: counts.get(tok, 0) for tok in config.SCALE_TOKENS}


def type_counts(questions: List[Question]) -> Dict[str, int]:
    return {
        "Multiple choice": sum(1 for q in questions if q.qtype == TYPE_MC),
        "Free response (PROBLEM)": sum(1 for q in questions
                                       if q.qtype == TYPE_PROBLEM),
    }


def review_count(questions: List[Question]) -> int:
    return sum(1 for q in questions if q.needs_review)


def summary_text(questions: List[Question], title: str,
                 ocr_required: bool = False) -> str:
    lines = ["Summary", "=======", "", 'Bank title: "%s"' % title, ""]

    lines.append("Questions found: %d" % len(questions))
    for label, count in type_counts(questions).items():
        lines.append("  - %s: %d" % (label, count))
    lines.append("")

    lines.append("Difficulty distribution:")
    dist = difficulty_distribution(questions)
    for tok in config.SCALE_TOKENS:
        lines.append("  - %s (%s): %d" % (tok, token_label(tok), dist[tok]))
    lines.append("")

    needs = review_count(questions)
    lines.append("Questions needing your review: %d" % needs)
    if ocr_required:
        lines.append("")
        lines.append("NOTE: This PDF looks scanned (image-only). Text could not "
                     "be read reliably and OCR is required.")
    return "\n".join(lines)


def run_report_text(questions: List[Question], title: str,
                    source_name: str, output_files: List[str],
                    warnings: List[str]) -> str:
    lines = []
    lines.append("PHYSICS QUESTION BANK - RUN REPORT")
    lines.append("=" * 40)
    lines.append("")
    lines.append("Source PDF: %s" % source_name)
    lines.append('Bank title: "%s"' % title)
    lines.append("")
    lines.append(summary_text(questions, title))
    lines.append("")

    if output_files:
        lines.append("Files written:")
        for path in output_files:
            lines.append("  - %s" % path)
        lines.append("")

    if warnings:
        lines.append("Document notes:")
        for w in warnings:
            lines.append("  - %s" % w)
        lines.append("")

    lines.append("Per-question difficulty and signals:")
    lines.append("-" * 40)
    for q in questions:
        lines.append("Q%d [%s]  DIF=%s (%s)%s" % (
            q.number,
            "MC" if q.qtype == TYPE_MC else "FR",
            q.difficulty,
            token_label(q.difficulty),
            "" if q.difficulty_confident else "  <-- low confidence",
        ))
        if q.difficulty_signals:
            lines.append("    signals: " + "; ".join(q.difficulty_signals))
    lines.append("")

    return "\n".join(lines)


def punch_list_text(questions: List[Question]) -> str:
    flagged = [q for q in questions if q.needs_review]
    lines = []
    lines.append("REVIEW PUNCH LIST")
    lines.append("=" * 40)
    lines.append("")
    if not flagged:
        lines.append("Nothing needs manual attention. Every question has an "
                     "answer, enough options, and readable text.")
        return "\n".join(lines)

    lines.append("%d question(s) need a quick look before you rely on them:"
                 % len(flagged))
    lines.append("")
    for q in flagged:
        preview = (q.stem[:70] + "...") if len(q.stem) > 70 else q.stem
        lines.append("Q%d (%s): %s" % (
            q.number, "MC" if q.qtype == TYPE_MC else "Free response", preview))
        for flag in q.flags:
            lines.append("    - %s" % flag)
        lines.append("")
    return "\n".join(lines)
