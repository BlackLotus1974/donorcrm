#!/bin/bash

# Setup script for local development environment
# This script sets up the Context Engineering Template with local Supabase

set -e

echo "🚀 Setting up Context Engineering Template local development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose is not available. Please install Docker Compose and try again."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local - please review and update if needed"
else
    echo "✅ .env.local already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/context-templates
mkdir -p exports
mkdir -p supabase/functions

# Start Supabase services with Docker Compose
echo "🐳 Starting Supabase services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if Supabase is running
echo "🔍 Checking Supabase services..."
if curl -f http://localhost:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase API is running on http://localhost:54321"
else
    echo "❌ Supabase API is not responding. Check Docker logs with: docker-compose logs"
    exit 1
fi

if curl -f http://localhost:54323 > /dev/null 2>&1; then
    echo "✅ Supabase Studio is running on http://localhost:54323"
else
    echo "⚠️  Supabase Studio might not be ready yet. It should be available at http://localhost:54323"
fi

# Install dependencies if package.json exists
if [ -f package.json ]; then
    echo "📦 Installing Node.js dependencies..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    echo "✅ Dependencies installed"
fi

echo ""
echo "🎉 Local development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update .env.local if needed"
echo "2. Access Supabase Studio at http://localhost:54323"
echo "3. Start the Next.js development server:"
echo "   npm run dev"
echo ""
echo "🔗 Useful URLs:"
echo "   - Supabase Studio: http://localhost:54323"
echo "   - Supabase API: http://localhost:54321"
echo "   - Email Testing (Inbucket): http://localhost:54324"
echo "   - Next.js App: http://localhost:3000 (after running npm run dev)"
echo ""
echo "🛠️  Useful commands:"
echo "   - Stop services: docker-compose down"
echo "   - View logs: docker-compose logs -f"
echo "   - Reset database: docker-compose down -v && docker-compose up -d"