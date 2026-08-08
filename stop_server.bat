@echo off
title Print Manager - Server Stoppen
echo ========================================================
echo               Stoppe Print Manager Server...
echo ========================================================
echo.

REM 1. Beende alle Prozesse, die auf Port 5173 oder 8000 lauschen (Sprachunabhaengig via PowerShell)
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 2. Beende gezielt alle Python-Prozesse, die uvicorn / main:app ausfuehren
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*uvicorn*' -or $_.CommandLine -like '*main:app*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 3. Zusaetzliche Absicherung per Taskkill
taskkill /F /IM "uvicorn.exe" >nul 2>&1
taskkill /F /IM "node.exe" >nul 2>&1

echo.
echo [OK] Print Manager Server wurde erfolgreich gestoppt.
ping 127.0.0.1 -n 3 >nul
