@echo off
cd /d "%~dp0"
if not exist logs mkdir logs
start /b "" run_portable.bat > "logs\backend.log" 2>&1
