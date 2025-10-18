# Test Docker Production Mode with Remote Supabase
# Runs comprehensive Playwright E2E tests against Docker container

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " DOCKER PRODUCTION MODE - E2E TESTS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker container is running
Write-Host "[1/4] Checking Docker container..." -ForegroundColor Yellow
$containerRunning = docker ps --filter "name=donor-crm-local-prod" --filter "status=running" --format "{{.Names}}"

if (-not $containerRunning) {
    Write-Host ""
    Write-Host "ERROR: Docker container is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start the container first:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.local-prod.yml up" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host " Docker container is running" -ForegroundColor Green

# Check if app is responding
Write-Host ""
Write-Host "[2/4] Checking if app is responding..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 2>$null
    Write-Host " App is responding on port 3000" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: App is not responding on port 3000!" -ForegroundColor Red
    Write-Host "Check Docker logs:" -ForegroundColor Yellow
    Write-Host "  docker logs donor-crm-local-prod" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Check if Playwright is installed
Write-Host ""
Write-Host "[3/4] Checking Playwright..." -ForegroundColor Yellow
$playwrightInstalled = Test-Path "node_modules\@playwright\test"

if (-not $playwrightInstalled) {
    Write-Host " Playwright not found. Installing..." -ForegroundColor Yellow
    npm run playwright:install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to install Playwright!" -ForegroundColor Red
        exit 1
    }
}

Write-Host " Playwright is ready" -ForegroundColor Green

# Run the tests
Write-Host ""
Write-Host "[4/4] Running E2E tests..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " TEST EXECUTION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

npx playwright test e2e/remote-supabase-production.spec.ts --reporter=list

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host " ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Docker production deployment with remote Supabase is working perfectly!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host " SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the test output above for details." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Supabase credentials incorrect" -ForegroundColor White
    Write-Host "  2. Network connectivity to Supabase cloud" -ForegroundColor White
    Write-Host "  3. Database migrations not applied" -ForegroundColor White
    Write-Host ""
    Write-Host "View detailed test results:" -ForegroundColor Yellow
    Write-Host "  npx playwright show-report" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
