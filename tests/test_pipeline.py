"""Unit tests for the offline core: cleaner, parser, difficulty, RTF.

These run without PyMuPDF or Tkinter so they exercise everything that does the
real work on extracted text. Run with:  python -m pytest tests  (or unittest).
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from physics_qbank import config
from physics_qbank.cleaner import (clean_pages, find_repeating_lines,
                                    is_boilerplate)
from physics_qbank.difficulty import score_question
from physics_qbank.models import TYPE_MC, TYPE_PROBLEM
from physics_qbank.parser import parse
from physics_qbank.rtf_writer import build_rtf, validate_rtf


class TestCleaner(unittest.TestCase):
    def test_boilerplate_detection(self):
        self.assertTrue(is_boilerplate("Page 3 of 12"))
        self.assertTrue(is_boilerplate("2 points:"))
        self.assertTrue(is_boilerplate("Part a. [0-4]"))
        self.assertTrue(is_boilerplate("0 1 2 3 4 5"))
        self.assertTrue(is_boilerplate(
            "The student response earns all of the following points"))
        self.assertFalse(is_boilerplate("1. What is the acceleration?"))

    def test_repeating_header_removal(self):
        pages = [
            ["Unit 2 Test", "1. First question", "a. one", "b. two"],
            ["Unit 2 Test", "2. Second question", "a. one", "b. two"],
            ["Unit 2 Test", "3. Third question", "a. one", "b. two"],
        ]
        repeating = find_repeating_lines(pages)
        self.assertIn("unit # test", repeating)
        cleaned = clean_pages(pages)
        self.assertNotIn("Unit 2 Test", cleaned)
        self.assertTrue(any("First question" in l for l in cleaned))

    def test_dedup_repeated_rubric_block(self):
        pages = [[
            "1. Explain energy conservation.",
            "The block keeps its total energy.",
            "Mechanical energy is conserved here.",
            "The block keeps its total energy.",
            "Mechanical energy is conserved here.",
        ]]
        cleaned = clean_pages(pages)
        occurrences = sum(1 for l in cleaned
                          if "keeps its total energy" in l)
        self.assertEqual(occurrences, 1)


class TestParserMC(unittest.TestCase):
    def test_basic_mc_with_inline_answer(self):
        lines = [
            "Forces Quiz",
            "MULTIPLE CHOICE",
            "1. A 2 kg block is pushed. Which is the net force?",
            "a. 1 N",
            "b. 2 N",
            "c. 4 N",
            "d. 8 N",
            "ANS: C",
        ]
        result = parse(lines, fallback_title="Forces Quiz")
        self.assertEqual(len(result.questions), 1)
        q = result.questions[0]
        self.assertEqual(q.qtype, TYPE_MC)
        self.assertEqual(len(q.choices), 4)
        self.assertEqual(q.answer, "C")
        self.assertFalse(q.needs_review)

    def test_asterisk_answer(self):
        lines = [
            "Quiz",
            "1. Pick the right one.",
            "a. wrong",
            "*b. right",
            "c. wrong",
        ]
        result = parse(lines)
        q = result.questions[0]
        self.assertEqual(q.answer, "B")

    def test_missing_answer_is_flagged_not_guessed(self):
        lines = [
            "Quiz",
            "1. Highlight-only answer here.",
            "a. one",
            "b. two",
            "c. three",
        ]
        result = parse(lines)
        q = result.questions[0]
        self.assertEqual(q.answer, config.ANSWER_PLACEHOLDER)
        self.assertTrue(q.needs_review)

    def test_separate_answer_key(self):
        lines = [
            "Test",
            "1. Question one?",
            "a. a", "b. b", "c. c", "d. d",
            "2. Question two?",
            "a. a", "b. b", "c. c", "d. d",
            "ANSWER KEY",
            "1. B  2. D",
        ]
        result = parse(lines)
        self.assertEqual(result.questions[0].answer, "B")
        self.assertEqual(result.questions[1].answer, "D")


class TestParserMixed(unittest.TestCase):
    def test_mixed_mc_and_problem(self):
        lines = [
            "Unit 3 Exam",
            "MULTIPLE CHOICE",
            "1. What is velocity?",
            "a. speed", "b. distance", "c. rate of change of position", "d. mass",
            "ANS: C",
            "PROBLEM",
            "2. Derive an expression for the acceleration in terms of v and t.",
            "Solution: a = dv/dt",
        ]
        result = parse(lines)
        types = {q.number: q.qtype for q in result.questions}
        self.assertEqual(len(result.questions), 2)
        mc = [q for q in result.questions if q.qtype == TYPE_MC]
        pr = [q for q in result.questions if q.qtype == TYPE_PROBLEM]
        self.assertEqual(len(mc), 1)
        self.assertEqual(len(pr), 1)

    def test_figure_reference_flagged(self):
        lines = [
            "Test",
            "1. Using the graph shown above, find the slope.",
            "a. 1", "b. 2", "c. 3", "d. 4",
            "ANS: B",
        ]
        result = parse(lines)
        q = result.questions[0]
        self.assertTrue(any("figure" in f.lower() for f in q.flags))
        self.assertIn("FIGURE NOT IMPORTED", q.notes)

    def test_shared_setup_with_range(self):
        lines = [
            "Test",
            "Questions 1-2 refer to the following: a 5 kg cart rolls down a "
            "frictionless ramp from rest.",
            "1. What is its acceleration?",
            "a. 1", "b. 2", "c. 9.8", "d. 5",
            "ANS: C",
            "2. How far does it travel in 2 s?",
            "a. 1", "b. 2", "c. 19.6", "d. 5",
            "ANS: C",
        ]
        result = parse(lines)
        self.assertEqual(len(result.questions), 2)
        for q in result.questions:
            self.assertTrue(q.shared_setup_prepended)
            self.assertIn("cart", q.stem.lower())


class TestProblemSolution(unittest.TestCase):
    def test_solution_to_ans_rubric_to_not(self):
        lines = [
            "Exam",
            "PROBLEM",
            "1. Derive an expression for the period in terms of L and g.",
            "Solution: T = 2 pi sqrt(L/g)",
            "2 points: correct setup",
            "2 points: correct setup",
        ]
        result = parse(lines)
        q = result.questions[0]
        self.assertEqual(q.qtype, TYPE_PROBLEM)
        self.assertEqual(q.answer, "T = 2 pi sqrt(L/g)")   # label stripped
        self.assertIn("correct setup", q.notes)
        # The duplicated rubric line is collapsed to one.
        self.assertEqual(q.notes.lower().count("correct setup"), 1)

    def test_metadata_line_not_merged_into_stem(self):
        # A wrapped stem followed by a Solution line must not absorb it.
        pages = [[
            "1. Find the acceleration of the cart on the",
            "frictionless ramp.",
            "Solution: a = g sin(theta)",
        ]]
        cleaned = clean_pages(pages)
        joined = " ".join(cleaned)
        self.assertIn("frictionless ramp", joined)
        self.assertTrue(any(l.lower().startswith("solution") for l in cleaned))


class TestDifficulty(unittest.TestCase):
    def test_deterministic(self):
        stem = "Derive an expression for the period in terms of L and g."
        a = score_question(stem)
        b = score_question(stem)
        self.assertEqual(a, b)

    def test_recall_is_easy(self):
        token, signals, conf = score_question("State Newton's first law.")
        self.assertEqual(token, config.SCALE_TOKENS[0])
        self.assertTrue(conf)

    def test_derivation_is_hard(self):
        token, signals, conf = score_question(
            "Derive an expression for the acceleration in terms of m and F, "
            "starting from Newton's laws, and justify each step.")
        self.assertEqual(token, config.SCALE_TOKENS[-1])

    def test_garbled_defaults_to_middle_and_flags(self):
        token, signals, conf = score_question("�� �� ��� ��")
        self.assertEqual(token, config.MIDDLE_TOKEN)
        self.assertFalse(conf)

    def test_synthesis_signal(self):
        token, signals, conf = score_question(
            "Calculate the final velocity using energy conservation and "
            "momentum after the collision, given m = 2 kg and v = 3 m/s.")
        self.assertTrue(any("synthesis" in s for s in signals))


class TestRtf(unittest.TestCase):
    def _sample_questions(self):
        lines = [
            "Sample Bank",
            "MULTIPLE CHOICE",
            "1. What is 2 + 2?",
            "a. 3", "b. 4", "c. 5", "d. 6",
            "ANS: B",
        ]
        result = parse(lines)
        for q in result.questions:
            q.difficulty = config.SCALE_TOKENS[0]
        return result.questions

    def test_build_and_validate(self):
        questions = self._sample_questions()
        rtf = build_rtf("Sample Bank", questions)
        problems = validate_rtf(rtf, expected_questions=len(questions))
        self.assertEqual(problems, [], msg=str(problems))
        self.assertTrue(rtf.startswith("{\\rtf1"))
        self.assertIn("MULTIPLE CHOICE", rtf)
        self.assertIn("ANS: B", rtf.replace("\\par", ""))

    def test_unicode_is_escaped_not_dropped(self):
        questions = self._sample_questions()
        questions[0].stem = "A mass of 5 kg has weight ≈ 49 N (θ = 30°)."
        rtf = build_rtf("Greek Bank", questions)
        self.assertIn("\\u", rtf)  # non-ASCII emitted as \uN escapes
        rtf.encode("ascii")        # must be pure ASCII on disk
        problems = validate_rtf(rtf, expected_questions=len(questions))
        self.assertEqual(problems, [], msg=str(problems))

    def test_title_truncated_to_limit(self):
        questions = self._sample_questions()
        long_title = "X" * 200
        rtf = build_rtf(long_title, questions)
        problems = validate_rtf(rtf, expected_questions=len(questions))
        self.assertEqual(problems, [], msg=str(problems))

    def test_smart_quotes_straightened(self):
        questions = self._sample_questions()
        questions[0].stem = "“Hello” ‘world’ — dash"
        rtf = build_rtf("Quotes", questions)
        for ch in "“”‘’":
            self.assertNotIn(ch, rtf)


class TestEmpty(unittest.TestCase):
    def test_no_questions(self):
        result = parse(["Just a heading", "some prose with no numbers"])
        self.assertEqual(result.questions, [])

    def test_empty_input(self):
        result = parse(["", "  ", ""])
        self.assertTrue(result.raw_text_empty)


if __name__ == "__main__":
    unittest.main(verbosity=2)
