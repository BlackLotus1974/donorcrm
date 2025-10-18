# Docker Quick Start Script for Donor CRM (PowerShell)
# This script starts all Docker services for the CRM application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Donor CRM - Docker Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "[ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "[WARNING] .env.local not found" -ForegroundColor Yellow
    Write-Host "Creating from .env.docker.example..." -ForegroundColor Yellow
    Copy-Item ".env.docker.example" ".env.local"
    Write-Host "[OK] Created .env.local" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting Docker containers..." -ForegroundColor Cyan
Write-Host ""

# Start all services
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Failed to start Docker containers" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your CRM application is now running:" -ForegroundColor White
Write-Host ""
Write-Host "  - CRM App:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - PostgreSQL:     localhost:5432" -ForegroundColor Cyan
Write-Host "  - Redis:          localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:       docker-compose logs -f" -ForegroundColor Yellow
Write-Host "To stop services:   docker-compose down" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening application in browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press any key to view logs (Ctrl+C to exit)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

docker-compose logs -f
