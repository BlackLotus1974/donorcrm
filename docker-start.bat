@echo off
REM Docker Quick Start Script for Donor CRM
REM This script starts all Docker services for the CRM application

echo ========================================
echo   Donor CRM - Docker Quick Start
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [WARNING] .env.local not found
    echo Creating from .env.docker.example...
    copy .env.docker.example .env.local >nul
    echo [OK] Created .env.local
    echo.
)

echo Starting Docker containers...
echo.

REM Start all services
docker-compose up -d

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start Docker containers
    echo Check the error messages above
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
echo Your CRM application is now running:
echo.
echo   - CRM App:        http://localhost:3000
echo   - PostgreSQL:     localhost:5432
echo   - Redis:          localhost:6379
echo.
echo To view logs:       docker-compose logs -f
echo To stop services:   docker-compose down
echo.
echo Opening application in browser...
timeout /t 3 >nul
start http://localhost:3000

echo.
echo Press any key to view logs (Ctrl+C to exit)...
pause >nul

docker-compose logs -f
