@echo off
setlocal enabledelayedexpansion
title STL Manager - Updater
cd /d "%~dp0"

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

echo [1/4] Stoppe laufenden STL Manager Server...
call "%~dp0stop_server.bat"

echo.
echo [2/4] Lade Aktualisierungen herunter...
"%PYTHON_EXE%" "%~dp0update.py"

echo.
echo [3/4] Pruefe und installiere Python-Abhaengigkeiten...
"%PYTHON_EXE%" -m pip install -r "%~dp0backend\requirements.txt"

echo.
echo [4/4] Starte STL Manager Server neu...
start "" "%~dp0run_portable.bat"

echo.
echo ========================================
echo  [OK] Update erfolgreich abgeschlossen!
echo       Der Server wurde neu gestartet.
echo ========================================
echo.
ping 127.0.0.1 -n 3 >nul
