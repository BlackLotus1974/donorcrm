# Docker Stop Script for Donor CRM (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping Donor CRM Docker Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

docker-compose down

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to stop services" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[OK] All services stopped successfully!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
