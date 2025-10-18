# Context Engineering Template - Local Development Setup

This document provides instructions for setting up the Context Engineering Template feature with local Supabase development environment.

## Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
- **Node.js 18+** with npm, yarn, or pnpm
- **Git** for version control

## Quick Start

### 1. Environment Setup

```bash
# Copy environment configuration
cp .env.local.example .env.local

# Review and update .env.local if needed
# The default values work for local development
```

### 2. Start Local Supabase

```bash
# Start all Supabase services
docker-compose up -d

# Wait for services to initialize (about 30 seconds)
# Check status
docker-compose ps
```

### 3. Install Dependencies and Start App

```bash
# Install Node.js dependencies
npm install  # or yarn install / pnpm install

# Start Next.js development server
npm run dev
```

### 4. Access Services

- **Next.js App**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Email Testing**: http://localhost:54324

## Automated Setup

For convenience, use the provided setup scripts:

### Linux/macOS
```bash
chmod +x scripts/setup-local-dev.sh
./scripts/setup-local-dev.sh
```

### Windows
```cmd
scripts\setup-local-dev.bat
```

## Database Schema

The Context Engineering Template uses the following main tables:

- **`context_templates`** - Main template storage with JSONB components
- **`context_template_collaborators`** - Team collaboration and permissions
- **`context_template_comments`** - Review and feedback system
- **`context_template_versions`** - Version control and history
- **`context_template_analytics`** - Usage tracking and metrics

### Schema Migrations

Database migrations are located in `supabase/migrations/`:

- `20250108000001_context_engineering_template.sql` - Core schema
- `20250108000002_context_template_rls_policies.sql` - Security policies

Migrations are applied automatically when Docker services start.

## Development Workflow

### 1. Making Schema Changes

```bash
# Create new migration file
# supabase/migrations/YYYYMMDDHHMMSS_description.sql

# Restart services to apply changes
docker-compose restart supabase-db
```

### 2. Viewing Database

Access Supabase Studio at http://localhost:54323 to:
- Browse tables and data
- Run SQL queries
- Manage authentication
- View real-time subscriptions

### 3. Testing Email Features

Email testing is available at http://localhost:54324:
- View all sent emails
- Test email templates
- Debug email delivery

### 4. API Testing

The Supabase API is available at http://localhost:54321:
- REST endpoints: `/rest/v1/`
- Authentication: `/auth/v1/`
- Real-time: `/realtime/v1/`
- Storage: `/storage/v1/`

## Environment Variables

### Local Development (.env.local)

```env
# Supabase Local Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Direct Access
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:54322/postgres

# Feature Configuration
CONTEXT_TEMPLATE_STORAGE_PATH=./data/context-templates
CONTEXT_TEMPLATE_EXPORT_PATH=./exports
```

### Production Configuration

For production deployment, update these variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your project's anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your project's service role key

## Troubleshooting

### Services Won't Start

```bash
# Check Docker status
docker info

# View service logs
docker-compose logs -f

# Reset everything
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps supabase-db

# Connect directly to database
docker-compose exec supabase-db psql -U postgres -d postgres
```

### Port Conflicts

If you have port conflicts, update `docker-compose.yml`:

```yaml
services:
  supabase-db:
    ports:
      - "5433:5432"  # Change from 5432 to 5433
```

### Migration Issues

```bash
# Reset database and reapply migrations
docker-compose down -v
docker-compose up -d

# Check migration status in Supabase Studio
# Go to http://localhost:54323 > SQL Editor
```

## Development Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Reset database (removes all data)
docker-compose down -v && docker-compose up -d

# Update services
docker-compose pull && docker-compose up -d

# Access database shell
docker-compose exec supabase-db psql -U postgres -d postgres
```

## File Structure

```
.kiro/specs/context-engineering-template/
├── README.md                    # This file
├── requirements.md              # Feature requirements
├── design.md                   # Technical design
└── tasks.md                    # Implementation tasks

supabase/
├── config.toml                 # Supabase configuration
├── config/
│   └── kong.yml               # API gateway config
└── migrations/
    ├── 20250108000001_context_engineering_template.sql
    └── 20250108000002_context_template_rls_policies.sql

scripts/
├── setup-local-dev.sh         # Linux/macOS setup
└── setup-local-dev.bat        # Windows setup

docker-compose.yml              # Local Supabase stack
.env.local.example             # Environment template
```

## Next Steps

1. **Review Requirements**: Read `requirements.md` for feature specifications
2. **Understand Design**: Review `design.md` for technical architecture
3. **Start Implementation**: Follow tasks in `tasks.md`
4. **Test Locally**: Use Supabase Studio and local services for testing

## Support

For issues with:
- **Docker Setup**: Check Docker documentation and system requirements
- **Supabase**: Visit [Supabase Local Development docs](https://supabase.com/docs/guides/local-development)
- **Next.js**: Check [Next.js documentation](https://nextjs.org/docs)

## Contributing

When contributing to this feature:
1. Follow the task list in `tasks.md`
2. Test changes locally with Docker setup
3. Update documentation as needed
4. Ensure all migrations are included