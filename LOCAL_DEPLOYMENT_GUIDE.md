# 🚀 Local Deployment Guide - Donor CRM System

**Complete Guide for Windows Development**

This guide covers **three ways** to run the Donor CRM system locally on your Windows machine.

---

## 📋 Table of Contents

1. [Deployment Modes Overview](#deployment-modes-overview)
2. [Prerequisites](#prerequisites)
3. [Native Production Mode (Port 3000)](#native-production-mode-port-3000) ⭐ **Recommended for Windows**
4. [Development Mode (Port 3004)](#development-mode-port-3004)
5. [Docker Local Production Mode (Port 3000)](#docker-local-production-mode-port-3000)
6. [Troubleshooting](#troubleshooting)
7. [Daily Workflow](#daily-workflow)

---

## Deployment Modes Overview

| Mode | Command | Port | Hot Reload | Use Case |
|------|---------|------|------------|----------|
| **Native Production** | `.\start-native-prod.ps1` | 3000 | ❌ No | Recommended for Windows - production build without Docker complexity |
| **Development** | `npm run dev` | 3004 | ✅ Yes | Active development with live reload |
| **Docker Local Production** | `.\docker-local-prod.ps1` | 3000 | ❌ No | Testing production build in container (Linux/Mac) |

**All modes require Supabase running on port 54321**

⭐ **Windows Users**: We recommend **Native Production Mode** due to Docker networking limitations on Windows.

---

## Prerequisites

### Required Software

#### 1. **Docker Desktop** (for Docker mode)
- Check if installed:
  ```powershell
  docker --version
  ```
- Should show: `Docker version 20.x.x` or higher
- Download from: https://www.docker.com/products/docker-desktop/

#### 2. **Node.js 18+** (for all modes)
- Check if installed:
  ```powershell
  node --version
  ```
- Should show: `v18.x.x` or higher
- Download from: https://nodejs.org/

#### 3. **Git** (optional)
- Check if installed:
  ```powershell
  git --version
  ```
- Download from: https://git-scm.com/

---

## Docker Local Production Mode (Port 3000)

⭐ **This is the recommended mode for local production testing**

### Why Use This Mode?
- ✅ Production-optimized build (faster, smaller)
- ✅ Runs in isolated Docker container
- ✅ Tests production configuration locally
- ✅ No development overhead
- ❌ No hot-reload (must rebuild for changes)

### Architecture

```
┌─────────────────────────────┐
│  Docker Container           │
│  ┌───────────────────────┐ │
│  │  Next.js App          │ │
│  │  (Production Build)   │ │
│  │  Port: 3000           │ │
│  └──────────┬────────────┘ │
│             │               │
└─────────────┼───────────────┘
              │
              │ host.docker.internal:54321
              │
┌─────────────▼───────────────┐
│  Host Machine (Windows)     │
│  ┌───────────────────────┐ │
│  │  Local Supabase       │ │
│  │  Port: 54321          │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

---

### Initial Setup (First Time Only)

#### Step 1: Start Docker Desktop

1. **Open Docker Desktop** from Start Menu
2. **Wait** until "Docker Desktop is running" appears in system tray
3. **Verify**:
   ```powershell
   docker ps
   ```
   Should show empty table (not an error)

#### Step 2: Navigate to Project

```powershell
cd C:\Users\eshay\CRM\crm
```

#### Step 3: Install Dependencies

```powershell
npm install
```

#### Step 4: Configure Environment

The Docker setup uses `.env.docker` (NOT `.env.local`):

```powershell
# Copy example file
Copy-Item .env.docker.example .env.docker
```

**Edit `.env.docker`** if you want to use cloud Supabase, or leave it as-is for local Supabase.

For **local Supabase**, the Docker container automatically connects to:
- URL: `http://host.docker.internal:54321`
- Key: Actual local Supabase publishable key (already configured)

---

### Daily Operations: Starting the App

#### Step 1: Start Supabase (Required!)

```powershell
npx supabase start
```

**What this does**:
- ✅ Starts PostgreSQL database on port 55555
- ✅ Starts Auth service
- ✅ Starts API on port **54321**
- ✅ Starts Supabase Studio on port 60323
- ✅ Starts Mailpit (email testing) on port 60324

**Expected output**:
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
      Studio URL: http://127.0.0.1:60323
     Mailpit URL: http://127.0.0.1:60324
```

**Time**: 5-10 seconds (after first run)

**Important**: Your Docker container connects to this Supabase instance!

#### Step 2: Start Docker Container

**Option A: Using PowerShell Script (Easiest)**
```powershell
.\docker-local-prod.ps1
```

**Option B: Using Batch Script**
```cmd
docker-local-prod.bat
```

**Option C: Direct Docker Compose**
```powershell
docker-compose -f docker-compose.local-prod.yml up --build
```

**Option D: Background Mode (Detached)**
```powershell
docker-compose -f docker-compose.local-prod.yml up --build -d
```

**What this does**:
- Builds production Docker image (first time: 5-10 minutes)
- Starts container on port 3000
- Connects to Supabase on host machine

**Expected output**:
```
[+] Building 45.2s (18/18) FINISHED
[+] Running 1/1
 ✔ Container donor-crm-local-prod  Started
```

#### Step 3: Access the Application

**Open browser**: http://localhost:3000

You should see the CRM landing page!

---

### Daily Operations: Stopping the App

#### Stop Docker Container

**If running in foreground** (not detached):
- Press `Ctrl + C` in the PowerShell window

**If running in background** (detached):
```powershell
docker-compose -f docker-compose.local-prod.yml down
```

#### Stop Supabase (Optional)

```powershell
npx supabase stop
```

**Note**: Supabase data persists. You can safely stop and restart without losing data.

---

### Viewing Logs

**Docker container logs**:
```powershell
docker logs -f donor-crm-local-prod
```

**Supabase logs**:
```powershell
npx supabase logs
```

---

### Rebuilding After Code Changes

When you make code changes, you need to rebuild the Docker image:

```powershell
# Stop container
docker-compose -f docker-compose.local-prod.yml down

# Rebuild and start
docker-compose -f docker-compose.local-prod.yml up --build
```

**Or use the script**:
```powershell
.\docker-local-prod.ps1
```
(It automatically rebuilds)

---

### Quick Reference: Docker Local Production

```powershell
# ✅ START
npx supabase start                                           # 1. Start Supabase
.\docker-local-prod.ps1                                      # 2. Start Docker app

# 🔍 CHECK STATUS
npx supabase status                                          # Supabase status
docker ps                                                    # Docker containers
docker logs -f donor-crm-local-prod                         # App logs

# 🛑 STOP
docker-compose -f docker-compose.local-prod.yml down        # Stop Docker
npx supabase stop                                           # Stop Supabase (optional)

# 🔧 REBUILD
docker-compose -f docker-compose.local-prod.yml up --build  # Rebuild after changes

# 🧹 CLEAN REBUILD (removes old image)
docker-compose -f docker-compose.local-prod.yml down
docker rmi donor-crm-local-prod
.\docker-local-prod.ps1
```

---

## Development Mode (Port 3004)

### Why Use This Mode?
- ✅ Hot-reload (instant updates on code changes)
- ✅ Fast refresh with Turbopack
- ✅ Better error messages and debugging
- ✅ No Docker required
- ❌ Slower runtime performance
- ❌ Dev-only features enabled

### Daily Operations

#### Step 1: Start Supabase

```powershell
npx supabase start
```

#### Step 2: Configure Environment

Create `.env.local` (NOT `.env.docker`):

```powershell
Copy-Item .env.example .env.local
```

**Edit `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (from npx supabase status)
```

Get the correct values:
```powershell
npx supabase status
```

#### Step 3: Start Development Server

```powershell
npm run dev
```

**Expected output**:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3004
✓ Ready in 2.5s
```

#### Step 4: Access the App

**Open browser**: http://localhost:3004

### Stopping Development Mode

Press `Ctrl + C` in the terminal running `npm run dev`

---

## Native Production Mode (Port 3000)

### Why Use This Mode?
- ✅ Production build without Docker
- ✅ Faster startup than Docker
- ✅ Good for testing builds locally
- ❌ Requires manual rebuild after changes
- ❌ Less isolated than Docker

### Daily Operations

#### Step 1: Start Supabase

```powershell
npx supabase start
```

#### Step 2: Configure Environment

Use `.env.local` (same as development mode):

```powershell
Copy-Item .env.example .env.local
```

Configure with local Supabase URL and key.

#### Step 3: Build the Application

```powershell
npm run build
```

**Time**: 1-3 minutes
**Only needed once or after code changes**

#### Step 4: Start Production Server

```powershell
npm start
```

**Expected output**:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
✓ Ready in 1.2s
```

#### Step 5: Access the App

**Open browser**: http://localhost:3000

### Stopping Native Production Mode

Press `Ctrl + C` in the terminal running `npm start`

---

## Troubleshooting

### Problem 1: Docker Desktop Not Running

**Symptoms**:
- `docker ps` shows "Cannot connect to Docker daemon"
- Docker commands fail

**Solution**:
1. Open Docker Desktop from Start Menu
2. Wait for "Docker Desktop is running" in system tray (whale icon)
3. Verify: `docker ps` should work

---

### Problem 2: Supabase Not Running

**Symptoms**:
- App shows "Failed to fetch" errors
- Can't login or sign up
- Connection refused errors

**Solution**:
```powershell
# Check if Supabase is running
npx supabase status

# If not running, start it
npx supabase start

# Restart your app after Supabase is running
```

---

### Problem 3: Port 3000 Already in Use

**Symptoms**:
- Docker fails to start: "Port 3000 is already allocated"
- Native production mode: "Port 3000 already in use"

**Solution A: Find what's using port 3000**
```powershell
netstat -ano | findstr :3000
```

**Solution B: Stop the conflicting process**
```powershell
# Replace 12345 with actual PID from above
taskkill /PID 12345 /F
```

**Solution C: Stop Docker container**
```powershell
docker-compose -f docker-compose.local-prod.yml down
```

---

### Problem 4: Docker Build Fails

**Symptoms**:
- Build errors during `docker-compose up --build`
- "npm install failed" or similar

**Solution 1: Clear Docker cache**
```powershell
docker builder prune -a
```

**Solution 2: Clean rebuild**
```powershell
docker-compose -f docker-compose.local-prod.yml down
docker rmi donor-crm-local-prod
docker system prune -f
.\docker-local-prod.ps1
```

**Solution 3: Check Dockerfile**
Ensure `next.config.ts` has:
```typescript
output: 'standalone'
```

---

### Problem 5: Can't Connect to Supabase from Docker

**Symptoms**:
- Docker container runs but shows database errors
- "Could not connect to Supabase"

**Solution 1: Verify Supabase is running**
```powershell
npx supabase status
```
Should show API on port 54321

**Solution 2: Check Docker network**
```powershell
# Test connectivity from Docker
docker exec donor-crm-local-prod ping host.docker.internal
```

**Solution 3: Check environment variables**
```powershell
# View container environment
docker inspect donor-crm-local-prod | findstr SUPABASE
```

Should show: `http://host.docker.internal:54321`

---

### Problem 6: Multiple Dev Servers Running

**Symptoms**:
- Port 3004 in use
- Can't start dev server

**Solution**:
```powershell
.\scripts\kill-dev-servers.ps1
```

**Or manually**:
```powershell
netstat -ano | findstr :3004
taskkill /PID [process_id] /F
```

---

### Problem 7: Database Schema Issues

**Symptoms**:
- "Table does not exist" errors
- Missing columns errors

**Solution: Reset database**
```powershell
npx supabase db reset
```

⚠️ **Warning**: This deletes all data! Use only in development.

---

### Problem 8: Docker Container Won't Stop

**Symptoms**:
- Container keeps restarting
- Can't remove container

**Solution**:
```powershell
# Force stop all containers
docker ps -a | findstr donor-crm
docker rm -f donor-crm-local-prod

# Or stop via compose
docker-compose -f docker-compose.local-prod.yml down -v
```

---

## Daily Workflow

### Option 1: Docker Local Production (Recommended)

#### Morning Startup
```powershell
# 1. Start Docker Desktop (if not running)

# 2. Navigate to project
cd C:\Users\eshay\CRM\crm

# 3. Start Supabase
npx supabase start

# 4. Start Docker container
.\docker-local-prod.ps1

# 5. Open browser
# http://localhost:3000
```

**Time**: ~1-2 minutes (after initial setup)

#### Evening Shutdown
```powershell
# 1. Stop Docker (Ctrl+C if foreground, or:)
docker-compose -f docker-compose.local-prod.yml down

# 2. Optional: Stop Supabase
npx supabase stop

# 3. Optional: Quit Docker Desktop
# Right-click whale icon → Quit
```

---

### Option 2: Development Mode

#### Morning Startup
```powershell
# 1. Navigate to project
cd C:\Users\eshay\CRM\crm

# 2. Start Supabase
npx supabase start

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:3004
```

**Time**: ~30 seconds

#### Evening Shutdown
```powershell
# 1. Stop dev server (Ctrl+C)

# 2. Optional: Stop Supabase
npx supabase stop
```

---

### Option 3: Native Production

#### Morning Startup
```powershell
# 1. Navigate to project
cd C:\Users\eshay\CRM\crm

# 2. Start Supabase
npx supabase start

# 3. Build (only if code changed)
npm run build

# 4. Start production server
npm start

# 5. Open browser
# http://localhost:3000
```

**Time**: ~1-3 minutes (if rebuilding)

---

## Comparison Table

| Feature | Docker Prod | Development | Native Prod |
|---------|-------------|-------------|-------------|
| **Port** | 3000 | 3004 | 3000 |
| **Hot Reload** | ❌ No | ✅ Yes | ❌ No |
| **Speed** | Fast | Slower | Fast |
| **Build Time** | 5-10 min (first) | N/A | 1-3 min |
| **Startup Time** | 10-30 sec | 10-30 sec | 5-10 sec |
| **Memory** | ~300 MB | ~800 MB | ~400 MB |
| **Isolation** | ✅ Docker | ❌ None | ❌ None |
| **Debugging** | Harder | Easier | Medium |
| **Best For** | Testing prod | Active dev | Quick tests |

---

## Important URLs

Once services are running:

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **CRM App (Production)** | http://localhost:3000 | 3000 | Native/Docker production mode |
| **CRM App (Dev)** | http://localhost:3004 | 3004 | Development mode |
| **Supabase API** | http://127.0.0.1:54321 | 54321 | Backend API |
| **Supabase Studio** | http://127.0.0.1:60323 | 60323 | Database UI |
| **Mailpit** | http://127.0.0.1:60324 | 60324 | Email testing |

---

## First-Time User Setup

After starting the app (any mode), create your first account:

1. **Navigate to the app** (http://localhost:3000 or 3004)
2. **Click "Sign Up"**
3. **Fill in the form**:
   - Email: test@example.com
   - Password: password123 (or stronger)
   - First Name: Test
   - Last Name: User
4. **Complete onboarding**:
   - Choose "Create New Organization"
   - Organization Name: Test Org
   - Email: org@example.com
5. **You're in!** You'll see the dashboard

---

## Quick Command Reference

```powershell
# ========== DOCKER LOCAL PRODUCTION ==========
# Start
npx supabase start
.\docker-local-prod.ps1

# Stop
docker-compose -f docker-compose.local-prod.yml down
npx supabase stop

# Logs
docker logs -f donor-crm-local-prod
npx supabase logs

# Rebuild
docker-compose -f docker-compose.local-prod.yml up --build

# ========== DEVELOPMENT MODE ==========
# Start
npx supabase start
npm run dev

# Stop
Ctrl+C
npx supabase stop

# ========== NATIVE PRODUCTION ==========
# Start
npx supabase start
npm run build
npm start

# Stop
Ctrl+C
npx supabase stop

# ========== TROUBLESHOOTING ==========
# Check status
npx supabase status
docker ps
netstat -ano | findstr :3000

# Kill processes
.\scripts\kill-dev-servers.ps1
taskkill /F /PID [process_id]

# Reset database
npx supabase db reset
```

---

## Getting Help

### Documentation Files
- **This file**: Complete deployment guide
- **[QUICKSTART.md](QUICKSTART.md)**: 5-minute quick start
- **[DOCKER_LOCAL_PROD.md](DOCKER_LOCAL_PROD.md)**: Docker production details
- **[CLAUDE.md](CLAUDE.md)**: Architecture and development patterns
- **[TESTING.md](TESTING.md)**: Testing guide

### Common Issues
- **Docker problems**: Check Docker Desktop is running
- **Supabase problems**: Run `npx supabase status`
- **Port conflicts**: Use `netstat -ano | findstr :3000`
- **Build failures**: Try `docker builder prune -a`

---

## Summary

**For Windows users, we recommend**: **Native Production Mode**

**Why?**
- ✅ No Docker networking issues on Windows
- ✅ Faster startup and rebuild times
- ✅ Production-optimized build
- ✅ Simple, reliable connection to Supabase

**Quick Start**:
```powershell
npx supabase start
.\start-native-prod.ps1
# Open http://localhost:3000
```

**That's it!** You're running a production-ready CRM locally. 🎉

**Note for Linux/Mac users**: Docker Local Production Mode works better on Linux/Mac due to better container networking support.

---

**Questions?** Check the [Troubleshooting](#troubleshooting) section or review the documentation files listed above.
