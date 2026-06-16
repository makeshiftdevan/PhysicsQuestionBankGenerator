@echo off
rem ===================================================================
rem  Build the standalone .exe by double-clicking this file.
rem  Produces dist\PhysicsQuestionBankGenerator.exe
rem ===================================================================

cd /d "%~dp0"

set "PY=py"
where py >nul 2>nul || set "PY=python"

echo Installing build tools (first time only)...
%PY% -m pip install --disable-pip-version-check pymupdf pyinstaller

echo.
echo Building the app...
%PY% "%~dp0build.py"

echo.
echo ------------------------------------------------------------
echo If the build succeeded, your app is in the "dist" folder:
echo     dist\PhysicsQuestionBankGenerator.exe
echo ------------------------------------------------------------
pause
