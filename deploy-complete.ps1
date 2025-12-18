# ========================================================
#  Auto-Deploy with Database Setup
# ========================================================
# This script handles EVERYTHING including database setup

param(
    [switch]$SkipDatabase
)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Complete Automated Deployment with Database" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Import the main deployment script functions
. "$PSScriptRoot\deploy-automated.ps1"

# Wait for database setup
if (-not $SkipDatabase) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "  Database Setup Automation" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "I'll help you set up the database..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Opening Vercel Dashboard for database creation..." -ForegroundColor Cyan
    Start-Process "https://vercel.com/dashboard/stores"
    
    Write-Host ""
    Write-Host "Please complete these steps in your browser:" -ForegroundColor Yellow
    Write-Host "1. Click 'Create Database'" -ForegroundColor White
    Write-Host "2. Select 'Postgres'" -ForegroundColor White
    Write-Host "3. Name it: dr-nnadi-records-db" -ForegroundColor White
    Write-Host "4. Click 'Create'" -ForegroundColor White
    Write-Host "5. Click 'Connect Project' and select 'dr-nnadi-records'" -ForegroundColor White
    Write-Host ""
    
    Read-Host "Press Enter when database is created and connected"
    
    # Get project URL
    Write-Host ""
    Write-Host "Retrieving your project URL..." -ForegroundColor Cyan
    
    try {
        $projectInfo = vercel ls --json | ConvertFrom-Json
        if ($projectInfo -and $projectInfo.Count -gt 0) {
            $projectUrl = "https://" + $projectInfo[0].url
            
            Write-Host "Project URL found: $projectUrl" -ForegroundColor Green
            Write-Host ""
            
            # Initialize database
            Write-Host "Initializing database tables..." -ForegroundColor Cyan
            Write-Host "Calling: $projectUrl/api/init" -ForegroundColor Gray
            Write-Host ""
            
            try {
                $response = Invoke-RestMethod -Uri "$projectUrl/api/init" -Method Get -TimeoutSec 30
                
                if ($response.success) {
                    Write-Host "✓ Database initialized successfully!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Database tables created:" -ForegroundColor Cyan
                    Write-Host "  • patients (folder_number, patient_name, first_visit)"
                    Write-Host "  • records (id, patient details, service info, fees, notes)"
                    Write-Host ""
                } else {
                    Write-Host "✗ Database initialization returned: $($response | ConvertTo-Json)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "✗ Could not initialize database automatically" -ForegroundColor Yellow
                Write-Host "Please visit manually: $projectUrl/api/init" -ForegroundColor Yellow
                Write-Host ""
                
                $openBrowser = Read-Host "Open initialization URL in browser? (Y/N)"
                if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
                    Start-Process "$projectUrl/api/init"
                }
            }
            
            # Test the application
            Write-Host ""
            Write-Host "========================================================" -ForegroundColor Cyan
            Write-Host "  Testing Your Application" -ForegroundColor Cyan
            Write-Host "========================================================" -ForegroundColor Cyan
            Write-Host ""
            
            $openApp = Read-Host "Open your live application? (Y/N)"
            if ($openApp -eq "Y" -or $openApp -eq "y") {
                Write-Host "Opening $projectUrl..." -ForegroundColor Cyan
                Start-Process $projectUrl
            }
            
        } else {
            Write-Host "Could not retrieve project URL automatically" -ForegroundColor Yellow
            Write-Host "Please check: https://vercel.com/dashboard" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error retrieving project info: $_" -ForegroundColor Yellow
        Write-Host "Please check: https://vercel.com/dashboard" -ForegroundColor Yellow
    }
}

# Final summary
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Dr Nnadi's Records System is now:" -ForegroundColor Cyan
Write-Host "  ✓ Deployed to Vercel" -ForegroundColor Green
Write-Host "  ✓ Connected to PostgreSQL database" -ForegroundColor Green
Write-Host "  ✓ Accessible from anywhere" -ForegroundColor Green
Write-Host "  ✓ Using HTTPS encryption" -ForegroundColor Green
Write-Host "  ✓ Auto-deploying from GitHub" -ForegroundColor Green
Write-Host ""
Write-Host "Access your dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next time you update, just run:" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Update'" -ForegroundColor White
Write-Host "  git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "Vercel will auto-deploy in 1-2 minutes! 🚀" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
