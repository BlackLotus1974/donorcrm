# Local Production Deployment with Docker

This guide explains how to run your Donor CRM app in **production mode** using Docker Desktop, without development tools or hot-reload.

## Prerequisites

1. **Docker Desktop** installed and running
2. **Local Supabase** running on port 58321
   - Start with: `npx supabase start`
3. **Environment variables** configured in `.env.docker`

---

## Quick Start

### Option 1: PowerShell Script (Recommended)
```powershell
.\docker-local-prod.ps1
```

### Option 2: Batch Script
```cmd
docker-local-prod.bat
```

### Option 3: Manual Docker Compose
```bash
docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build
```

---

## What This Does

1. **Builds a production Docker image** using multi-stage Dockerfile
   - Stage 1: Installs dependencies
   - Stage 2: Builds the Next.js app with `npm run build`
   - Stage 3: Creates a minimal runtime image with only the standalone output

2. **Runs the production server**
   - No dev tools
   - No hot-reload
   - Optimized for performance
   - Uses the built-in Next.js standalone server

3. **Connects to local Supabase**
   - Uses `host.docker.internal` to access your host machine's Supabase
   - Port: 58321 (your current local Supabase)

---

## Architecture

```
┌─────────────────────────┐
│  Docker Container       │
│  ┌───────────────────┐ │
│  │  Next.js App      │ │
│  │  (Production)     │ │
│  │  Port: 3000       │ │
│  └────────┬──────────┘ │
│           │             │
└───────────┼─────────────┘
            │
            │ host.docker.internal
            │
┌───────────▼─────────────┐
│  Host Machine           │
│  ┌───────────────────┐ │
│  │  Local Supabase   │ │
│  │  Port: 58321      │ │
│  └───────────────────┘ │
└─────────────────────────┘
```

---

## Configuration Files

### `docker-compose.local-prod.yml`
Main Docker Compose configuration for local production deployment.

**Key features:**
- Builds from `Dockerfile` (production multi-stage build)
- Exposes port 3000
- Connects to host Supabase via `host.docker.internal`
- Uses environment variables from `.env.docker`

### `.env.docker`
Environment variables for Docker production mode.

**Contains:**
- `NEXT_PUBLIC_SUPABASE_URL` - Points to host Supabase (http://localhost:58321)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NODE_ENV=production` - Production mode

### `Dockerfile`
Multi-stage production Dockerfile.

**Stages:**
1. **deps** - Installs Node.js dependencies
2. **builder** - Builds the Next.js application
3. **runner** - Minimal runtime image with standalone server

---

## Commands

### Start in Production Mode
```bash
# Using PowerShell script
.\docker-local-prod.ps1

# Using Batch script
docker-local-prod.bat

# Using Docker Compose directly
docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build
```

### Start in Background (Detached)
```bash
docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build -d
```

### View Logs
```bash
docker logs -f donor-crm-local-prod
```

### Stop the Container
```bash
docker-compose -f docker-compose.local-prod.yml down
```

### Rebuild from Scratch
```bash
# Remove existing container and image
docker-compose -f docker-compose.local-prod.yml down
docker rmi donor-crm-local-prod

# Rebuild
docker-compose -f docker-compose.local-prod.yml --env-file .env.docker up --build
```

---

## Accessing the App

Once running, access the app at:
- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (if Supabase is running)

---

## Troubleshooting

### Issue: "Docker is not running"
**Solution**: Start Docker Desktop

### Issue: "Supabase not responding"
**Solution**: Start Supabase with `npx supabase start`

### Issue: "Port 3000 already in use"
**Solution**: Stop the dev server or change the port in docker-compose.local-prod.yml

### Issue: "Cannot connect to Supabase"
**Solution**:
1. Check Supabase is running: `npx supabase status`
2. Verify the port in `.env.docker` matches your Supabase port
3. Ensure `host.docker.internal` is accessible (it should work on Docker Desktop)

### Issue: "Build fails"
**Solutions**:
1. Clear Docker cache: `docker builder prune`
2. Ensure all dependencies are in `package.json`
3. Check `next.config.ts` has `output: 'standalone'`

### Issue: "Hot reload still active"
**This shouldn't happen** - production mode disables hot reload. If you see it:
1. Check `NODE_ENV=production` is set
2. Rebuild the image: `docker-compose -f docker-compose.local-prod.yml up --build --force-recreate`

---

## Performance Notes

### Build Time
- **First build**: 5-10 minutes (installs dependencies and builds)
- **Subsequent builds**: 2-5 minutes (uses Docker cache)

### Runtime Performance
- **Startup time**: ~2-3 seconds
- **Memory usage**: ~200-300 MB (vs ~500-800 MB in dev mode)
- **CPU usage**: Minimal (no file watching, no hot reload)

---

## Differences from Development Mode

| Feature | Development | Production |
|---------|-------------|------------|
| Hot Reload | ✅ Yes | ❌ No |
| File Watching | ✅ Yes | ❌ No |
| Source Maps | ✅ Full | ⚠️ Minimal |
| Optimization | ❌ None | ✅ Full |
| Build Time | Fast | Slower |
| Runtime Speed | Slower | Faster |
| Memory Usage | Higher | Lower |
| Turbopack | ✅ Yes | ❌ No |

---

## Next Steps

### For True Production Deployment

This local production mode is great for testing, but for actual production:

1. **Deploy to cloud hosting**:
   - Vercel (recommended for Next.js)
   - Railway
   - AWS ECS
   - Google Cloud Run

2. **Use production Supabase**:
   - Create a Supabase project at supabase.com
   - Update environment variables
   - Run migrations: `npx supabase db push`

3. **Add monitoring**:
   - Sentry for error tracking
   - Vercel Analytics
   - PostHog for product analytics

4. **Set up CI/CD**:
   - GitHub Actions
   - GitLab CI
   - CircleCI

---

## Environment Variables Reference

### Required for Production
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:58321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

### Optional
```env
# Analytics
POSTHOG_KEY=your-posthog-key

# Email (if using)
RESEND_API_KEY=your-resend-api-key

# AI Features (if using)
OPENAI_API_KEY=your-openai-api-key
```

---

## Security Notes

1. **Never commit** `.env.docker` to git (it's in `.gitignore`)
2. **Use different keys** for production vs. local
3. **Rotate keys** regularly in production
4. **Enable RLS** on all Supabase tables (already configured)
5. **Use HTTPS** in production (Supabase and app)

---

## Support

For issues or questions:
1. Check the logs: `docker logs -f donor-crm-local-prod`
2. Review this guide
3. Check Docker Desktop is running
4. Verify Supabase is accessible

---

## Quick Reference

```bash
# Start
.\docker-local-prod.ps1

# Stop
docker-compose -f docker-compose.local-prod.yml down

# Logs
docker logs -f donor-crm-local-prod

# Rebuild
docker-compose -f docker-compose.local-prod.yml up --build --force-recreate

# Clean start
docker-compose -f docker-compose.local-prod.yml down
docker rmi donor-crm-local-prod
.\docker-local-prod.ps1
```

---

**Happy deploying!** 🚀
