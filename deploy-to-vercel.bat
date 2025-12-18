@echo off
echo ================================================
echo    Dr Nnadi's Records - Vercel Deployment
echo ================================================
echo.

echo Step 1: Installing Vercel CLI...
call npm install -g vercel
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Vercel CLI
    echo Make sure Node.js is installed: https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Vercel CLI installed
echo.

echo Step 2: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo Step 3: Logging in to Vercel...
echo (A browser window will open for authentication)
call vercel login
if %errorlevel% neq 0 (
    echo ERROR: Failed to login
    pause
    exit /b 1
)
echo ✓ Logged in successfully
echo.

echo Step 4: Deploying to Vercel...
call vercel --prod
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)
echo.

echo ================================================
echo    ✓ DEPLOYMENT SUCCESSFUL!
echo ================================================
echo.
echo Next Steps:
echo 1. Go to https://vercel.com/dashboard
echo 2. Create a Postgres database in Storage tab
echo 3. Link it to your dr-nnadi-records project
echo 4. Visit your-url.vercel.app/api/init
echo 5. Start using your cloud app!
echo.
echo See VERCEL_DEPLOYMENT.md for detailed instructions
echo.
pause
