"""PDF -> per-page text lines.

LIBRARY CHOICE: PyMuPDF (fitz) over pdfplumber.
  * PyMuPDF exposes geometric text "blocks" with coordinates, which lets us
    reconstruct reading order and split multi-column layouts reliably.
  * It reports per-page image coverage, so we can detect image-only (scanned)
    PDFs and equation-as-image content that would otherwise extract as blanks.
  * It is significantly faster and has fewer native dependencies, which matters
    for a small PyInstaller onefile the teacher double-clicks.
  * pdfplumber excels at *tables*, but the ExamView spec forbids tables and we
    actively want flowing text, so its main strength is irrelevant here.

PyMuPDF is imported lazily so the rest of the package (parser, difficulty, RTF)
can be unit-tested without the native library installed.
"""

from typing import List, Tuple

# Fraction of a page that must be covered by images (and have almost no text)
# for the page to count as "scanned / image-only".
_IMAGE_PAGE_TEXT_THRESHOLD = 20      # characters
_SCANNED_PAGE_FRACTION = 0.6         # of pages that look scanned -> OCR needed

# Multi-column detection: if text blocks cluster into two well-separated x-bands.
_COLUMN_GAP_FRACTION = 0.15          # of page width


class PdfExtractionError(Exception):
    """Raised with a plain-language, teacher-friendly message."""


def _import_fitz():
    try:
        import fitz  # PyMuPDF
        return fitz
    except Exception as exc:  # pragma: no cover - environment dependent
        raise PdfExtractionError(
            "The PDF engine (PyMuPDF) is not available. If you are running the "
            "packaged app this is a build problem; please reinstall the app."
        ) from exc


def extract_pages(pdf_path: str) -> Tuple[List[List[str]], bool]:
    """Return (pages, ocr_required).

    `pages` is a list (one per page) of text lines in reading order. If the PDF
    appears to be scanned images with no extractable text, `ocr_required` is
    True and `pages` will be mostly empty.
    """
    fitz = _import_fitz()

    try:
        doc = fitz.open(pdf_path)
    except Exception as exc:
        raise PdfExtractionError(
            "This file could not be opened as a PDF. It may be corrupted, "
            "password-protected, or not actually a PDF. Try re-saving or "
            "re-exporting it as a PDF and convert again."
        ) from exc

    if doc.page_count == 0:
        doc.close()
        raise PdfExtractionError("This PDF has no pages.")

    pages: List[List[str]] = []
    scanned_pages = 0

    for page in doc:
        try:
            lines = _extract_page_lines(page)
        except Exception:
            lines = []

        text_len = sum(len(l) for l in lines)
        has_images = bool(page.get_images(full=True))
        if text_len < _IMAGE_PAGE_TEXT_THRESHOLD and has_images:
            scanned_pages += 1

        pages.append(lines)

    page_count = doc.page_count
    doc.close()

    ocr_required = (page_count > 0 and
                    scanned_pages / page_count >= _SCANNED_PAGE_FRACTION)
    return pages, ocr_required


def _extract_page_lines(page) -> List[str]:
    """Extract one page's text as ordered lines, handling simple 2-column."""
    data = page.get_text("dict")
    page_width = page.rect.width or 1.0

    spans = []  # (x0, y0, text)
    for block in data.get("blocks", []):
        if block.get("type", 0) != 0:  # 0 == text block
            continue
        for line in block.get("lines", []):
            text = "".join(span.get("text", "") for span in line.get("spans", []))
            if not text.strip():
                continue
            bbox = line.get("bbox", [0, 0, 0, 0])
            spans.append((bbox[0], bbox[1], text))

    if not spans:
        return []

    column_split = _detect_column_split(spans, page_width)
    if column_split is not None:
        left = [s for s in spans if s[0] < column_split]
        right = [s for s in spans if s[0] >= column_split]
        ordered = (sorted(left, key=lambda s: (round(s[1], 1), s[0])) +
                   sorted(right, key=lambda s: (round(s[1], 1), s[0])))
    else:
        ordered = sorted(spans, key=lambda s: (round(s[1], 1), s[0]))

    return [s[2].rstrip() for s in ordered]


def _detect_column_split(spans, page_width):
    """Return an x coordinate splitting two columns, or None for single column."""
    if len(spans) < 8:
        return None
    xs = sorted(s[0] for s in spans)
    mid = page_width / 2.0
    left = [x for x in xs if x < mid]
    right = [x for x in xs if x >= mid]
    # Need a healthy population on both sides and a clear gutter between them.
    if len(left) < 3 or len(right) < 3:
        return None
    gap = min(right) - max(left)
    if gap >= _COLUMN_GAP_FRACTION * page_width:
        return mid
    return None
