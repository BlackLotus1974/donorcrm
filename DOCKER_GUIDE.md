# Docker Setup Guide for Donor CRM

This guide explains how to run your Donor CRM application using Docker and Docker Compose.

## 📋 Prerequisites

✅ **Docker Desktop** - Already installed and running
✅ **Git** - For cloning the repository
✅ **Supabase Account** - For cloud database (or use local PostgreSQL)

## 🎯 What's Included

Your Docker setup includes:

### 1. **Next.js Application Container**
- Runs your CRM app on port `3000`
- Hot reload enabled in development mode
- Optimized multi-stage build for production

### 2. **PostgreSQL Database Container** (Optional Local DB)
- PostgreSQL 15 on port `5432`
- Auto-runs migrations from `supabase/migrations/`
- Persistent data storage with Docker volumes

### 3. **Redis Container** (Caching)
- Redis 7 on port `6379`
- Useful for session management and caching
- Persistent storage with append-only file

## 🚀 Quick Start

### Option 1: Development Mode (Recommended for Development)

This mode connects to your cloud Supabase instance and provides hot reload.

```bash
# 1. Clone the repository (if not already done)
cd c:\Users\eshay\CRM\crm

# 2. Copy environment variables
cp .env.example .env.local

# 3. Edit .env.local with your Supabase credentials
# (Already configured with your Supabase URL and key)

# 4. Start all services
docker-compose up

# Or run in detached mode (background)
docker-compose up -d
```

**Access the application:**
- **CRM App**: http://localhost:3000
- **PostgreSQL**: localhost:5432 (optional local DB)
- **Redis**: localhost:6379

### Option 2: Production Build

This builds an optimized production image.

```bash
# 1. Build the production image
docker-compose build app

# 2. Run in production mode
docker-compose up -d

# 3. View logs
docker-compose logs -f app
```

## 📦 Docker Commands Cheat Sheet

### Starting Services
```bash
# Start all services
docker-compose up

# Start in background (detached)
docker-compose up -d

# Start specific service
docker-compose up app

# Rebuild and start
docker-compose up --build
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop app
```

### Viewing Logs
```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100
```

### Managing Containers
```bash
# List running containers
docker-compose ps

# Restart a service
docker-compose restart app

# Execute command in container
docker-compose exec app sh

# View container stats
docker stats
```

### Database Operations
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d donor_crm

# Run migrations manually
docker-compose exec app npm run migrate

# Backup database
docker-compose exec postgres pg_dump -U postgres donor_crm > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres donor_crm < backup.sql
```

### Cleaning Up
```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove all unused resources (⚠️ careful!)
docker system prune -a
```

## 🔧 Configuration

### Environment Variables

The app uses environment variables from `.env.local`:

```env
# Supabase (Cloud or Local)
NEXT_PUBLIC_SUPABASE_URL=https://asclamyhgsbgixleplte.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: If using local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/donor_crm

# Optional: Redis connection
REDIS_URL=redis://redis:6379
```

### Customizing Docker Compose

Edit `docker-compose.yml` to:
- Change port mappings
- Add more services
- Configure resource limits
- Set up networks

**Example: Change app port to 3001:**
```yaml
services:
  app:
    ports:
      - "3001:3000"  # Changed from 3000:3000
```

## 🏗️ Architecture

### Multi-Stage Dockerfile

The `Dockerfile` uses 3 stages for optimal performance:

1. **deps** - Install dependencies only
2. **builder** - Build the Next.js app
3. **runner** - Minimal production image

**Benefits:**
- Smaller final image (~150MB vs ~1GB)
- Faster builds with layer caching
- Security (no build tools in production)

### Docker Compose Structure

```
crm-network (Docker Network)
├── app (Next.js)           → Port 3000
├── postgres (Optional)     → Port 5432
└── redis (Cache)           → Port 6379
```

All services communicate via the `crm-network` bridge network.

## 🐛 Troubleshooting

### Issue: Port Already in Use

**Problem:** `Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use`

**Solutions:**
```bash
# Option 1: Stop the conflicting process
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Option 2: Change the port in docker-compose.yml
# Edit docker-compose.yml and change "3000:3000" to "3001:3000"
```

### Issue: Container Won't Start

**Problem:** Container exits immediately

**Solutions:**
```bash
# Check logs for errors
docker-compose logs app

# Check if environment variables are set
docker-compose config

# Rebuild the image
docker-compose build --no-cache app
```

### Issue: Database Connection Failed

**Problem:** Cannot connect to PostgreSQL

**Solutions:**
```bash
# Check if postgres is running
docker-compose ps

