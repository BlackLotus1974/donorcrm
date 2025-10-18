# 🚀 Remote Supabase Migration Plan

**Complete guide to migrate from Local Supabase to Cloud Supabase**

This plan eliminates all local networking issues, port conflicts, and Docker complexity by using Supabase's cloud infrastructure.

---

## 📋 Table of Contents

1. [Why Migrate to Remote Supabase?](#why-migrate-to-remote-supabase)
2. [Prerequisites](#prerequisites)
3. [Migration Overview](#migration-overview)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Deployment Modes After Migration](#deployment-modes-after-migration)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Plan](#rollback-plan)

---

## Why Migrate to Remote Supabase?

### Current Issues with Local Supabase
- ❌ Port conflicts on Windows (58321 blocked, had to change to 54321)
- ❌ Docker networking complexity (`host.docker.internal` issues)
- ❌ Container can't reliably reach host machine's Supabase
- ❌ Must keep `npx supabase start` running at all times
- ❌ Local Supabase consumes significant system resources

### Benefits of Remote Supabase
- ✅ **No local infrastructure** - Runs on Supabase cloud
- ✅ **No networking issues** - Direct HTTPS connection
- ✅ **No port conflicts** - Uses standard ports (443 for HTTPS)
- ✅ **Works perfectly with Docker** - Container connects to cloud
- ✅ **Better performance** - Professional-grade infrastructure
- ✅ **Automatic backups** - Built into Supabase cloud
- ✅ **Accessible anywhere** - Not limited to localhost
- ✅ **Free tier available** - 500MB database, 2GB file storage, 50,000 monthly active users

---

## Prerequisites

### 1. Supabase Cloud Account
- **Sign up**: https://supabase.com/dashboard/sign-up
- **Free tier**: Includes database, auth, storage, realtime
- **No credit card required** for free tier

### 2. Existing Project (You Already Have This!)
Your Supabase project credentials:
```
Project URL: https://flqgkpytrqpkqmedmtuf.supabase.co
Project Ref: flqgkpytrqpkqmedmtuf
Database Password: mrzt65GbiFbVS5Et
```

**Verification**: Can you access https://supabase.com/dashboard/project/flqgkpytrqpkqmedmtuf ?

### 3. Supabase CLI (Already Installed)
```powershell
npx supabase --version
```

---

## Migration Overview

### What We'll Do

```
┌─────────────────────────────┐
│   CURRENT STATE             │
│   Local Development         │
│                             │
│   App (localhost:3000)      │
│         ↓                   │
│   Supabase (127.0.0.1:54321)│
│   - PostgreSQL (local)      │
│   - Auth (local)            │
│   - Storage (local)         │
└─────────────────────────────┘

              ⬇️  MIGRATION  ⬇️

┌─────────────────────────────┐
│   NEW STATE                 │
│   Cloud Development         │
│                             │
│   App (localhost:3000)      │
│         ↓ HTTPS             │
│   Supabase Cloud            │
│   (*.supabase.co)           │
│   - PostgreSQL (cloud)      │
│   - Auth (cloud)            │
│   - Storage (cloud)         │
└─────────────────────────────┘
```

### Migration Steps Summary

1. **Link** local project to remote Supabase
2. **Push** database migrations to cloud
3. **Update** environment variables
4. **Test** connection and authentication
5. **Deploy** application

**Time Required**: 15-30 minutes

---

## Step-by-Step Migration

### Phase 1: Prepare Remote Supabase Project

#### Step 1.1: Access Your Supabase Dashboard

```powershell
# Open your project dashboard
start https://supabase.com/dashboard/project/flqgkpytrqpkqmedmtuf
```

**What to verify**:
- ✅ Project exists and is accessible
- ✅ Project is on free tier (or paid if you upgraded)
- ✅ No existing tables (we'll create them from migrations)

#### Step 1.2: Get Your Project Credentials

In the Supabase dashboard:

1. Go to **Settings** → **API**
2. Copy these values (already provided):

```
Project URL: https://flqgkpytrqpkqmedmtuf.supabase.co
Anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg
Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NTQ0OCwiZXhwIjoyMDc2MjcxNDQ4fQ.jatPHfLaKxVvZnnNI5QycHnCx0gX6gFIdiBVybgPbFU
```

#### Step 1.3: Get Your Database Connection String

In the Supabase dashboard:

1. Go to **Settings** → **Database**
2. Under **Connection string**, select **Connection pooling** (recommended)
3. Copy the URI:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Database Password**: `mrzt65GbiFbVS5Et` (already set)

---

### Phase 2: Link Local Project to Remote

#### Step 2.1: Stop Local Supabase

```powershell
# Stop local Supabase instance
npx supabase stop
```

**Why?** We're switching to remote, so local Supabase is no longer needed.

#### Step 2.2: Link to Remote Project

```powershell
# Link your local project to the remote Supabase project
npx supabase link --project-ref flqgkpytrqpkqmedmtuf
```

**What this does**:
- Connects your local Supabase CLI to your cloud project
- Allows you to push migrations, manage database, etc.
- Creates `.supabase/` directory with link config

**You'll be prompted for**:
- Database password: `mrzt65GbiFbVS5Et`
- Confirmation to proceed

**Expected output**:
```
Finished supabase link.
```

#### Step 2.3: Verify Link Status

```powershell
npx supabase status
```

**Expected output**:
```
Linked to remote project: flqgkpytrqpkqmedmtuf
```

---

### Phase 3: Push Database Schema to Remote

#### Step 3.1: Review Migrations to Push

Your project has 6 migrations:
1. `20240101000001_initial_schema.sql` - Core tables (organizations, users, donors)
2. `20240101000002_rls_policies.sql` - Row Level Security policies
3. `20240101000003_fix_user_profile_trigger.sql` - User profile automation
4. `20240101000004_fix_rls_recursion.sql` - RLS optimization
5. `20240101000005_bypass_rls_for_onboarding.sql` - Onboarding flow
6. `20240101000006_create_org_function.sql` - Organization creation

```powershell
# Check which migrations will be applied
npx supabase db diff --linked
```

#### Step 3.2: Push Migrations to Remote Database

```powershell
# Push all local migrations to remote Supabase
npx supabase db push
```

**What this does**:
- Applies all migration files in order
- Creates tables: `organizations`, `user_profiles`, `donors`, etc.
- Sets up Row Level Security policies
- Creates database functions and triggers

**Expected output**:
```
Applying migration 20240101000001_initial_schema.sql...
Applying migration 20240101000002_rls_policies.sql...
...
Finished supabase db push.
```

**⚠️ Important**: If you get errors:
- Check that database password is correct
- Verify network connection
- See [Troubleshooting](#troubleshooting) section

#### Step 3.3: Verify Schema in Dashboard

```powershell
# Open remote database in browser
start https://supabase.com/dashboard/project/flqgkpytrqpkqmedmtuf/editor
```

**Verify**:
- ✅ `organizations` table exists with columns: id, name, slug, etc.
- ✅ `user_profiles` table exists with columns: id, email, role, organization_id
- ✅ `donors` table exists with 30+ columns
- ✅ RLS policies are enabled (shield icon next to tables)

---

### Phase 4: Update Environment Configuration

#### Step 4.1: Update `.env.local` for Development

```powershell
# Backup current .env.local (optional)
Copy-Item .env.local .env.local.backup
```

Edit `.env.local`:

```env
# Remote Supabase Configuration (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://flqgkpytrqpkqmedmtuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NTQ0OCwiZXhwIjoyMDc2MjcxNDQ4fQ.jatPHfLaKxVvZnnNI5QycHnCx0gX6gFIdiBVybgPbFU

# Development Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

#### Step 4.2: Update `.env.docker` for Docker Production

Edit `.env.docker` (or create it):

```env
# Remote Supabase Configuration (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://flqgkpytrqpkqmedmtuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NTQ0OCwiZXhwIjoyMDc2MjcxNDQ4fQ.jatPHfLaKxVvZnnNI5QycHnCx0gX6gFIdiBVybgPbFU

# Production Settings
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

#### Step 4.3: Update `docker-compose.local-prod.yml`

Edit the build args and environment section:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_SUPABASE_URL=https://flqgkpytrqpkqmedmtuf.supabase.co
        - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=https://flqgkpytrqpkqmedmtuf.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg
      - SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NTQ0OCwiZXhwIjoyMDc2MjcxNDQ4fQ.jatPHfLaKxVvZnnNI5QycHnCx0gX6gFIdiBVybgPbFU
      - NODE_ENV=production
```

---

### Phase 5: Test the Migration

#### Step 5.1: Test Development Mode

```powershell
# Start development server
npm run dev
```

**Open**: http://localhost:3004

**Test checklist**:
- ✅ App loads without errors
- ✅ Can access sign-up page
- ✅ Can create a new account
- ✅ Receives confirmation email (check Supabase Auth logs)
- ✅ Can log in
- ✅ Redirected to onboarding
- ✅ Can create organization
- ✅ Redirected to dashboard

**Check browser console**:
- Should see no CORS errors
- Should see no connection refused errors
- Should see successful API calls to `*.supabase.co`

**Check Supabase Dashboard**:
- Dashboard → Authentication → Users
- Should see your new user account
- Dashboard → Table Editor → user_profiles
- Should see your profile record
- Dashboard → Table Editor → organizations
- Should see your organization record

#### Step 5.2: Test Production Mode (Native)

```powershell
# Build and start production server
npm run build
npm start
```

**Open**: http://localhost:3000

**Test the same checklist as development mode.**

#### Step 5.3: Test Docker Production Mode

```powershell
# Stop any running containers
docker-compose -f docker-compose.local-prod.yml down

# Rebuild with new environment
docker-compose -f docker-compose.local-prod.yml up --build
```

**Open**: http://localhost:3000

**Test the same checklist again.**

**Success indicators**:
- ✅ Container starts without connection errors
- ✅ No "ECONNREFUSED" errors in Docker logs
- ✅ Authentication works
- ✅ Can create and view donors

---

### Phase 6: Update Deployment Scripts

#### Step 6.1: Create Remote Production Startup Script

Create `start-remote-prod.ps1`:

```powershell
# Remote Production Mode Startup Script
# Connects to Supabase Cloud (no local Supabase needed)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " REMOTE PRODUCTION MODE STARTUP" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check internet connection
Write-Host "[1/3] Checking internet connection..." -ForegroundColor Yellow
try {
    $connection = Test-Connection -ComputerName "supabase.co" -Count 1 -Quiet
    if ($connection) {
        Write-Host " Internet connection: OK" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Cannot reach supabase.co" -ForegroundColor Red
        Write-Host "Please check your internet connection" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Warning: Could not verify connection" -ForegroundColor Yellow
}

# Build the application
Write-Host ""
Write-Host "[2/3] Building production bundle..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

# Start the production server
Write-Host ""
Write-Host "[3/3] Starting production server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host " APPLICATION READY" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host " App URL:              http://localhost:3000" -ForegroundColor Cyan
Write-Host " Supabase Dashboard:   https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm start
```

#### Step 6.2: Update Docker Scripts

Update `docker-local-prod.ps1` to remove Supabase checks:

```powershell
# Docker Production Mode with Remote Supabase

Write-Host "Starting Docker production build..." -ForegroundColor Cyan
Write-Host "Connecting to remote Supabase cloud" -ForegroundColor Yellow
Write-Host ""

# Start Docker container
docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build
```

---

## Deployment Modes After Migration

After migrating to remote Supabase, all three deployment modes become simpler:

### Mode 1: Development (Port 3004)

```powershell
npm run dev
```

**Benefits**:
- ✅ Hot reload for rapid development
- ✅ No local Supabase needed
- ✅ Direct connection to cloud

**Use for**: Daily development work

---

### Mode 2: Native Production (Port 3000)

```powershell
.\start-remote-prod.ps1
```

**Benefits**:
- ✅ Production build testing
- ✅ No Docker complexity
- ✅ Fast startup

**Use for**: Testing production builds locally

---

### Mode 3: Docker Production (Port 3000)

```powershell
.\docker-local-prod.ps1
```

**Benefits**:
- ✅ Exact production environment
- ✅ No networking issues (connects to cloud)
- ✅ Isolated container

**Use for**: Final testing before cloud deployment

---

## Troubleshooting

### Issue 1: "Database password is incorrect"

**Solution**:
```powershell
# Reset database password in Supabase dashboard
# Settings → Database → Reset database password
```

Then re-run `npx supabase link`.

---

### Issue 2: "Connection timeout" during migration push

**Possible causes**:
- Firewall blocking HTTPS connections
- VPN interfering with connection
- Corporate network restrictions

**Solutions**:
```powershell
# Try with direct internet connection (disable VPN)
npx supabase db push

# Check firewall settings
# Allow outbound HTTPS to *.supabase.co
```

---

### Issue 3: "Migration already applied" error

**Cause**: Migration was partially applied

**Solution**:
```powershell
# Check migration status
npx supabase migration list --linked

# If needed, reset and re-apply
npx supabase db reset --linked
npx supabase db push
```

**⚠️ Warning**: `db reset` will delete all data! Only use for fresh setup.

---

### Issue 4: CORS errors in browser

**Symptom**:
```
Access to fetch at 'https://asclamyhgsbgixleplte.supabase.co' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**:
This shouldn't happen with Supabase, but if it does:
1. Check that you're using correct anon key
2. Verify allowed origins in Supabase Dashboard → Authentication → URL Configuration
3. Add `http://localhost:3000` and `http://localhost:3004` to allowed origins

---

### Issue 5: Authentication redirects not working

**Symptom**: After login, stuck on auth page or redirect fails

**Solution**:
1. Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/**`
   - `http://localhost:3004/**`

---

## Rollback Plan

If migration fails and you need to go back to local Supabase:

### Step 1: Unlink from Remote

```powershell
npx supabase unlink
```

### Step 2: Restore Local Configuration

```powershell
# Restore backup if you made one
Copy-Item .env.local.backup .env.local

# Or manually edit .env.local
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### Step 3: Restart Local Supabase

```powershell
npx supabase start
```

### Step 4: Reset Local Database (if needed)

```powershell
npx supabase db reset
```

This will re-apply all migrations to your local database.

---

## Success Checklist

After completing migration, verify:

- ✅ No local Supabase running (`npx supabase stop` was executed)
- ✅ `.env.local` points to `https://asclamyhgsbgixleplte.supabase.co`
- ✅ Development mode works (port 3004)
- ✅ Production mode works (port 3000)
- ✅ Docker mode works (port 3000)
- ✅ Can create account and log in
- ✅ Can create organization
- ✅ Can create and view donors
- ✅ All tests pass (`npm run test`)
- ✅ No console errors related to Supabase connection

---

## Next Steps

After successful migration:

1. **Update Documentation**:
   - Update `CLAUDE.md` to remove local Supabase instructions
   - Update `README.md` with simplified setup
   - Archive `LOCAL_DEPLOYMENT_GUIDE.md` (or update it)

2. **Clean Up**:
   ```powershell
   # Remove local Supabase volumes (optional, frees up disk space)
   npx supabase stop
   docker volume prune
   ```

3. **Team Onboarding**:
   - Share Supabase project credentials with team (use password manager!)
   - Document how to access Supabase dashboard
   - Set up team roles in Supabase

4. **Production Deployment** (future):
   - Same `.env` configuration works everywhere
   - Deploy to Vercel/Netlify/AWS with remote Supabase
   - No changes needed - just set environment variables

---

## Cost Considerations

### Supabase Free Tier Limits

- ✅ **Database**: 500 MB (plenty for development and small production)
- ✅ **File Storage**: 1 GB
- ✅ **Bandwidth**: 5 GB/month
- ✅ **Monthly Active Users**: 50,000
- ✅ **API Requests**: Unlimited

**When to upgrade**:
- Database > 500 MB
- Need > 5 GB bandwidth/month
- Need custom domain for Auth
- Need automatic backups (paid feature)

**Pro Plan**: $25/month includes:
- 8 GB database
- 100 GB file storage
- 250 GB bandwidth
- Daily backups
- Custom domains

---

## Summary

**Total Time**: 15-30 minutes
**Difficulty**: Easy
**Risk**: Low (can rollback easily)

**Key Advantages**:
- ✅ Eliminates ALL local networking issues
- ✅ Works perfectly with Docker on Windows
- ✅ No port conflicts or firewall issues
- ✅ Professional-grade infrastructure
- ✅ Accessible from anywhere
- ✅ Same setup for dev and production

**What You're Giving Up**:
- Offline development (need internet for database)
- Complete data isolation (data is on Supabase cloud)

**Recommendation**: **Strongly recommended** for your use case, especially on Windows with Docker.

---

**Questions?** Check the [Troubleshooting](#troubleshooting) section or consult Supabase documentation: https://supabase.com/docs
