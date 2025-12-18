@echo off
echo ========================================================
echo    Dr Nnadi's Records - Automated Deployment
echo ========================================================
echo.
echo Starting automated deployment...
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-automated.ps1"

if %errorlevel% neq 0 (
    echo.
    echo Deployment encountered an error.
    pause
    exit /b 1
)

pause
