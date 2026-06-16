"""Shared data structures passed between the pipeline stages."""

from dataclasses import dataclass, field
from typing import List, Optional


# Question type tokens used internally and mapped to RTF section headers.
TYPE_MC = "MC"
TYPE_PROBLEM = "PROBLEM"


@dataclass
class Choice:
    """One multiple-choice option."""
    letter: str            # 'a', 'b', ...
    text: str
    is_correct: bool = False


@dataclass
class Question:
    """A single reconstructed question plus everything ExamView needs."""

    number: int                       # display number within its bank
    qtype: str                        # TYPE_MC or TYPE_PROBLEM
    stem: str                         # the cleaned question text
    choices: List[Choice] = field(default_factory=list)

    # Metadata destined for the RTF tags.
    answer: str = ""                  # ANS:  (letter for MC, solution for PROBLEM)
    difficulty: str = ""              # DIF:
    points: str = ""                  # PTS:
    reference: str = ""               # REF:
    objective: str = ""               # OBJ:
    topic: str = ""                   # TOP:
    notes: str = ""                   # NOT:  (explanation / rationale / rubric)
    narrative: str = ""               # NAR:  (shared setup, when grouped)

    # Bookkeeping for the report / punch list.
    flags: List[str] = field(default_factory=list)        # human-readable issues
    difficulty_signals: List[str] = field(default_factory=list)
    difficulty_confident: bool = True
    shared_setup_prepended: bool = False

    def add_flag(self, message: str) -> None:
        if message not in self.flags:
            self.flags.append(message)

    @property
    def needs_review(self) -> bool:
        return bool(self.flags)


@dataclass
class ParseResult:
    """Everything the parser produced from one PDF."""
    questions: List[Question] = field(default_factory=list)
    title: str = ""
    warnings: List[str] = field(default_factory=list)        # document-level notes
    ocr_required: bool = False
    raw_text_empty: bool = False
