@echo off
setlocal enabledelayedexpansion
title STL Manager - Server Stoppen
echo ========================================================
echo               Stoppe STL Manager Server...
echo ========================================================
echo.

set "PORT=8000"
if exist "%~dp0..\port.txt" (
    set /p PORT=<"%~dp0..\port.txt"
    set "PORT=!PORT: =!"
)
if "!PORT!"=="" set "PORT=8000"

echo [1/3] Beende Prozesse auf Port !PORT!...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort !PORT! -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [2/3] Beende alle aktiven STL-Manager / Uvicorn Prozesse...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { ($_.CommandLine -like '*uvicorn*' -and $_.CommandLine -like '*main:app*') -or ($_.CommandLine -like '*run_portable.bat*') -or ($_.ExecutablePath -like '*STL-Manager*python*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [3/3] Pruefe Standard-Ports (5173, 8000)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

taskkill /F /IM "uvicorn.exe" >nul 2>&1

echo.
echo [OK] STL Manager Server wurde erfolgreich gestoppt.
ping 127.0.0.1 -n 2 >nul
