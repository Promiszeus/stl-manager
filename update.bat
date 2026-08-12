@echo off
title STL Manager - Updater

echo.
echo ========================================
echo       STL Manager - Updater Start
echo ========================================
echo.

set "PYTHON_EXE=%~dp0python_embeded\python.exe"

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Keine portable Python-Version gefunden!
    echo Bitte stelle sicher, dass der Ordner 'python_embeded' hier existiert.
    pause
    exit /b 1
)

"%PYTHON_EXE%" "%~dp0update.py"

echo.
pause
