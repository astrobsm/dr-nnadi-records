@echo off
echo ========================================
echo Automated GitHub Deployment
echo ========================================
echo.

cd /d "%~dp0"

REM Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is NOT installed on this computer.
    echo.
    echo OPTION 1: Install Git (Recommended)
    echo =========================================
    echo 1. I will open the Git download page
    echo 2. Download and install Git for Windows
    echo 3. Run this script again after installation
    echo.
    echo Press any key to open Git download page...
    pause >nul
    start https://git-scm.com/download/win
    echo.
    echo After installing Git, restart this script.
    pause
    exit /b
)

echo Git is installed! Proceeding with deployment...
echo.

REM Initialize repository if needed
if not exist ".git" (
    echo [1/5] Initializing Git repository...
    git init
    git branch -M main
    echo Done!
    echo.
) else (
    echo [1/5] Repository already initialized.
    echo.
)

REM Set up remote
echo [2/5] Setting up GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/astrobsm/dr-nnadi-records.git
echo Done!
echo.

REM Add files
echo [3/5] Adding files to Git...
git add index.html styles.css app.js manifest.json logo.png README.md .gitignore
echo Done!
echo.

REM Commit
echo [4/5] Creating commit...
git commit -m "Deploy Dr Nnadi's Surgeries, Reviews and Procedures application"
if %errorlevel% neq 0 (
    echo No changes to commit or files already committed.
)
echo Done!
echo.

REM Push to GitHub
echo [5/5] Pushing to GitHub...
echo.
echo You may be asked to log in to GitHub.
echo Please enter your GitHub credentials when prompted.
echo.
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Deployment Complete!
    echo ========================================
    echo.
    echo Your application is being deployed to:
    echo https://astrobsm.github.io/dr-nnadi-records/
    echo.
    echo NEXT STEPS:
    echo 1. Go to: https://github.com/astrobsm/dr-nnadi-records
    echo 2. Click "Settings" tab
    echo 3. Click "Pages" in the left sidebar
    echo 4. Under "Source", select "main" branch
    echo 5. Click "Save"
    echo.
    echo Wait 1-2 minutes, then visit:
    echo https://astrobsm.github.io/dr-nnadi-records/
    echo.
    echo You can then access this from your phone!
    echo.
) else (
    echo.
    echo ========================================
    echo AUTHENTICATION REQUIRED
    echo ========================================
    echo.
    echo GitHub authentication failed or was cancelled.
    echo.
    echo OPTION 1: Use GitHub Desktop (Easiest)
    echo - Download from: https://desktop.github.com
    echo - Sign in with your GitHub account
    echo - Add this repository
    echo - Click "Push origin"
    echo.
    echo OPTION 2: Use Personal Access Token
    echo - Go to: https://github.com/settings/tokens
    echo - Generate new token (classic)
    echo - Use token as password when pushing
    echo.
    echo OPTION 3: Upload files manually
    echo - Go to: https://github.com/astrobsm/dr-nnadi-records
    echo - Click "Add file" - "Upload files"
    echo - Drag: index.html, styles.css, app.js, manifest.json, logo.png, README.md
    echo - Commit changes
    echo.
)

echo ========================================
pause
