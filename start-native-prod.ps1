# Native Production Mode Startup Script
# Runs the app in production mode WITHOUT Docker
# Uses .env.local for configuration

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " NATIVE PRODUCTION MODE STARTUP" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Supabase is running
Write-Host "[1/3] Checking Supabase..." -ForegroundColor Yellow
$supabaseRunning = $false

try {
    $statusOutput = npx supabase status 2>&1 | Out-String
    if ($statusOutput -match "API URL.*127\.0\.0\.1:54321") {
        Write-Host " Supabase is running on port 54321" -ForegroundColor Green
        $supabaseRunning = $true
    }
} catch {
    # Check failed
}

if (-not $supabaseRunning) {
    # Try port check as fallback
    try {
        $portCheck = netstat -ano | Select-String ":54321.*LISTENING"
        if ($portCheck) {
            Write-Host " Supabase is running on port 54321 (detected via port)" -ForegroundColor Green
            $supabaseRunning = $true
        }
    } catch {
        # Port check failed
    }
}

if (-not $supabaseRunning) {
    Write-Host ""
    Write-Host "ERROR: Supabase is not running!" -ForegroundColor Red
    Write-Host "Please start Supabase first:" -ForegroundColor Yellow
    Write-Host "  npx supabase start" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Step 2: Build the application
Write-Host ""
Write-Host "[2/3] Building production bundle..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Start the production server
Write-Host ""
Write-Host "[3/3] Starting production server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host " APPLICATION READY" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host " App URL:        http://localhost:3000" -ForegroundColor Cyan
Write-Host " Supabase API:   http://127.0.0.1:54321" -ForegroundColor Cyan
Write-Host " Supabase Studio: http://127.0.0.1:60323" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm start
