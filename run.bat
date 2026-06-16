@echo off
rem ===================================================================
rem  Physics Question Bank Generator - double-click launcher
rem  Runs the tool straight from the source folder. No build needed.
rem  It always switches to this file's own folder first, so the
rem  physics_qbank package is always found.
rem ===================================================================

rem Switch to the folder this .bat lives in (handles spaces in the path).
cd /d "%~dp0"

rem Find Python: prefer the 'py' launcher, fall back to 'python'.
set "PY=py"
where py >nul 2>nul || set "PY=python"

rem Make sure the PDF engine is installed (first run only; quiet afterwards).
echo Checking dependencies (first run may take a minute)...
%PY% -m pip install --quiet --disable-pip-version-check pymupdf >nul 2>nul

echo Starting Physics Question Bank Generator...
%PY% "%~dp0main.py"

rem If it exited with an error, keep the window open so you can read it.
if errorlevel 1 (
  echo.
  echo ------------------------------------------------------------
  echo It did not start cleanly. Please copy ALL the text above and
  echo send it back so I can help.
  echo ------------------------------------------------------------
  pause
)
