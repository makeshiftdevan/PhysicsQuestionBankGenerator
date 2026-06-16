# PyInstaller spec for a standalone, single-file executable.
# Build from the PROJECT ROOT (the folder that contains this file):
#   pyinstaller build.spec
# Output: dist/PhysicsQuestionBankGenerator(.exe)

import os
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

# SPECPATH is the directory containing this .spec file (the project root).
# Putting it on pathex is what lets PyInstaller find and bundle the local
# `physics_qbank` package - without it the frozen app raises
# "ModuleNotFoundError: No module named 'physics_qbank'".
project_dir = SPECPATH

# Force-collect every submodule of the package. Several are imported lazily
# (fitz, tkinterdnd2) or conditionally, so we list them explicitly instead of
# relying purely on import tracing.
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
