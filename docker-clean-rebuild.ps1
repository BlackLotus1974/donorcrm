# ============================================
# Docker Complete Clean and Rebuild
# ============================================
# This script performs a COMPLETE Docker cleanup
# to ensure no cached layers or old images remain
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  COMPLETE DOCKER CLEANUP" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This will remove ALL Docker build cache" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel, or" -ForegroundColor Yellow
Write-Host ""
Pause

Write-Host ""
Write-Host "Starting complete cleanup..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop and remove containers
Write-Host "[1/7] Stopping containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null
Write-Host "[OK] Containers stopped" -ForegroundColor Green

# Step 2: Remove all containers (including stopped ones)
Write-Host "[2/7] Removing all stopped containers..." -ForegroundColor Yellow
docker container prune -f 2>&1 | Out-Null
Write-Host "[OK] Containers removed" -ForegroundColor Green

# Step 3: Remove images for this project
Write-Host "[3/7] Removing project images..." -ForegroundColor Yellow
$images = docker images --filter=reference='crm-app*' -q
if ($images) {
    docker rmi -f $images 2>&1 | Out-Null
    Write-Host "[OK] Project images removed" -ForegroundColor Green
} else {
    Write-Host "[OK] No project images to remove" -ForegroundColor Green
}

# Step 4: Remove ALL build cache (nuclear option)
Write-Host "[4/7] Removing ALL build cache..." -ForegroundColor Yellow
docker builder prune -af 2>&1 | Out-Null
Write-Host "[OK] Build cache cleared" -ForegroundColor Green

# Step 5: Remove dangling images
Write-Host "[5/7] Removing dangling images..." -ForegroundColor Yellow
docker image prune -f 2>&1 | Out-Null
Write-Host "[OK] Dangling images removed" -ForegroundColor Green

# Step 6: Validate Dockerfile
Write-Host "[6/7] Validating Dockerfile..." -ForegroundColor Yellow
$dockerfileContent = Get-Content "Dockerfile" -Raw
if ($dockerfileContent -match '\|\|') {
    Write-Host "[ERROR] Dockerfile still contains '||' operator!" -ForegroundColor Red
    Write-Host "The file may not have been saved correctly" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dockerfile syntax is valid" -ForegroundColor Green

# Step 7: Build from scratch
Write-Host "[7/7] Building from scratch (no cache)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will take several minutes..." -ForegroundColor Gray
Write-Host "Building app container..." -ForegroundColor Gray
Write-Host ""

# Build only the app service first to see detailed output
$buildStartTime = Get-Date
docker-compose build --no-cache app 2>&1 | Tee-Object -Variable buildOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $buildOutput -ForegroundColor Gray
    exit 1
}

$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds

Write-Host ""
Write-Host "[OK] Build completed in $([math]::Round($buildDuration, 1)) seconds" -ForegroundColor Green
Write-Host ""

# Start all services
Write-Host "Starting all services..." -ForegroundColor Yellow
docker-compose up -d 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
    Write-Host "Checking logs..." -ForegroundColor Yellow
    docker-compose logs
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Wait a moment for containers to initialize
Start-Sleep -Seconds 3

# Show container status
Write-Host "Container Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  App:        http://localhost:3000" -ForegroundColor White
Write-Host "  PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "  Redis:      localhost:6379" -ForegroundColor White
Write-Host ""

Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  Logs:     docker-compose logs -f app" -ForegroundColor Gray
Write-Host "  Stop:     docker-compose down" -ForegroundColor Gray
Write-Host "  Restart:  docker-compose restart app" -ForegroundColor Gray
Write-Host ""
