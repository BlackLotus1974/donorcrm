# Start Production Environment
# This runs the app in production mode (for testing)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Production Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-Not (Test-Path ".env.local")) {
    Write-Host "[WARNING] .env.local not found" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "[INFO] Created .env.local from .env.example" -ForegroundColor Green
        Write-Host "[ACTION] Please edit .env.local with your credentials" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "Building production image..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Production environment started" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "  App (Prod): http://localhost:3000 (optimized build)" -ForegroundColor White
    Write-Host "  PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "  Redis:      localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  View logs:  docker-compose -f docker-compose.prod.yml logs -f app" -ForegroundColor Gray
    Write-Host "  Stop:       docker-compose -f docker-compose.prod.yml down" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Red
}
