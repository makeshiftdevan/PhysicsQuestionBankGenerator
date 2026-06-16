"""Entry point for the Physics Question Bank Generator.

Double-click the packaged executable, or run `python main.py`. There is no
command line to learn: a small window opens.
"""

import os
import sys

# Make sure the bundled/local package is importable regardless of the current
# working directory (helps when run as a loose script). When frozen by
# PyInstaller the package is collected into the executable, so this is a no-op.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from physics_qbank.gui import launch


if __name__ == "__main__":
    launch()
