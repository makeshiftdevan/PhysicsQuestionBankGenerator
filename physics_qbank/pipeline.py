"""Orchestrates the full conversion: PDF -> questions -> RTF (-> .bnk).

Split into two phases so the GUI can show a summary and get confirmation
between them:

    analyze(pdf_path)            -> Analysis  (no files written yet)
    write_outputs(analysis, ..)  -> WriteResult (files on disk)
"""

import os
import re
from dataclasses import dataclass, field
from typing import List, Optional

from . import config, report
from .bnk import BnkResult, try_make_bnk
from .cleaner import clean_pages, repeated_heading_title
from .difficulty import score_question
from .models import ParseResult, Question
from .parser import parse
from .pdf_extract import PdfExtractionError, extract_pages
from .rtf_writer import validate_rtf, write_rtf


@dataclass
class Analysis:
    pdf_path: str
    title: str
    questions: List[Question] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    ocr_required: bool = False
    error: Optional[str] = None       # plain-language fatal error, if any

    @property
    def ok(self) -> bool:
        return self.error is None and bool(self.questions)


@dataclass
class WriteResult:
    output_dir: str
    rtf_files: List[str] = field(default_factory=list)
    report_file: str = ""
    punch_list_file: str = ""
    bnk_results: List[BnkResult] = field(default_factory=list)
    validation_problems: List[str] = field(default_factory=list)
    error: Optional[str] = None


# --- phase 1: analyze -------------------------------------------------------

def analyze(pdf_path: str) -> Analysis:
    title_fallback = _title_from_filename(pdf_path)
    analysis = Analysis(pdf_path=pdf_path, title=title_fallback)

    if not os.path.isfile(pdf_path):
        analysis.error = "That file could not be found. Please pick the PDF again."
        return analysis
    if os.path.getsize(pdf_path) == 0:
        analysis.error = "That PDF is empty (0 bytes). Try re-exporting it."
        return analysis

    try:
        pages, ocr_required = extract_pages(pdf_path)
    except PdfExtractionError as exc:
        analysis.error = str(exc)
        return analysis
    except Exception:
        analysis.error = ("Something went wrong reading this PDF. It may be "
                          "damaged. Try re-saving it as a PDF and convert again.")
        return analysis

    analysis.ocr_required = ocr_required
    if ocr_required:
        analysis.error = (
            "This PDF looks scanned (it is made of page images, not text). "
            "ExamView import needs real text. Please run OCR first - for "
            "example, open it in Adobe Acrobat and choose "
            "'Scan & OCR > Recognize Text', save, and convert the new file.")
        return analysis

    # A repeated document heading is the best title source, but cleaning strips
    # it as a repeating header - capture it first and prefer it over the filename.
    heading_title = repeated_heading_title(pages)
    cleaned = clean_pages(pages)
    parsed: ParseResult = parse(
        cleaned, fallback_title=heading_title or title_fallback)

    if parsed.raw_text_empty:
        analysis.error = ("No readable text was found in this PDF. If it is a "
                          "scan, it needs OCR first.")
        return analysis
    if not parsed.questions:
        analysis.error = ("No numbered questions were found. Make sure each "
                          "question starts with a number (like '1.' or '1)'). "
                          "If the questions are images, they cannot be imported.")
        analysis.warnings = parsed.warnings
        return analysis

    if parsed.title:
        analysis.title = parsed.title
    analysis.warnings = parsed.warnings

    _assign_difficulty(parsed.questions)
    analysis.questions = parsed.questions
    return analysis


def _assign_difficulty(questions: List[Question]) -> None:
    for q in questions:
        answer_text = q.answer if q.answer != config.ANSWER_PLACEHOLDER else ""
        token, signals, confident = score_question(q.stem, answer_text, q.qtype)
        q.difficulty = token
        q.difficulty_signals = signals
        q.difficulty_confident = confident
        if not confident:
            q.add_flag("Low-confidence difficulty (garbled text) - please "
                       "review the rating.")


# --- phase 2: write ---------------------------------------------------------

def write_outputs(analysis: Analysis, output_dir: str,
                  title_override: Optional[str] = None) -> WriteResult:
    result = WriteResult(output_dir=output_dir)
    try:
        os.makedirs(output_dir, exist_ok=True)
    except Exception:
        result.error = ("The output folder could not be created. Check that "
                        "you have permission to write there.")
        return result

    title = (title_override or analysis.title or "Question Bank").strip()
    title = title[:config.MAX_TITLE_CHARS]
    base = _safe_filename(title) or "question_bank"

    chunks = _split_questions(analysis.questions)
    multi = len(chunks) > 1

    try:
        for i, chunk in enumerate(chunks, start=1):
            if multi:
                rtf_name = "%s - part %d.rtf" % (base, i)
                bnk_name = "%s - part %d.bnk" % (base, i)
                chunk_title = "%s (part %d)" % (title, i)
                chunk_title = chunk_title[:config.MAX_TITLE_CHARS]
            else:
                rtf_name = "%s.rtf" % base
                bnk_name = "%s.bnk" % base
                chunk_title = title

            rtf_path = os.path.join(output_dir, rtf_name)
            content = write_rtf(rtf_path, chunk_title, chunk)
            result.rtf_files.append(rtf_path)

            problems = validate_rtf(content, expected_questions=len(chunk))
            if problems:
                result.validation_problems.extend(
                    "%s: %s" % (rtf_name, p) for p in problems)

            bnk_path = os.path.join(output_dir, bnk_name)
            result.bnk_results.append(try_make_bnk(rtf_path, bnk_path))
    except Exception:
        result.error = ("The output files could not be written. Make sure the "
                        "folder is not open in another program and try again.")
        return result

    # Reports cover the whole run.
    report_path = os.path.join(output_dir, "%s - run report.txt" % base)
    punch_path = os.path.join(output_dir, "%s - review punch list.txt" % base)
    try:
        with open(report_path, "w", encoding="utf-8") as fh:
            fh.write(report.run_report_text(
                analysis.questions, title, os.path.basename(analysis.pdf_path),
                result.rtf_files, analysis.warnings))
        with open(punch_path, "w", encoding="utf-8") as fh:
            fh.write(report.punch_list_text(analysis.questions))
        result.report_file = report_path
        result.punch_list_file = punch_path
    except Exception:
        pass  # reports are helpful but not fatal

    return result


def _split_questions(questions: List[Question]) -> List[List[Question]]:
    limit = config.MAX_QUESTIONS_PER_BANK
    if len(questions) <= limit:
        return [questions]
    return [questions[i:i + limit] for i in range(0, len(questions), limit)]


# --- helpers ----------------------------------------------------------------

def _title_from_filename(pdf_path: str) -> str:
    name = os.path.splitext(os.path.basename(pdf_path))[0]
    name = re.sub(r"[_\-]+", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    name = re.sub(r"\b(\w)", lambda m: m.group(1).upper(), name)
    return name[:config.MAX_TITLE_CHARS] or "Question Bank"


def _safe_filename(name: str) -> str:
    safe = re.sub(r'[<>:"/\\|?*]+', "", name).strip()
    safe = re.sub(r"\s+", " ", safe)
    return safe[:120]


def default_output_dir() -> str:
    """A stable per-user output directory (never next to the executable)."""
    if os.name == "nt":
        base = os.environ.get("APPDATA") or os.path.expanduser("~")
    else:
        base = os.environ.get("XDG_DATA_HOME") or os.path.join(
            os.path.expanduser("~"), ".local", "share")
    return os.path.join(base, config.APP_DIR_NAME, config.OUTPUT_SUBDIR)
