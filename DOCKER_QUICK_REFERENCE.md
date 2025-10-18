# 🚀 Docker Quick Reference

Quick commands for daily Docker usage with your Donor CRM.

## ⚡ Quick Start

```bash
# Start everything
docker-start.bat
# OR
docker-compose up -d
```

## 🛑 Quick Stop

```bash
# Stop everything
docker-stop.bat
# OR
docker-compose down
```

## 📊 Status & Monitoring

```bash
# Check status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# Resource usage
docker stats
```

## 🔄 Restart & Rebuild

```bash
# Restart a service
docker-compose restart app

# Rebuild and restart
docker-compose up --build -d

# Full rebuild (no cache)
docker-compose build --no-cache
```

## 🐚 Execute Commands

```bash
# Open shell in app container
docker-compose exec app sh

# Run npm command
docker-compose exec app npm install <package>

# Run tests
docker-compose exec app npm run test

# Database shell
docker-compose exec postgres psql -U postgres -d donor_crm
```

## 🗄️ Database Operations

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d donor_crm

# Backup database
docker-compose exec postgres pg_dump -U postgres donor_crm > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres donor_crm < backup.sql

# Check database health
docker-compose exec postgres pg_isready -U postgres
```

## 🔍 Debugging

```bash
# View logs (last 100 lines)
docker-compose logs --tail=100

# Follow logs live
docker-compose logs -f

# Check container details
docker inspect donor-crm-app

# Check environment variables
docker-compose exec app printenv
```

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose down -v

# Remove unused images
docker image prune -a

# Remove everything (⚠️ careful!)
docker system prune -a --volumes
```

## 🔧 Troubleshooting

```bash
# Port conflict: Find what's using port 3000
netstat -ano | findstr :3000

# Validate docker-compose.yml
docker-compose config

# Check Docker disk usage
docker system df

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📦 Package Management

```bash
# Add new package
docker-compose exec app npm install <package>

# Remove package
docker-compose exec app npm uninstall <package>

# Update packages
docker-compose exec app npm update

# Rebuild after package.json changes
docker-compose build app
```

## 🧪 Testing

```bash
# Unit tests
docker-compose exec app npm run test

# Watch mode
docker-compose exec app npm run test:watch

# Coverage
docker-compose exec app npm run test:coverage

# E2E tests
docker-compose exec app npm run test:e2e
```

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| CRM App | http://localhost:3000 | Main application |
| PostgreSQL | localhost:5432 | Database (optional) |
| Redis | localhost:6379 | Cache |

## 📝 Environment Variables

```bash
# View current environment
docker-compose exec app printenv | grep NEXT_PUBLIC

# Edit .env.local and restart
docker-compose restart app
```

## 🎯 Development Workflow

```mermaid
Start → docker-start.bat → Code → Auto Reload → Test → Commit → docker-stop.bat
```

## 💾 Data Persistence

Volumes (data survives container restarts):
- `postgres-data` - Database files
- `redis-data` - Redis persistence

## ⚠️ Common Errors

| Error | Solution |
|-------|----------|
| Port already in use | `netstat -ano \| findstr :3000` then kill process |
| Container won't start | `docker-compose logs app` |
| Out of disk space | `docker system prune -a` |
| Changes not showing | `docker-compose restart app` |
| Docker not running | Start Docker Desktop |

## 🚀 Production Commands

```bash
# Build production image
docker build -t donor-crm:prod .

# Tag for registry
docker tag donor-crm:prod registry.com/donor-crm:latest

# Push to registry
docker push registry.com/donor-crm:latest

# Pull and run on server
docker pull registry.com/donor-crm:latest
docker run -d -p 3000:3000 --env-file .env.production registry.com/donor-crm:latest
```

## 📋 Checklist

Daily Development:
- [ ] Start: `docker-start.bat`
- [ ] Code with hot reload
- [ ] Check logs if issues: `docker-compose logs -f app`
- [ ] Stop: `docker-stop.bat` (optional)

Before Committing:
- [ ] Tests pass: `docker-compose exec app npm run test`
- [ ] Lint passes: `docker-compose exec app npm run lint`
- [ ] Build succeeds: `docker-compose build`

Before Deploying:
- [ ] Production build works: `docker build -t donor-crm:prod .`
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] E2E tests pass

---

**Pro Tip:** Bookmark this page for quick reference! 🔖
