# ============================================
# Docker Setup Script - Comprehensive Fix
# ============================================
# This script addresses the root architectural issues:
# 1. Clears Docker cache to ensure fresh build
# 2. Validates environment configuration
# 3. Builds with correct Dockerfile syntax
# 4. Provides detailed error reporting
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Donor CRM - Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Step 1: Verify Docker is running
# ============================================
Write-Host "[1/6] Checking Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker Desktop is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker is running" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 2: Validate environment configuration
# ============================================
Write-Host "[2/6] Validating environment configuration..." -ForegroundColor Yellow

if (-Not (Test-Path ".env.local")) {
    Write-Host "[WARNING] .env.local not found" -ForegroundColor Yellow

    if (Test-Path ".env.example") {
        Write-Host "Creating .env.local from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env.local"
        Write-Host "[ACTION REQUIRED] Please edit .env.local with your Supabase credentials" -ForegroundColor Red
        Write-Host "Then run this script again" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "[ERROR] .env.example not found" -ForegroundColor Red
        Write-Host "Cannot create environment configuration" -ForegroundColor Red
        exit 1
    }
}

# Load and validate environment variables
$envContent = Get-Content ".env.local" -Raw
if ($envContent -notmatch "NEXT_PUBLIC_SUPABASE_URL=\S+") {
    Write-Host "[ERROR] NEXT_PUBLIC_SUPABASE_URL not configured in .env.local" -ForegroundColor Red
    exit 1
}
if ($envContent -notmatch "NEXT_PUBLIC_SUPABASE_ANON_KEY=\S+") {
    Write-Host "[ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY not configured in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Environment configuration valid" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 3: Stop and remove existing containers
# ============================================
Write-Host "[3/6] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null
Write-Host "[OK] Containers stopped" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 4: Clear Docker build cache
# ============================================
Write-Host "[4/6] Clearing Docker build cache..." -ForegroundColor Yellow
Write-Host "This ensures the new Dockerfile is used" -ForegroundColor Gray

# Remove only build cache (not images/volumes)
docker builder prune -f 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Build cache cleared" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not clear build cache" -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# Step 5: Build Docker images
# ============================================
Write-Host "[5/6] Building Docker images (this may take several minutes)..." -ForegroundColor Yellow
Write-Host "Building without cache to ensure latest Dockerfile is used..." -ForegroundColor Gray
Write-Host ""

$buildOutput = docker-compose build --no-cache 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Host ""
    Write-Host "[OK] Docker images built successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Build output:" -ForegroundColor Yellow
    Write-Host $buildOutput
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Syntax errors in source code" -ForegroundColor Gray
    Write-Host "2. Missing dependencies in package.json" -ForegroundColor Gray
    Write-Host "3. TypeScript compilation errors" -ForegroundColor Gray
    Write-Host ""
    Write-Host "The build process should ignore ESLint/TypeScript errors" -ForegroundColor Gray
    Write-Host "as configured in next.config.ts" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# ============================================
# Step 6: Start containers
# ============================================
Write-Host "[6/6] Starting containers..." -ForegroundColor Yellow
docker-compose up -d 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Containers started successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Display container status
Write-Host "Container Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

Write-Host "Services Available:" -ForegroundColor Cyan
Write-Host "  Next.js App:  http://localhost:3000" -ForegroundColor White
Write-Host "  PostgreSQL:   localhost:5432" -ForegroundColor White
Write-Host "  Redis:        localhost:6379" -ForegroundColor White
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:        docker-compose logs -f" -ForegroundColor Gray
Write-Host "  Stop containers:  docker-compose down" -ForegroundColor Gray
Write-Host "  Restart:          docker-compose restart" -ForegroundColor Gray
Write-Host "  View status:      docker-compose ps" -ForegroundColor Gray
Write-Host ""
