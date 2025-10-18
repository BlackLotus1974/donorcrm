# 🚀 Quick Start Guide

Get your local Donor CRM MVP running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker Desktop running (for Supabase)
- Git installed

## Setup Steps

### 1. Start Local Supabase

```powershell
# Start all Supabase services (PostgreSQL, Auth, Storage, etc.)
npx supabase start
```

This will automatically apply all database migrations and start services on:
- **API**: http://127.0.0.1:58321
- **Studio** (Database UI): http://127.0.0.1:60323
- **Mailpit** (Email testing): http://127.0.0.1:60324

### 2. Install Dependencies

```powershell
npm install
```

### 3. Start the Application

```powershell
npm run dev
```

Access at: **http://localhost:3004**

### 4. Create Your Account

1. Navigate to http://localhost:3004
2. Click "Sign Up"
3. Create your account
4. Complete the onboarding wizard
5. Choose "Create Organization"
6. You're now an admin!

## What's Working

✅ **Local Supabase** - Fully self-hosted backend
✅ **Authentication** - Sign up, login, password reset
✅ **Onboarding** - Create/join organization
✅ **Donor Management** - Full CRUD operations
✅ **Dashboard** - Basic metrics and overview
✅ **Permissions** - Role-based access control (Admin, Manager, User, Viewer)

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **CRM App** | http://localhost:3004 | Your application |
| **Supabase Studio** | http://127.0.0.1:60323 | Database management |
| **Mailpit** | http://127.0.0.1:60324 | Test emails |

## Useful Commands

```powershell
# Check Supabase status
npx supabase status

# Stop Supabase
npx supabase stop

# Restart Supabase
npx supabase stop && npx supabase start

# Kill all dev servers (if multiple running)
.\scripts\kill-dev-servers.ps1

# View Supabase logs
npx supabase logs
```

## Troubleshooting

### Multiple dev servers running?
```powershell
.\scripts\kill-dev-servers.ps1
npm run dev
```

### Supabase not starting?
```powershell
# Make sure Docker Desktop is running
docker ps

# Restart Supabase
npx supabase stop
npx supabase start
```

### Can't access the app?
- Make sure you're using **http://localhost:3004** (not 3000)
- Clear browser cache/cookies for localhost
- Check dev server is running: look for "Ready in X.Xs" in terminal

### Database issues?
- Open Supabase Studio: http://127.0.0.1:60323
- Check tables: organizations, user_profiles, donors
- View auth users in Authentication section

## Next Steps

Once your setup is working:

1. **Test Core Features**
   - Create a test donor
   - Search and filter donors
   - Export to CSV

2. **Explore Supabase Studio**
   - View database tables
   - Check auth users
   - Monitor API requests

3. **Start Building Features**
   - See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for roadmap
   - Phase 2: UI Enhancements (data table, filters, bulk actions)
   - Phase 3: Excel Import feature

## Getting Help

- **Setup Issues**: See [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)
- **Docker Issues**: See [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- **Testing**: See [TESTING.md](TESTING.md)
- **Architecture**: See [CLAUDE.md](CLAUDE.md)

---

**You're all set!** 🎉 Your self-hosted Donor CRM is now running locally.
