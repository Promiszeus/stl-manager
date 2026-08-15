@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

set "PORT=8000"
if exist "%~dp0port.txt" (
    set /p PORT=<"%~dp0port.txt"
    set "PORT=!PORT: =!"
)
if "!PORT!"=="" set "PORT=8000"

title STL Manager - Portable Launcher (Port !PORT!)

echo ========================================================
echo     STL Manager - Portable Start (Port !PORT!)
echo ========================================================
echo.

set "PYTHON_EXE=%~dp0python_embeded\python.exe"

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Keine portable Python-Version gefunden!
    echo Bitte stelle sicher, dass der Ordner 'python_embeded' hier existiert.
    pause
    exit /b 1
)

echo [OK] Portable Embedded Python erkannt.

REM Ensure Frontend is built
if not exist "%~dp0frontend\dist\index.html" (
    where npm >nul 2>&1
    if !errorlevel! equ 0 (
        echo [INFO] Building Frontend static files...
        cd /d "%~dp0frontend"
        call npm install
        call npm run build
        cd /d "%~dp0"
    )
)

REM Open Browser automatically after 2 seconds
start "" cmd /c "ping 127.0.0.1 -n 3 >nul && start http://localhost:!PORT!"
echo.
echo [STARTING] STL Manager is running at http://localhost:!PORT! ...
echo [LAN ACCESS] Available in local network at http://<YOUR-IP>:!PORT! (e.g. http://10.10.5.40:!PORT!)
echo [INFO] Press Ctrl+C or close this window to stop the server.
echo.

cd /d "%~dp0backend"
"%PYTHON_EXE%" -m uvicorn main:app --host 0.0.0.0 --port !PORT!