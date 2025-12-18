@echo off
cls
echo.
echo ========================================================
echo    Dr Nnadi's Records - ONE-CLICK DEPLOYMENT
echo ========================================================
echo.
echo This will:
echo   1. Install Vercel CLI
echo   2. Login to Vercel
echo   3. Deploy your application
echo   4. Set up PostgreSQL database
echo   5. Initialize database tables
echo   6. Open your live application
echo.
echo ========================================================
echo.
pause
echo.

REM Run the complete PowerShell deployment script
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-complete.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo    Deployment encountered an error
    echo ========================================================
    echo.
    echo Please check the error message above.
    echo You can also deploy manually:
    echo   1. Visit https://vercel.com
    echo   2. Import your GitHub repository
    echo   3. Follow the setup wizard
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo    All done! Your app is live!
echo ========================================================
echo.
pause
