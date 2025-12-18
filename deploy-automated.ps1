# ========================================================
#  Dr Nnadi's Records - Automated Vercel Deployment
# ========================================================
# This script automates the entire deployment process

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Dr Nnadi's Records - Automated Vercel Deployment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to print success message
function Write-Success($message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

# Function to print error message
function Write-Error-Custom($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Function to print info message
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Yellow
}

# Step 1: Check for Node.js
Write-Host "Step 1: Checking Node.js installation..." -ForegroundColor Cyan
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Success "Node.js is installed ($nodeVersion)"
} else {
    Write-Error-Custom "Node.js is not installed!"
    Write-Info "Please install Node.js from: https://nodejs.org"
    Write-Info "Download the LTS version and run the installer"
    Write-Host ""
    Read-Host "Press Enter to open Node.js download page"
    Start-Process "https://nodejs.org"
    exit 1
}
Write-Host ""

# Step 2: Install Vercel CLI
Write-Host "Step 2: Installing Vercel CLI..." -ForegroundColor Cyan
try {
    npm install -g vercel 2>$null
    Write-Success "Vercel CLI installed successfully"
} catch {
    Write-Error-Custom "Failed to install Vercel CLI"
    Write-Info "Error: $_"
    exit 1
}
Write-Host ""

# Step 3: Install project dependencies
Write-Host "Step 3: Installing project dependencies..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    try {
        npm install
        Write-Success "Dependencies installed"
    } catch {
        Write-Warning "Failed to install dependencies, continuing anyway..."
    }
} else {
    Write-Warning "No package.json found, skipping dependency installation"
}
Write-Host ""

# Step 4: Login to Vercel
Write-Host "Step 4: Logging in to Vercel..." -ForegroundColor Cyan
Write-Info "A browser window will open for authentication"
Write-Host ""
Start-Sleep -Seconds 2

try {
    vercel login
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Successfully logged in to Vercel"
    } else {
        Write-Error-Custom "Failed to login to Vercel"
        exit 1
    }
} catch {
    Write-Error-Custom "Login failed: $_"
    exit 1
}
Write-Host ""

# Step 5: Deploy to Vercel
Write-Host "Step 5: Deploying to Vercel..." -ForegroundColor Cyan
Write-Info "This will deploy your application to production"
Write-Info "Using project name: dr-nnadi-records"
Write-Host ""

try {
    vercel --prod --yes --name dr-nnadi-records
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment successful!"
    } else {
        Write-Error-Custom "Deployment failed"
        exit 1
    }
} catch {
    Write-Error-Custom "Deployment error: $_"
    exit 1
}
Write-Host ""

# Step 6: Get deployment URL
Write-Host "Step 6: Getting deployment URL..." -ForegroundColor Cyan
try {
    $deploymentInfo = vercel ls --json | ConvertFrom-Json
    if ($deploymentInfo) {
        $url = "https://" + $deploymentInfo[0].url
        Write-Success "Deployment URL: $url"
        Write-Host ""
    }
} catch {
    Write-Warning "Could not retrieve deployment URL automatically"
    Write-Info "Check your Vercel dashboard: https://vercel.com/dashboard"
}

# Step 7: Instructions for database setup
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS - Database Setup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is deployed! Now set up the database:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Open Vercel Dashboard" -ForegroundColor Yellow
Write-Info "   Opening in browser..."
Start-Sleep -Seconds 1
Start-Process "https://vercel.com/dashboard"
Write-Host ""

Write-Host "2. Create PostgreSQL Database:" -ForegroundColor Yellow
Write-Host "   • Click 'Storage' tab"
Write-Host "   • Click 'Create Database'"
Write-Host "   • Select 'Postgres' (FREE tier)"
Write-Host "   • Name it: dr-nnadi-records-db"
Write-Host "   • Click 'Create'"
Write-Host ""

Write-Host "3. Connect Database to Project:" -ForegroundColor Yellow
Write-Host "   • Click 'Connect Project'"
Write-Host "   • Select 'dr-nnadi-records'"
Write-Host "   • Click 'Connect'"
Write-Host ""

Write-Host "4. Initialize Database:" -ForegroundColor Yellow
Write-Host "   • Visit: your-url.vercel.app/api/init"
Write-Host "   • You should see: {\"success\":true,...}"
Write-Host ""

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Would you like to open the setup guide?" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
$response = Read-Host "Open VERCEL_DEPLOYMENT.md? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    if (Test-Path "VERCEL_DEPLOYMENT.md") {
        Start-Process "VERCEL_DEPLOYMENT.md"
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ✓ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your medical records system is now live in the cloud!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your app at: https://dr-nnadi-records.vercel.app" -ForegroundColor Cyan
Write-Host "(or check Vercel dashboard for your actual URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "Remember to:" -ForegroundColor Yellow
Write-Host "  1. Create the Postgres database in Vercel Dashboard"
Write-Host "  2. Connect it to your project"
Write-Host "  3. Visit /api/init to initialize tables"
Write-Host ""

Read-Host "Press Enter to exit"
