@echo off
REM Setup script for local development environment on Windows
REM This script sets up the Context Engineering Template with local Supabase

echo 🚀 Setting up Context Engineering Template local development environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose is not available. Please install Docker Compose and try again.
        exit /b 1
    )
)

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local from example...
    copy .env.local.example .env.local
    echo ✅ Created .env.local - please review and update if needed
) else (
    echo ✅ .env.local already exists
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist data\context-templates mkdir data\context-templates
if not exist exports mkdir exports
if not exist supabase\functions mkdir supabase\functions

REM Start Supabase services with Docker Compose
echo 🐳 Starting Supabase services with Docker Compose...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if Supabase is running
echo 🔍 Checking Supabase services...
curl -f http://localhost:54321/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Supabase API is running on http://localhost:54321
) else (
    echo ❌ Supabase API is not responding. Check Docker logs with: docker-compose logs
    exit /b 1
)

curl -f http://localhost:54323 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Supabase Studio is running on http://localhost:54323
) else (
    echo ⚠️  Supabase Studio might not be ready yet. It should be available at http://localhost:54323
)

REM Install dependencies if package.json exists
if exist package.json (
    echo 📦 Installing Node.js dependencies...
    where pnpm >nul 2>&1
    if %errorlevel% equ 0 (
        pnpm install
    ) else (
        where yarn >nul 2>&1
        if %errorlevel% equ 0 (
            yarn install
        ) else (
            npm install
        )
    )
    echo ✅ Dependencies installed
)

echo.
echo 🎉 Local development environment setup complete!
echo.
echo 📋 Next steps:
echo 1. Review and update .env.local if needed
echo 2. Access Supabase Studio at http://localhost:54323
echo 3. Start the Next.js development server:
echo    npm run dev
echo.
echo 🔗 Useful URLs:
echo    - Supabase Studio: http://localhost:54323
echo    - Supabase API: http://localhost:54321
echo    - Email Testing (Inbucket): http://localhost:54324
echo    - Next.js App: http://localhost:3000 (after running npm run dev)
echo.
echo 🛠️  Useful commands:
echo    - Stop services: docker-compose down
echo    - View logs: docker-compose logs -f
echo    - Reset database: docker-compose down -v ^&^& docker-compose up -d

pause