"""ExamView .bnk handling.

The .bnk format is proprietary and undocumented. We never fabricate one. The
only supported path is ExamView's own Import Utility / Test Generator. If we
can detect it on a Windows machine we attempt to drive it on the generated
RTF; otherwise we hand the teacher a short, one-time walkthrough.
"""

import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class BnkResult:
    created: bool
    bnk_path: Optional[str]
    message: str
    walkthrough: List[str]


# Common install locations / executable names for ExamView components.
_CANDIDATE_EXE_NAMES = (
    "ImportUtility.exe",
    "EVImport.exe",
    "ExamView Import Utility.exe",
    "ExamView.exe",
    "EVTestGenerator.exe",
)
_PROGRAM_DIR_HINTS = (
    "ExamView",
    "ExamView Test Generator",
    "Turning Technologies",
    "eInstruction",
)


def find_import_utility() -> Optional[str]:
    """Return a path to an ExamView import executable, or None."""
    if not sys.platform.startswith("win"):
        return None

    roots = [os.environ.get("ProgramFiles", r"C:\Program Files"),
             os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")]
    for root in roots:
        if not root or not os.path.isdir(root):
            continue
        for hint in _PROGRAM_DIR_HINTS:
            base = os.path.join(root, hint)
            if not os.path.isdir(base):
                continue
            for dirpath, _dirs, files in os.walk(base):
                for name in files:
                    if name in _CANDIDATE_EXE_NAMES:
                        return os.path.join(dirpath, name)

    # Last resort: anything named like the utility on PATH.
    for name in _CANDIDATE_EXE_NAMES:
        found = shutil.which(name)
        if found:
            return found
    return None


def try_make_bnk(rtf_path: str, bnk_path: str) -> BnkResult:
    """Attempt automated .bnk creation; fall back to a walkthrough."""
    walkthrough = build_walkthrough(rtf_path, bnk_path)

    exe = find_import_utility()
    if not exe:
        return BnkResult(
            created=False, bnk_path=None,
            message=("ExamView's Import Utility was not found on this computer, "
                     "so the .bnk could not be created automatically. The RTF "
                     "is ready - follow the short steps below to import it once."),
            walkthrough=walkthrough)

    # The utility's command-line interface is not publicly documented and varies
    # by version. We attempt a best-effort, non-destructive invocation and
    # verify a real .bnk appeared before claiming success - we never write a
    # placeholder file ourselves.
    try:
        subprocess.run([exe, rtf_path, bnk_path], timeout=120,
                       check=False, capture_output=True)
    except Exception:
        pass

    if os.path.isfile(bnk_path) and os.path.getsize(bnk_path) > 0:
        return BnkResult(
            created=True, bnk_path=bnk_path,
            message="ExamView created the question bank (.bnk) automatically.",
            walkthrough=[])

    return BnkResult(
        created=False, bnk_path=None,
        message=("ExamView is installed but could not be driven automatically "
                 "on this version. The RTF is ready - use the short steps below "
                 "to import it once (it only takes a minute)."),
        walkthrough=walkthrough)


def build_walkthrough(rtf_path: str, bnk_path: str) -> List[str]:
    rtf_name = os.path.basename(rtf_path)
    bnk_name = os.path.basename(bnk_path)
    return [
        "Open ExamView Test Generator (or the ExamView Import Utility).",
        "Choose: File > Import > Import from RTF/Text  (older versions: "
        "the Question Bank Wizard, then 'Import questions').",
        "Browse to the output folder and select \"%s\"." % rtf_name,
        "When asked, confirm the question-type sections (MULTIPLE CHOICE and "
        "PROBLEM) and that the tags (ANS, DIF, PTS, NOT) are recognized.",
        "Finish the wizard, then choose File > Save As and save the new bank "
        "as \"%s\"." % bnk_name,
        "Your .bnk is now ready to use in ExamView. You only have to do this "
        "import once per file.",
    ]
