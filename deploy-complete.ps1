# Dr Nnadi's Records - Complete Automated Deployment
# This script handles EVERYTHING including database setup

param([switch]$SkipDatabase)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Complete Automated Deployment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "Install from: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "OK: Node.js found" -ForegroundColor Green
Write-Host ""

# Install Vercel CLI
Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
npm install -g vercel 2>$null
Write-Host "OK: Vercel CLI ready" -ForegroundColor Green
Write-Host ""

# Login
Write-Host "Logging in to Vercel..." -ForegroundColor Cyan
vercel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Login failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK: Logged in" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Deploying..." -ForegroundColor Cyan
vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK: Deployed!" -ForegroundColor Green
Write-Host ""

# Database setup
if (-not $SkipDatabase) {
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "  Database Setup" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Opening Vercel Dashboard..." -ForegroundColor Yellow
    Start-Process "https://vercel.com/dashboard/stores"
    Write-Host ""
    
    Write-Host "In your browser:" -ForegroundColor Yellow
    Write-Host "  1. Click Create Database"
    Write-Host "  2. Select Postgres"
    Write-Host "  3. Name: dr-nnadi-records-db"
    Write-Host "  4. Click Create"
    Write-Host "  5. Click Connect Project"
    Write-Host "  6. Select dr-nnadi-records"
    Write-Host ""
    
    Read-Host "Press Enter when done"
    Write-Host ""
}

# Final
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live!" -ForegroundColor Cyan
Write-Host "Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
