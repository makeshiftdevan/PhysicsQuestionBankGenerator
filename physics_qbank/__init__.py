"""Physics Question Bank Generator.

Converts a PDF of exam questions into an ExamView-compatible RTF import file
(and, where possible, a .bnk via ExamView's own Import Utility).

The package is split into small, independently testable modules:

    config      - all tunable constants (difficulty scale, weights, tags)
    pdf_extract - PDF -> clean page text (PyMuPDF), header/footer/OCR handling
    cleaner     - boilerplate stripping, de-hyphenation, de-duplication
    parser      - segment text into typed questions with answers/setups
    difficulty  - deterministic, offline difficulty scorer
    rtf_writer  - spec-compliant ExamView RTF generation + validation
    bnk         - detect/invoke the ExamView Import Utility; walkthrough text
    report      - plain-language run report + review punch list
    pipeline    - orchestrates the whole conversion
    gui         - Tkinter front-end (no command line required)
"""

__version__ = "1.0.0"
