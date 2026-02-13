# Vendor Portal Load Test - Install and Run Script
# This script installs k6 (if not installed) and runs the load test

Write-Host "🚀 Vendor Portal Load Test Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if k6 is installed
Write-Host "📋 Checking k6 installation..." -ForegroundColor Yellow
$k6Installed = Get-Command k6 -ErrorAction SilentlyContinue

if ($null -eq $k6Installed) {
    Write-Host "❌ k6 is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Installing k6..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
    
    if ($null -ne $chocoInstalled) {
        Write-Host "   Using Chocolatey..." -ForegroundColor Gray
        choco install k6 -y
    } else {
        # Check if winget is available
        $wingetInstalled = Get-Command winget -ErrorAction SilentlyContinue
        
        if ($null -ne $wingetInstalled) {
            Write-Host "   Using winget..." -ForegroundColor Gray
            winget install k6 --accept-package-agreements --accept-source-agreements
        } else {
            Write-Host "❌ Neither Chocolatey nor winget is available" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please install k6 manually:" -ForegroundColor Yellow
            Write-Host "   1. Download from: https://github.com/grafana/k6/releases" -ForegroundColor White
            Write-Host "   2. Or install Chocolatey: https://chocolatey.org/install" -ForegroundColor White
            Write-Host "   3. Then run: choco install k6" -ForegroundColor White
            exit 1
        }
    }
    
    # Verify installation
    $k6Installed = Get-Command k6 -ErrorAction SilentlyContinue
    if ($null -eq $k6Installed) {
        Write-Host "❌ k6 installation failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ k6 installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ k6 is already installed" -ForegroundColor Green
    $version = k6 version
    Write-Host "   Version: $version" -ForegroundColor Gray
}

Write-Host ""

# Check if test data is seeded
Write-Host "📊 Checking test data..." -ForegroundColor Yellow
Write-Host "   Please ensure you have run the seeder:" -ForegroundColor Gray
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   php artisan db:seed --class=VendorPortalLoadTestSeeder" -ForegroundColor White
Write-Host ""

# Ask user if they want to continue
$continue = Read-Host "Continue with load test? (Y/N)"
if ($continue -ne "Y" -and $continue -ne "y") {
    Write-Host "❌ Load test cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting Vendor Portal Load Test..." -ForegroundColor Cyan
Write-Host "   Duration: ~27 minutes" -ForegroundColor Gray
Write-Host "   Scenarios: 3 (Login Quote List Mixed Operations)" -ForegroundColor Gray
Write-Host "   Max VUs: 500" -ForegroundColor Gray
Write-Host ""

# Set environment variables
$env:API_BASE_URL = "http://localhost:8000"
$env:TENANT_DOMAIN = "localhost"

# Run the load test
k6 run k6/load-tests/vendor-portal-load-test.js

Write-Host ""
Write-Host "✅ Load test completed!" -ForegroundColor Green
Write-Host "📊 Check results in: k6/results/" -ForegroundColor Yellow
