# Combined Startup Script for Local Production Mode
# This script starts both Supabase and Docker container in one command

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Donor CRM - Complete Local Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/4] Checking Docker Desktop..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host "1. Open Docker Desktop from Start Menu" -ForegroundColor Gray
    Write-Host "2. Wait for 'Docker Desktop is running' in system tray" -ForegroundColor Gray
    Write-Host "3. Run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "OK: Docker is running" -ForegroundColor Green
Write-Host ""

# Start Supabase
Write-Host "[2/4] Starting Supabase..." -ForegroundColor Yellow
Write-Host "This may take a few seconds..." -ForegroundColor Gray

$supabaseOutput = npx supabase start 2>&1
$supabaseExitCode = $LASTEXITCODE

if ($supabaseExitCode -eq 0 -or $supabaseOutput -like "*Already running*") {
    Write-Host "OK: Supabase is running on port 58321" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "ERROR: Failed to start Supabase" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Docker Desktop is fully started" -ForegroundColor Gray
    Write-Host "2. Try running: npx supabase stop" -ForegroundColor Gray
    Write-Host "3. Then run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check Supabase status
Write-Host "[3/4] Verifying Supabase status..." -ForegroundColor Yellow
$supabaseVerified = $false

# Method 1: Check with netstat
try {
    $portCheck = netstat -ano | Select-String ":58321.*LISTENING"
    if ($portCheck) {
        $supabaseVerified = $true
        Write-Host "OK: Supabase API is accessible on port 58321" -ForegroundColor Green
    }
} catch {
    # Method 1 failed
}

# Method 2: Check with npx supabase status
if (-not $supabaseVerified) {
    try {
        $statusOutput = npx supabase status 2>&1 | Out-String
        if ($statusOutput -match "API URL.*58321") {
            $supabaseVerified = $true
            Write-Host "OK: Supabase is running" -ForegroundColor Green
        }
    } catch {
        Write-Host "WARNING: Could not verify Supabase status" -ForegroundColor Yellow
    }
}

if (-not $supabaseVerified) {
    Write-Host "WARNING: Supabase verification failed, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Start Docker container
Write-Host "[4/4] Starting Docker container..." -ForegroundColor Yellow
Write-Host "First build may take 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Shutdown Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop Supabase (optional):" -ForegroundColor Yellow
Write-Host "  npx supabase stop" -ForegroundColor Gray
Write-Host ""
