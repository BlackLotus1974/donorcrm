# Docker Complete Rebuild Script
# This script clears ALL Docker cache and rebuilds from scratch

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Docker Complete Rebuild" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all containers
Write-Host "Step 1: Stopping all containers..." -ForegroundColor Yellow
docker-compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: docker-compose down failed or no containers running" -ForegroundColor Yellow
}

# Step 2: Clear Docker build cache
Write-Host ""
Write-Host "Step 2: Clearing Docker build cache..." -ForegroundColor Yellow
docker builder prune -af
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to clear build cache" -ForegroundColor Red
    exit 1
}

# Step 3: Remove all unused images
Write-Host ""
Write-Host "Step 3: Removing unused Docker images..." -ForegroundColor Yellow
docker image prune -af
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Failed to prune images" -ForegroundColor Yellow
}

# Step 4: Check for .env.local
Write-Host ""
Write-Host "Step 4: Checking environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local from .env.example..." -ForegroundColor Green
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "IMPORTANT: Update .env.local with your Supabase credentials!" -ForegroundColor Red
    } else {
        Write-Host "Warning: .env.example not found" -ForegroundColor Yellow
    }
}

# Step 5: Rebuild without cache
Write-Host ""
Write-Host "Step 5: Building Docker images (no cache)..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Red
    exit 1
}

# Step 6: Start containers
Write-Host ""
Write-Host "Step 6: Starting containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "STARTUP FAILED" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Containers are running:" -ForegroundColor Green
docker-compose ps
Write-Host ""
Write-Host "Application: http://localhost:3000" -ForegroundColor Cyan
Write-Host "PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "Redis: localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "Stop containers: docker-compose down" -ForegroundColor Gray
