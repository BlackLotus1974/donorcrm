# Local Development Setup Guide

## Current Status

The Donor CRM project is now configured to use **Local Supabase** for full self-hosting! All services are running locally on your machine.

## ✅ Local Supabase Setup (Current Configuration)

### 1. Environment Configuration

The project is configured with **Local Supabase**:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:58321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local Supabase

```bash
# Start all Supabase services
npx supabase start
```

This will start:
- PostgreSQL database (port 55555)
- API server (port 58321)
- Supabase Studio (port 60323)
- Mailpit email testing (port 60324)
- Auth, Storage, Realtime services

**Migrations are automatically applied** from the `supabase/migrations/` folder when you start Supabase.

To check status:
```bash
npx supabase status
```

### 4. Start Development Server

```bash
npm run dev
```

Access the application at: **http://localhost:3004**

**Note:** The dev server is configured to use port 3004 to avoid conflicts.

### 5. Initial Setup

1. Navigate to `/auth/sign-up`
2. Create your account
3. Complete the onboarding wizard
4. Choose "Create Organization"
5. You're now an admin with full access!

---

## Local Supabase Setup (Advanced - Windows Troubleshooting)

### Known Issue: Windows Port Reservations

Windows reserves certain port ranges for system services, which can conflict with Supabase's default ports (54321-54329). This is a known issue on Windows 10/11.

### Solution Options

#### Option 1: Use Custom Port Range

Modify `supabase/config.toml` to use ports outside the reserved range (60000+):

```toml
[api]
port = 60321

[db]
port = 60432
shadow_port = 60320

[db.pooler]
port = 60329

[studio]
port = 60323
api_url = "http://127.0.0.1:60321"

[inbucket]
port = 60324

[analytics]
port = 60327
vector_port = 60328
```

Then update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:60321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<get from supabase start output>
```

Start Supabase:

```bash
npx supabase start
```

#### Option 2: Check Reserved Ports

Run as Administrator:

```powershell
# Check excluded port ranges
netsh interface ipv4 show excludedportrange protocol=tcp

# If 54xxx range is excluded, you'll need to free it or use Option 1
```

#### Option 3: Use WSL2 (Linux Subsystem)

Install WSL2 and run Supabase from within the Linux environment:

```bash
# In WSL2
cd /mnt/c/Users/eshay/CRM/crm
npx supabase start
```

This avoids Windows port reservation issues entirely.

---

## Switching Between Cloud and Local

### From Cloud to Local

1. Stop your development server
2. Start local Supabase: `npx supabase start`
3. Note the output - it provides your local keys
4. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:60321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
   SUPABASE_SERVICE_ROLE_KEY=<service role key from supabase start>
   ```
5. Restart your dev server: `npm run dev`

### From Local to Cloud

1. Update `.env.local` back to cloud credentials
2. Restart your dev server: `npm run dev`

---

## Local Infrastructure with Docker Compose

The project includes Docker Compose configurations that run PostgreSQL and Redis locally, but these are separate from Supabase and require manual integration.

### Start Docker Services

```powershell
# Development mode with hot reload
docker-compose -f docker-compose.dev.yml up

# Production mode
docker-compose -f docker-compose.prod.yml up

# Or use PowerShell scripts
.\docker-dev.ps1
.\docker-prod.ps1
```

**Note:** These containers run standalone PostgreSQL/Redis and don't include Supabase Auth, Storage, or Realtime features. You would need to implement authentication separately.

---

## Recommended Approach for MVP

**For fastest development:**
1. ✅ Keep using Cloud Supabase (current setup)
2. ✅ Run migrations via Supabase Dashboard
3. ✅ Focus on building features
4. ⏭️ Migrate to local Supabase later when needed

**Benefits:**
- No infrastructure management
- Built-in Auth, Storage, Realtime
- Automatic backups
- Free tier: 500MB database, 50k MAU
- Studio UI for database management

**When to switch to local:**
- Need offline development
- Privacy/compliance requirements
- Testing migration scripts
- Production self-hosting

---

## Troubleshooting

### Port Already in Use

```bash
# Stop all Supabase containers
npx supabase stop

# Check Docker containers
docker ps

# Stop specific container
docker stop <container_id>
```

### Migrations Not Applied

Check if tables exist in Supabase Studio:
1. Go to https://app.supabase.com/project/asclamyhgsbgixleplte
2. Click "Table Editor"
3. Should see: organizations, user_profiles, donors tables

### Authentication Errors

Ensure `.env.local` has correct keys:
```bash
# Print current environment (without exposing keys)
echo $NEXT_PUBLIC_SUPABASE_URL
```

---

## Next Steps

Once your environment is set up:

1. ✅ Verify signup and onboarding work
2. ✅ Create a test donor
3. ✅ Test donor list, search, filters
4. ✅ Try CSV export
5. 🚀 Start building new features!

---

## Additional Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/cli/local-development)
- [Docker for Windows](https://docs.docker.com/desktop/windows/install/)
- [WSL2 Installation](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Windows Port Exclusion Issue](https://github.com/docker/for-win/issues/3171)
