# Physics Question Bank Generator

A small desktop tool that turns **one PDF of exam questions** into:

1. An **ExamView import file (RTF)** the teacher can open, edit (difficulty,
   explanations, references, points…), and re-import.
2. An **ExamView question bank (`.bnk`)** — created automatically *only* if
   ExamView's own Import Utility is installed, otherwise the tool walks you
   through the one-time import (it never writes a fake `.bnk`).

It handles multiple choice, free response, or both in the same file, including
messy answer keys and scoring guides (rubrics, point values, worked solutions).

---

## For the teacher (no setup, no command line)

1. Double-click **PhysicsQuestionBankGenerator** (the app).
2. Click **Browse** and pick your PDF (or drag it onto the window).
3. Click **Convert**.
4. Read the short summary (how many questions, the difficulty mix, how many
   need a quick look). Fix the **bank title** if you like, then click
   **Confirm and save**.
5. The tool shows you where the files are, a **review punch list** of anything
   that needs your attention, and — if needed — the simple steps to turn the
   RTF into a `.bnk` in ExamView. Click **Open output folder** to see them.

Files are saved in your user folder (on Windows: `%APPDATA%\PhysicsQuestionBankGenerator\output`),
never next to the app.

### Turning the RTF into a `.bnk` (one time per file)

If the tool could not make the `.bnk` automatically:

1. Open **ExamView Test Generator** (or the ExamView Import Utility).
2. Choose **File → Import → Import from RTF/Text** (older versions: the
   Question Bank Wizard, then *Import questions*).
3. Select the `.rtf` file from the output folder.
4. Confirm the question-type sections (**MULTIPLE CHOICE** and **PROBLEM**) and
   that the tags (ANS, DIF, PTS, NOT) are recognized.
5. Finish the wizard, then **File → Save As** and save the new `.bnk`.

> Why not write the `.bnk` directly? The `.bnk` format is proprietary and
> undocumented. The only reliable way to make a valid one is through ExamView's
> own importer, so that is exactly what this tool uses.

---

## What the tool does under the hood

- **Reads the PDF** with PyMuPDF (chosen over pdfplumber for reliable reading
  order, multi-column handling, and scanned-page detection — see
  `physics_qbank/pdf_extract.py`).
- **Cleans** repeating headers/footers, "Page X of Y", scoring-guide noise
  ("4 points:", "Part a. [0-4]", "0 1 2 3 4 5"), de-duplicates rubrics printed
  twice, and fixes hyphenation/line wraps.
- **Parses** each question, detecting its type individually and routing MC to a
  `MULTIPLE CHOICE` section and free response to a `PROBLEM` section. It finds
  answers from a separate key, an inline `ANS:`/`Answer C`, or an asterisk.
  **If no answer is in the text (e.g. it was only highlighted), it writes a
  clear placeholder and flags the question — it never guesses.**
- **Assigns difficulty** with a deterministic, fully offline rubric (no
  network). The same question always gets the same rating. All weights and
  thresholds live at the top of `physics_qbank/config.py` and the scale
  (default `1/2/3` = Easy/Moderate/Hard) can be swapped without touching logic.
- **Writes spec-compliant RTF** (plain paragraphs, straight quotes, one `\par`
  per line, no tables, non-ASCII emitted as `\u` escapes with readable
  fallbacks) and **validates it** before reporting success.
- **Splits** banks over 250 questions into `part 1`, `part 2`, … files.
- Produces a **run report** and a **review punch list**.

Images are never imported (ExamView text import does not support them): the
text is kept, a placeholder is written into `NOT:`, and the question is flagged.

---

## Running from source (developers)

```bash
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
python main.py
```

Run the tests (they cover the offline core and need no PDF/GUI libraries):

```bash
python -m unittest discover -s tests
```

## Building the standalone executable

**Recommended — one command, works from any directory:**

```bash
pip install -r requirements.txt pyinstaller
python build.py
# result: dist/PhysicsQuestionBankGenerator(.exe)
```

`build.py` changes into its own folder, wipes any stale `build/`/`dist/` cache,
puts the project on the import path, and force-collects the whole package — so
it cannot produce the `ModuleNotFoundError` below.

Equivalent manual build (must be run **from the project root**):

```bash
pyinstaller build.spec
```

The teacher needs no Python install — just the produced executable. Build on a
machine with standard Python (Tkinter is included with the official installers).

> **`ModuleNotFoundError: No module named 'physics_qbank'` in the built exe?**
> The build did not bundle the package — almost always because `pyinstaller`
> was run from another directory or reused a stale `build/` cache from an
> earlier failed attempt. Fix: delete `build/` and `dist/` and run
> `python build.py` (it passes `--clean` and pins all paths). Do **not** build
> with `pyinstaller main.py`.

### Optional drag-and-drop

The **Browse** button always works. To also enable dragging a PDF onto the
window, install the optional helper before building:

```bash
pip install tkinterdnd2
```

---

## Project layout

```
main.py                     entry point (opens the GUI)
build.spec                  PyInstaller one-file build
requirements.txt
physics_qbank/
  config.py                 all tunable constants (scale, weights, tags, limits)
  models.py                 Question / Choice / result dataclasses
  pdf_extract.py            PDF -> page text (PyMuPDF); OCR/column detection
  cleaner.py                boilerplate stripping, de-dup, de-hyphenation
  parser.py                 segment text into typed questions + answers/setups
  difficulty.py             deterministic offline difficulty scorer
  rtf_writer.py             ExamView RTF generation + spec validation
  bnk.py                    detect/invoke ExamView Import Utility; walkthrough
  report.py                 run report + review punch list
  pipeline.py               orchestration (analyze -> confirm -> write)
  gui.py                    Tkinter front-end
tests/
  test_pipeline.py          unit tests for the offline core
```

## Limitations (by design)

- Scanned / image-only PDFs need OCR first; the tool detects this and tells you.
- Math or answer choices rendered as images extract as blank/garbled; those
  questions are flagged for manual entry, never silently passed off as complete.
- The tool is offline and cannot verify physics, so it never invents answers or
  explanations — it only carries over what is in the source.
