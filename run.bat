@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0_local_artifacts\launch.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Script encountered an error.
    pause
)