# Wait for postgres to be healthy
docker-compose up -d postgres
# Wait 10 seconds
docker-compose up app

# Check postgres logs
docker-compose logs postgres
```

### Issue: Changes Not Reflecting

**Problem:** Code changes not showing up

**Solutions:**
```bash
# For development mode, restart the app service
docker-compose restart app

# For production mode, rebuild
docker-compose up --build app

# Clear Next.js cache
docker-compose exec app rm -rf .next
docker-compose restart app
```

### Issue: Out of Disk Space

**Problem:** Docker consuming too much space

**Solutions:**
```bash
# Check Docker disk usage
docker system df

# Remove unused images
docker image prune -a

# Remove unused volumes (⚠️ careful!)
docker volume prune

# Nuclear option: clean everything (⚠️ very careful!)
docker system prune -a --volumes
```

## 🎨 Development Workflow

### Daily Development

```bash
# Morning: Start all services
docker-compose up -d

# Make code changes (hot reload enabled)
# ...your coding here...

# View logs if needed
docker-compose logs -f app

# Evening: Stop services (optional)
docker-compose down
```

### Adding New Dependencies

```bash
# Install new npm package
docker-compose exec app npm install <package-name>

# Rebuild image (if adding to package.json directly)
docker-compose build app
```

### Running Tests

```bash
# Run Jest tests
docker-compose exec app npm run test

# Run Playwright E2E tests
docker-compose exec app npm run test:e2e

# Run with coverage
docker-compose exec app npm run test:coverage
```

### Database Migrations

```bash
# Create new migration
docker-compose exec app npx supabase migration new <migration_name>

# Run migrations
docker-compose exec postgres psql -U postgres -d donor_crm -f /docker-entrypoint-initdb.d/<migration_file>.sql

# Or if using Supabase CLI
docker-compose exec app npx supabase db push
```

## 🚢 Production Deployment

### Building for Production

```bash
# 1. Build optimized image
docker build -t donor-crm:latest .

# 2. Tag for registry
docker tag donor-crm:latest your-registry.com/donor-crm:latest

# 3. Push to registry
docker push your-registry.com/donor-crm:latest
```

### Deploying to Cloud Platforms

#### **Vercel** (Recommended for Next.js)
- No Docker needed - Vercel handles deployment
- Connect GitHub repository
- Add environment variables in Vercel dashboard

#### **AWS ECS/Fargate**
```bash
# Push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-url>
docker tag donor-crm:latest <ecr-url>/donor-crm:latest
docker push <ecr-url>/donor-crm:latest
```

#### **Google Cloud Run**
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/your-project/donor-crm
gcloud run deploy donor-crm --image gcr.io/your-project/donor-crm --platform managed
```

#### **DigitalOcean App Platform**
- Connect GitHub repository
- Select Dockerfile build
- Configure environment variables

## 📊 Monitoring & Performance

### Health Checks

Check service health:
```bash
# PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Redis
docker-compose exec redis redis-cli ping

# App (via HTTP)
curl http://localhost:3000
```

### Resource Usage

Monitor container resources:
```bash
# Real-time stats
docker stats

# Specific container
docker stats donor-crm-app

# Memory limit per container (edit docker-compose.yml)
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 🔒 Security Best Practices

### 1. **Use Secrets Management**
Never commit `.env` files. Use:
- Docker secrets (Swarm mode)
- AWS Secrets Manager
- HashiCorp Vault

### 2. **Run as Non-Root User**
Already configured in `Dockerfile`:
```dockerfile
USER nextjs
```

### 3. **Scan Images for Vulnerabilities**
```bash
# Using Docker Scout
docker scout cves donor-crm:latest

# Using Trivy
trivy image donor-crm:latest
```

### 4. **Keep Images Updated**
```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest
docker-compose build --pull
```

## 📚 Additional Resources

- **Docker Docs**: https://docs.docker.com
- **Docker Compose**: https://docs.docker.com/compose
- **Next.js Docker**: https://nextjs.org/docs/deployment#docker-image
- **Supabase Self-Hosting**: https://supabase.com/docs/guides/self-hosting

## 🎯 Next Steps

1. ✅ Docker setup created
2. 🔄 **Run `docker-compose up` to test**
3. 🔍 Check logs and verify everything works
4. 🚀 Start developing with hot reload
5. 📝 Customize configuration as needed

---

**Need help?** Check the troubleshooting section or review Docker logs with `docker-compose logs -f`.
