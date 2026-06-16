# PyInstaller spec for a standalone, single-file executable.
# Build from the PROJECT ROOT (the folder that contains this file):
#   pyinstaller build.spec
# Output: dist/PhysicsQuestionBankGenerator(.exe)

import os
import sys

block_cipher = None

# SPECPATH is the directory containing this .spec file (the project root).
project_dir = SPECPATH

# collect_submodules imports the package, so the project root must be importable
# *now* - before Analysis applies pathex. Without this, running
# `pyinstaller build.spec` from another directory makes collect_submodules
# return [] and the package may not get bundled (ModuleNotFoundError at runtime).
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

from PyInstaller.utils.hooks import collect_submodules

# Force-collect every submodule of the package. Several are imported lazily
# (fitz, tkinterdnd2) or conditionally, so listing them is more reliable than
# import tracing alone.
hidden = collect_submodules('physics_qbank') + ['fitz']

a = Analysis(
    [os.path.join(project_dir, 'main.py')],
    pathex=[project_dir],
    binaries=[],
    datas=[],
    hiddenimports=hidden,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='PhysicsQuestionBankGenerator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    runtime_tmpdir=None,
    console=False,   # no terminal window for the teacher
)
