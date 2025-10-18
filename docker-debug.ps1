# Docker Debug Script
# Purpose: Capture the ACTUAL error from the failing container
# This script will show ALL output including crashes

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  DIAGNOSTIC SESSION STARTING" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script will:" -ForegroundColor Cyan
Write-Host "  1. Stop any existing debug containers" -ForegroundColor Gray
Write-Host "  2. Build the debug image" -ForegroundColor Gray
Write-Host "  3. Start the container and show ALL logs" -ForegroundColor Gray
Write-Host "  4. Capture the exact error when npm run dev fails" -ForegroundColor Gray
Write-Host ""
Write-Host "Please wait..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean up any previous debug containers
Write-Host "[Step 1/3] Cleaning up previous debug containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.debug.yml down --remove-orphans 2>&1 | Out-Null
Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 2: Build the debug image
Write-Host "[Step 2/3] Building debug image..." -ForegroundColor Yellow
$buildOutput = docker-compose -f docker-compose.debug.yml build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}
Write-Host "[OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 3: Start container and capture ALL output
Write-Host "[Step 3/3] Starting container and capturing logs..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONTAINER OUTPUT BELOW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Use --abort-on-container-exit to stop when the app container fails
# This ensures we see the error before docker-compose exits
docker-compose -f docker-compose.debug.yml up --abort-on-container-exit

# Capture the exit code
$containerExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONTAINER OUTPUT ENDED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Show diagnostic summary
if ($containerExitCode -eq 0) {
    Write-Host "[SUCCESS] Container started successfully!" -ForegroundColor Green
    Write-Host "The container is still running. Check http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "To stop: docker-compose -f docker-compose.debug.yml down" -ForegroundColor Gray
} else {
    Write-Host "[FAILED] Container exited with code: $containerExitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  DIAGNOSTIC INFORMATION" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please review the container output above to find:" -ForegroundColor Cyan
    Write-Host "  - npm error messages" -ForegroundColor Gray
    Write-Host "  - Node.js errors" -ForegroundColor Gray
    Write-Host "  - Next.js configuration errors" -ForegroundColor Gray
    Write-Host "  - File permission errors" -ForegroundColor Gray
    Write-Host "  - Path resolution errors" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If the output scrolled by too fast, run:" -ForegroundColor Cyan
    Write-Host "  docker logs donor-crm-app-debug" -ForegroundColor White
    Write-Host ""

    # Try to get the last logs if they're available
    Write-Host "Attempting to retrieve last container logs..." -ForegroundColor Yellow
    $lastLogs = docker logs donor-crm-app-debug 2>&1
    if ($lastLogs) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "  LAST CONTAINER LOGS" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host $lastLogs
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  DIAGNOSTIC SESSION ENDED" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
