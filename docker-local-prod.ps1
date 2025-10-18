# PowerShell script to run the app in local production mode with Docker
# This builds a production image and runs it, connecting to local Supabase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Donor CRM - Local Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "OK: Docker is running" -ForegroundColor Green
Write-Host ""

# Check if Supabase is running
Write-Host "Checking Supabase..." -ForegroundColor Yellow
$supabaseRunning = $false

# Method 1: Check with npx supabase status
try {
    $statusOutput = npx supabase status 2>&1 | Out-String
    if ($statusOutput -match "API URL.*58321") {
        $supabaseRunning = $true
    }
} catch {
    # Method 1 failed, try method 2
}

# Method 2: Check if port is listening using netstat
if (-not $supabaseRunning) {
    try {
        $portCheck = netstat -ano | Select-String ":58321.*LISTENING"
        if ($portCheck) {
            $supabaseRunning = $true
        }
    } catch {
        # Port check failed
    }
}

if (-not $supabaseRunning) {
    Write-Host "WARNING: Supabase does not appear to be running on port 58321" -ForegroundColor Yellow
    Write-Host "The app needs Supabase to function. Please start it with:" -ForegroundColor Yellow
    Write-Host "  npx supabase start" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Do you want to continue anyway? (Y/N)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "Y" -and $continue -ne "y") {
        Write-Host "Exiting..." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK: Supabase is running on port 58321" -ForegroundColor Green
}
Write-Host ""

# Stop dev server if running
Write-Host "Stopping development server if running..." -ForegroundColor Yellow
$devPort = 3004
try {
    $connection = Test-NetConnection -ComputerName localhost -Port $devPort -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "Port $devPort is in use. Please stop the development server." -ForegroundColor Yellow
        Write-Host "Press Ctrl+C in the dev server terminal, then run this script again." -ForegroundColor Yellow
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    } else {
        Write-Host "OK: No development server running on port $devPort" -ForegroundColor Green
    }
} catch {
    Write-Host "OK: No development server detected" -ForegroundColor Green
}
Write-Host ""

# Load environment variables
Write-Host "Loading environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.docker") {
    Write-Host "OK: Using .env.docker" -ForegroundColor Green
} else {
    Write-Host "WARNING: .env.docker not found" -ForegroundColor Yellow
}
Write-Host ""

# Build and start the container
Write-Host "Building production Docker image..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first run..." -ForegroundColor Gray
Write-Host ""

docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Container stopped" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
