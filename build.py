#!/usr/bin/env python3
"""One-command build of the standalone executable.

Run it from anywhere:

    python build.py

Output: dist/PhysicsQuestionBankGenerator(.exe)

Why this exists: `pyinstaller build.spec` can silently fail to bundle the local
`physics_qbank` package if it is run from the wrong directory or with a stale
cache, producing an .exe that crashes with
"ModuleNotFoundError: No module named 'physics_qbank'".

This script removes every way to get that wrong:
  * it changes into its own folder, so the current directory never matters;
  * it puts that folder on sys.path so the package is always importable;
  * it wipes the build/ and dist/ caches and passes --clean;
  * it force-collects the whole package with --collect-submodules.
"""

import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    os.chdir(HERE)
    sys.path.insert(0, HERE)  # so --collect-submodules can import the package

    for folder in ("build", "dist"):
        shutil.rmtree(os.path.join(HERE, folder), ignore_errors=True)

    try:
        import PyInstaller.__main__
    except ImportError:
        sys.exit("PyInstaller is not installed. Run:  pip install pyinstaller")

    PyInstaller.__main__.run([
        os.path.join(HERE, "main.py"),
        "--name", "PhysicsQuestionBankGenerator",
        "--onefile",
        "--noconsole",
        "--clean",
        "--noconfirm",
        "--paths", HERE,
        "--collect-submodules", "physics_qbank",
        "--hidden-import", "fitz",
        "--specpath", HERE,
        "--distpath", os.path.join(HERE, "dist"),
        "--workpath", os.path.join(HERE, "build"),
    ])

    out = os.path.join(HERE, "dist")
    print("\nDone. Your app is in: %s" % out)


if __name__ == "__main__":
    main()
