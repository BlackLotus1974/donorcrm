# Combined Shutdown Script for Local Production Mode
# This script stops both Docker container and Supabase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Donor CRM - Complete Shutdown" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop Docker container
Write-Host "[1/2] Stopping Docker container..." -ForegroundColor Yellow
docker-compose -f docker-compose.local-prod.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Docker container stopped" -ForegroundColor Green
} else {
    Write-Host "WARNING: Docker container may not have been running" -ForegroundColor Yellow
}
Write-Host ""

# Stop Supabase
Write-Host "[2/2] Stopping Supabase..." -ForegroundColor Yellow
npx supabase stop

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Supabase stopped" -ForegroundColor Green
} else {
    Write-Host "WARNING: Supabase may not have been running" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Shutdown Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your data is saved. Start again with:" -ForegroundColor Green
Write-Host "  .\start-local-prod.ps1" -ForegroundColor Cyan
Write-Host ""
