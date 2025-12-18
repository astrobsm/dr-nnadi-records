@echo off
echo ========================================
echo GitHub Deployment Helper
echo ========================================
echo.

cd /d "%~dp0"

REM Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is not installed!
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    echo After installing Git, run this script again.
    pause
    exit /b
)

echo Git is installed. Proceeding with setup...
echo.

REM Check if already initialized
if exist ".git" (
    echo Repository already initialized.
    echo.
    goto :commit
)

REM Initialize repository
echo Initializing Git repository...
git init
git branch -M main
echo.

:commit
echo Adding files to Git...
git add index.html styles.css app.js manifest.json logo.png README.md .gitignore
echo.

echo Creating commit...
git commit -m "Deploy Dr Nnadi's application"
echo.

echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Create a repository on GitHub:
echo    - Go to https://github.com/new
echo    - Name it: dr-nnadi-records
echo    - Make it PUBLIC (recommended)
echo    - Do NOT initialize with README
echo    - Click "Create repository"
echo.
echo 2. Copy the repository URL from GitHub
echo    (It looks like: https://github.com/YOUR-USERNAME/dr-nnadi-records.git)
echo.
echo 3. Run these commands (replace YOUR-USERNAME):
echo.
echo    git remote add origin https://github.com/YOUR-USERNAME/dr-nnadi-records.git
echo    git push -u origin main
echo.
echo 4. Enable GitHub Pages:
echo    - Go to your repository Settings
echo    - Click "Pages" in the sidebar
echo    - Under "Source", select branch "main"
echo    - Click "Save"
echo.
echo 5. Your app will be live at:
echo    https://YOUR-USERNAME.github.io/dr-nnadi-records/
echo.
echo ========================================
pause
