@echo off
REM Docker Stop Script for Donor CRM

echo ========================================
echo   Stopping Donor CRM Docker Services
echo ========================================
echo.

docker-compose down

if errorlevel 1 (
    echo [ERROR] Failed to stop services
    pause
    exit /b 1
)

echo.
echo [OK] All services stopped successfully!
echo.
pause
