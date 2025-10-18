# Docker Architecture - Complete Guide

## The Root Problem (Now Fixed)

### What Was Wrong

The original docker-compose.yml tried to **mix development and production modes**:
- Built a **production** image (standalone Next.js server)
- Mounted **source code** as a volume (development approach)
- Overrode the command with `npm run dev` (development mode)

This created a fundamental conflict:
1. Production Dockerfile created `server.js` and `.next/standalone/`
2. docker-compose mounted source code, **overwriting** the production build
3. Tried to run `npm run dev` on the production image
4. Container couldn't start because the architecture was broken

### The Solution

**Separated into TWO distinct modes:**
- **Development Mode**: Hot reload, source code mounted, `npm run dev`
- **Production Mode**: Optimized build, standalone server, `node server.js`

---

## Architecture Overview

### Development Mode
```
┌─────────────────────────────────────────────┐
│ Dockerfile.dev                               │
│ - Single-stage build                         │
│ - Install ALL dependencies (including dev)   │
│ - Copy source code                           │
│ - CMD: npm run dev                           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ docker-compose.dev.yml                       │
│ - Mount source code: . → /app               │
│ - Anonymous volumes: /app/node_modules       │
│ - Anonymous volumes: /app/.next              │
│ - Hot reload enabled                         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
        http://localhost:3000
        (Changes in source code auto-reload)
```

### Production Mode
```
┌─────────────────────────────────────────────┐
│ Dockerfile (Production)                      │
│ Stage 1: Install dependencies                │
│ Stage 2: Build app → .next/standalone/       │
│ Stage 3: Runtime with server.js             │
│ CMD: node server.js                          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ docker-compose.prod.yml                      │
│ - NO source code mounting                    │
│ - Uses built standalone server               │
│ - Optimized for production                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
        http://localhost:3000
        (Optimized production build)
```

---

## Files Explained

### Dockerfiles

#### `Dockerfile` (Production)
- **Purpose**: Create optimized production image
- **Build Type**: Multi-stage (deps → builder → runner)
- **Output**: Standalone Next.js server
- **Size**: Minimized (~200MB)
- **Command**: `node server.js`
- **Use Case**: Production deployment, testing production build

#### `Dockerfile.dev` (Development)
- **Purpose**: Development environment with hot reload
- **Build Type**: Single-stage
- **Output**: Full dev environment
- **Size**: Larger (~600MB)
- **Command**: `npm run dev`
- **Use Case**: Local development

### Docker Compose Files

#### `docker-compose.yml` (Default - Development)
- **Symlink to**: `docker-compose.dev.yml`
- **Purpose**: Default for development
- **Command**: `docker-compose up`

#### `docker-compose.dev.yml` (Development)
- **Services**: app (dev), postgres, redis
- **Volumes**: Source code mounted
- **Hot Reload**: Enabled
- **Build**: Uses `Dockerfile.dev`

#### `docker-compose.prod.yml` (Production)
- **Services**: app (prod), postgres, redis
- **Volumes**: None for app (uses built image)
- **Hot Reload**: Disabled
- **Build**: Uses `Dockerfile`

---

## Usage

### Development Mode (Recommended)

**Start:**
```powershell
.\docker-dev.ps1
```

Or manually:
```powershell
docker-compose -f docker-compose.dev.yml up -d
```

**Features:**
- ✅ Hot reload enabled
- ✅ Source code changes reflected immediately
- ✅ Development dependencies available
- ✅ Fast startup (no build optimization)
- ✅ Good for debugging

**View Logs:**
```powershell
docker-compose -f docker-compose.dev.yml logs -f app
```

**Stop:**
```powershell
docker-compose -f docker-compose.dev.yml down
```

### Production Mode (Testing)

**Start:**
```powershell
.\docker-prod.ps1
```

Or manually:
```powershell
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

**Features:**
- ✅ Optimized production build
- ✅ Smaller image size
- ✅ No development dependencies
- ✅ Tests production behavior
- ✅ Standalone server

**View Logs:**
```powershell
docker-compose -f docker-compose.prod.yml logs -f app
```

**Stop:**
```powershell
docker-compose -f docker-compose.prod.yml down
```

---

## Comparison

| Feature | Development Mode | Production Mode |
|---------|-----------------|-----------------|
| **Dockerfile** | `Dockerfile.dev` | `Dockerfile` |
| **Compose File** | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| **Source Mounted** | ✅ Yes | ❌ No |
| **Hot Reload** | ✅ Yes | ❌ No |
| **Build Time** | Fast | Slow (multi-stage) |
| **Image Size** | ~600MB | ~200MB |
| **Command** | `npm run dev` | `node server.js` |
| **Use Case** | Daily development | Testing production |

---

## Environment Variables

Both modes require `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The scripts (`docker-dev.ps1`, `docker-prod.ps1`) will create this from `.env.example` if it doesn't exist.

---

## Services

Both modes start 3 containers:

### App Container
- **Dev**: `donor-crm-dev-app` on port 3000
- **Prod**: `donor-crm-prod-app` on port 3000

### PostgreSQL
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Database**: `donor_crm`
- **Credentials**: postgres/postgres
- **Migrations**: Auto-run from `supabase/migrations/`

### Redis
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Persistence**: AOF enabled

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```powershell
docker-compose -f docker-compose.dev.yml logs app
```

**Common issues:**
1. Missing `.env.local` - Create from `.env.example`
2. Port 3000 already in use - Stop other services
3. Docker Desktop not running - Start Docker Desktop

### Hot Reload Not Working

**In dev mode, ensure:**
1. Using `docker-compose.dev.yml`
2. Source code is mounted: `. → /app`
3. Turbopack is enabled in `package.json`: `"dev": "next dev --turbopack"`

### Build Errors

**Clear cache and rebuild:**
```powershell
docker-compose -f docker-compose.dev.yml down
docker builder prune -f
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### ESLint/TypeScript Errors Blocking Build

**Already handled** in `next.config.ts`:
```typescript
eslint: {
  ignoreDuringBuilds: true,
},
typescript: {
  ignoreBuildErrors: true,
}
```

---

## Best Practices

### For Daily Development
1. Use **development mode** (`docker-dev.ps1`)
2. Keep containers running while you work
3. Source code changes auto-reload
4. Stop containers when done: `docker-compose down`

### Before Deploying
1. Test with **production mode** (`docker-prod.ps1`)
2. Verify the production build works
3. Check for build warnings/errors
4. Test all features in production mode

### Data Persistence
- Development and production use **separate volumes**
- Dev: `postgres-dev-data`, `redis-dev-data`
- Prod: `postgres-prod-data`, `redis-prod-data`
- Data persists across container restarts

---

## Architecture Decision

**Why Two Separate Modes?**

You **cannot** mix development and production approaches:
- Production builds create a standalone server
- Development needs source code for hot reload
- Mounting source over production build breaks the image
- Separate configs ensure each mode works correctly

**Default Choice:**
- `docker-compose.yml` → Development mode (for convenience)
- Most developers will run `docker-compose up` for dev work
- Explicitly use `docker-compose.prod.yml` for production testing
