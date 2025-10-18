@echo off
REM Batch script to run the app in local production mode with Docker
REM This builds a production image and runs it, connecting to local Supabase

echo ========================================
echo Donor CRM - Local Production Deployment
echo ========================================
echo.

echo Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker is running
echo.

echo Loading environment variables...
if exist .env.docker (
    echo [OK] Using .env.docker
) else (
    echo WARNING: .env.docker not found
)
echo.

echo Building production Docker image...
echo This may take a few minutes on first run...
echo.

docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build

echo.
echo ========================================
echo Container stopped
echo ========================================
pause
