# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

For first-time setup, see [QUICKSTART.md](QUICKSTART.md). For Docker setup, see [DOCKER_GUIDE.md](DOCKER_GUIDE.md).

**Typical development workflow:**
```bash
# 1. Start Supabase (first time or after stopping)
npx supabase start

# 2. Install dependencies (first time or after package updates)
npm install

# 3. Start development server
npm run dev

# Access at http://localhost:3004
```

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack (runs on port 3004)
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Supabase Local Development
The project supports local Supabase development with Docker:

```bash
# Start local Supabase stack (PostgreSQL, Auth, Storage, Studio, etc.)
npx supabase start

# Check status of all Supabase services
npx supabase status

# Stop local Supabase services
npx supabase stop

# View logs from Supabase services
npx supabase logs

# Apply new migrations to local database
npx supabase db push

# Reset local database (destructive - for development only)
npx supabase db reset

# Generate TypeScript types from database schema
npx supabase gen types typescript --local > lib/database.types.ts
```

**Important Local URLs:**
- Application: http://localhost:3004
- Supabase Studio (Database UI): http://127.0.0.1:60323
- Mailpit (Email Testing): http://127.0.0.1:60324
- API: http://127.0.0.1:58321

### Testing
- `npm run test` - Run all Jest unit and integration tests
- `npm run test:watch` - Run tests in watch mode (for active development)
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with interactive UI
- `npm run test:e2e:headed` - Run E2E tests in visible browser
- `npm run playwright:install` - Install Playwright browsers (first-time setup)

Run specific tests:
```bash
# Run single test file
npm run test -- donor-service.test.ts

# Run E2E tests for specific feature
npm run test:e2e -- auth.spec.ts

# Debug specific test in headed mode
npm run test:e2e:headed -- auth.spec.ts
```

### Docker Development (Windows)
The project includes Docker setup with Windows-specific scripts:
- `docker-start.ps1` / `docker-start.bat` - Start all Docker containers
- `docker-stop.ps1` / `docker-stop.bat` - Stop all Docker containers
- `docker-rebuild.ps1` - Rebuild containers after dependency changes
- `docker-dev.ps1` - Start in development mode with hot reload
- `docker-prod.ps1` - Start in production mode with optimized build
- `docker-debug.ps1` - Start with debugging enabled
- `docker-clean-rebuild.ps1` - Clean rebuild (removes volumes)

Docker setup includes:
- Next.js app container on port 3000
- Optional PostgreSQL 15 container on port 5432
- Optional Redis 7 container on port 6379

For detailed Docker commands, see [DOCKER_GUIDE.md](DOCKER_GUIDE.md).

### Environment Setup
Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

The project can run with:
1. **Cloud Supabase** (default) - Use Supabase cloud instance
2. **Local Supabase** (recommended for development) - Run `npx supabase start` to spin up local stack with Docker
3. **Local Docker** - Optional local PostgreSQL and Redis containers

### Windows Helper Scripts
The `scripts/` directory contains PowerShell utilities for Windows development:
- `scripts/kill-dev-servers.ps1` - Kill all Node.js processes on port 3004 (useful when dev server hangs)
- Use these when multiple dev servers are running or ports are blocked

## Architecture Overview

This is a **Donor CRM System** for nonprofit organizations to manage donor relationships, track contributions, and optimize fundraising efforts.

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Authentication**: Supabase Auth with SSR support
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Styling**: Tailwind CSS with shadcn/ui components
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Theme**: next-themes for dark/light mode switching
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **TypeScript**: Full TypeScript support with strict mode
- **Testing**: Jest + React Testing Library + Playwright
- **Containerization**: Docker with multi-stage builds (standalone output mode)

### Project Structure

```
app/
├── auth/               # Authentication pages
├── dashboard/          # Main dashboard
├── donors/             # Donor management pages
│   ├── [id]/          # Donor detail and edit pages
│   ├── new/           # Create new donor
│   └── page.tsx       # Donor list
├── onboarding/        # Organization onboarding flow
├── context-templates/ # Context engineering templates (AI prompt management)
└── layout.tsx         # Root layout with theme provider

components/
├── ui/                # shadcn/ui primitives (don't edit directly)
├── auth/              # Authentication components
├── dashboard/         # Dashboard-specific components
├── donors/            # Donor management components
├── layout/            # Layout components (sidebars, headers)
├── onboarding/        # Onboarding flow components
└── context-templates/ # Context template management components

lib/
├── supabase/          # Supabase client configurations
│   ├── client.ts      # Browser client
│   ├── server.ts      # Server client
│   └── middleware.ts  # Middleware client
├── services/          # Business logic layer
│   ├── donor-service.ts                # Donor CRUD operations
│   ├── organization-service.ts         # Organization management
│   ├── user-service.ts                 # User management
│   ├── context-template-service.ts     # Context template management
│   └── realtime-collaboration-service.ts # Real-time collaboration features
├── hooks/             # Custom React hooks
│   ├── use-organization.ts
│   ├── use-user.ts
│   └── use-realtime-collaboration.ts
├── permissions.ts     # Role-based access control
├── types.ts           # Shared TypeScript types
└── utils.ts           # Utility functions

supabase/
└── migrations/        # Database schema migrations
    ├── 20250813000001_initial_schema.sql          # Core schema (organizations, users, donors)
    ├── 20250813000002_rls_policies.sql            # Row Level Security policies
    ├── 20250108000001_context_engineering_template.sql  # Context templates schema
    └── 20250108000002_context_template_rls_policies.sql # Context template RLS

e2e/                   # Playwright end-to-end tests
├── auth.spec.ts       # Authentication flows
└── collaboration.spec.ts  # Real-time collaboration features
```

### Key Architectural Patterns

#### Multi-Tenancy with Organizations
- Every resource (donors, campaigns, etc.) belongs to an `organization_id`
- Users join organizations during onboarding
- Row Level Security (RLS) enforces organization data isolation
- User profiles extend Supabase `auth.users` table

#### Role-Based Access Control (RBAC)
Four role levels with hierarchical permissions:
1. **Viewer** - Read-only access to donors and campaigns
2. **User** - Can create/edit donors and log communications
3. **Manager** - Can create campaigns, manage users (viewer/user roles)
4. **Admin** - Full access including organization settings

Permissions configured in `lib/permissions.ts`:
- `hasPermission()` - Check if role has required permissions
- `canAccessRoute()` - Route-level authorization with redirects
- `canPerformAction()` - Action-level permissions (create/edit/delete)
- `ROUTE_PERMISSIONS` - Route-to-role mapping configuration

#### Authentication Flow
- Supabase Auth with cookie-based sessions for SSR compatibility
- Three Supabase client configurations for different Next.js contexts:
  - `client.ts` - Browser/client components
  - `server.ts` - Server components and API routes
  - `middleware.ts` - Edge middleware for route protection
- Middleware protects routes and handles organization checks
- Onboarding flow for users without organizations

#### Service Layer Pattern
Business logic encapsulated in service classes (`lib/services/`):
- **DonorService**: Full CRUD, pagination, filtering, search, bulk operations, export
- **OrganizationService**: Organization management
- **UserService**: User profile management
- **ContextTemplateService**: Context template CRUD, versioning, collaboration
- **RealtimeCollaborationService**: Real-time updates, presence tracking, live cursors

Services handle:
- Complex queries with Supabase
- Error handling and logging
- Permission checks
- Data transformation
- Pagination and filtering
- Real-time subscriptions and presence

Example service usage:
```typescript
import { donorService } from '@/lib/services/donor-service';

// Get paginated donors with filters
const result = await donorService.getDonors(
  organizationId,
  page,
  limit,
  { search: 'John', status: ['active'], giving_level: ['major'] },
  { field: 'last_gift_date', direction: 'desc' }
);

// Context template with real-time collaboration
import { contextTemplateService } from '@/lib/services/context-template-service';
const template = await contextTemplateService.getTemplate(templateId);
```

#### Database Schema
Core tables with multi-tenancy:
- `organizations` - Organization profiles with subscription info
- `user_profiles` - Extends auth.users with role and organization
- `donors` - Comprehensive donor records with 30+ fields
- `context_templates` - AI prompt engineering templates with versioning
- `context_template_collaborators` - Collaboration and permissions
- `context_template_comments` - Threaded comments on templates
- `context_template_versions` - Version history and rollback
- `context_template_analytics` - Usage tracking and metrics
- Full-text search indexes on donor names, emails, employers, notes
- Automatic updated_at timestamps via triggers
- Organization slug auto-generation

Key donor fields:
- Personal/contact info (name, email, phone, address)
- Professional info (employer, job title)
- Donor metadata (type, status, giving level, capacity rating)
- Financial (total lifetime giving, largest gift, first/last gift dates)
- Relationship tracking (assigned_to user, tags, custom fields)

Context template features:
- Structured prompt engineering with 7 core components
- Scenario types: debugging, feature development, code review, architecture, testing
- Complexity levels: simple, moderate, complex, enterprise
- Quality assessment scoring and validation workflows
- Real-time collaboration with role-based permissions (owner, editor, contributor, viewer)

#### Component Architecture
- shadcn/ui components in `components/ui/` (installed via CLI, don't edit directly)
- Domain components compose ui primitives (donors, dashboard, onboarding)
- Custom hooks for shared logic (useOrganization, useUser)
- React Hook Form + Zod for form validation
- Recharts for data visualization

#### Styling System
- Tailwind CSS with custom design tokens via CSS variables
- shadcn/ui "New York" style with Radix UI primitives
- CSS variables in `app/globals.css` for theming
- Dark/light mode via next-themes with class-based switching

### Testing Strategy

#### Unit Tests
Test individual functions, utilities, permissions (Jest + RTL):
- `lib/utils.test.ts` - Utility functions
- `lib/permissions.test.ts` - RBAC logic
- `lib/services/donor-service.test.ts` - Service layer
- Place test files alongside source files (`.test.ts`, `.test.tsx`)

#### Component Tests
Test React components with user interactions (React Testing Library):
- `components/auth-button.test.tsx` - Component rendering and interactions
- Mock Supabase client in `jest.setup.js`
- Use `screen.getByRole()` for accessibility-friendly queries

#### End-to-End Tests
Test complete user workflows (Playwright):
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/collaboration.spec.ts` - Real-time collaboration features
- Tests run against local dev server
- Configured for Chrome, Firefox, Safari, and mobile

Test configuration:
- `jest.config.js` - Jest with Next.js preset, path mapping
- `jest.setup.js` - jest-dom matchers, mocked browser APIs, Supabase mocks
- `playwright.config.ts` - Multi-browser E2E testing

### Development Workflow

#### Adding New Features
1. Update database schema in new migration file
2. Update TypeScript types in `lib/types.ts`
3. Create/update service in `lib/services/`
4. Build UI components composing shadcn/ui primitives
5. Add route with proper permissions in `lib/permissions.ts`
6. Write tests (unit, component, E2E as appropriate)

#### Working with Database Migrations
Migrations are stored in `supabase/migrations/` with timestamp prefixes:

```bash
# Create a new migration file
npx supabase migration new [migration_name]

# Apply migrations to local database
npx supabase db push

# Reset local database and reapply all migrations (development only)
npx supabase db reset

# Generate TypeScript types from current schema
npx supabase gen types typescript --local > lib/database.types.ts
```

**Migration Best Practices:**
- Always test migrations locally before deploying
- Use descriptive names with timestamp format: `YYYYMMDDHHMMSS_description.sql`
- Include both forward and rollback logic where possible
- Document breaking changes in migration comments
- Update RLS policies in separate migration files for clarity

**Current migrations:**
- `20240101000001_initial_schema.sql` - Core tables (organizations, users, donors)
- `20240101000002_rls_policies.sql` - Row Level Security policies
- Context template migrations (`.disabled` suffix indicates they're optional features)

#### Working with Donors
The donor model is central to the CRM:
- `DonorService` handles all donor operations
- Supports complex filtering (search, status, giving level, tags, date ranges)
- Advanced features: bulk updates, CSV export, statistics
- Full-text search enabled on name, email, employer, notes

#### Adding shadcn/ui Components
```bash
npx shadcn@latest add [component-name]
```
Components are configured in `components.json` with New York style and CSS variables.

### Important Patterns

#### Path Aliases
The project uses TypeScript path aliases for clean imports:
- `@/*` maps to the root directory
- Example: `import { createClient } from '@/lib/supabase/client'`
- Configured in both `tsconfig.json` and `components.json`
- Always use path aliases instead of relative paths (e.g., `../../../lib/utils`)

shadcn/ui aliases:
- `@/components` - Component directory
- `@/lib/utils` - Utility functions
- `@/components/ui` - shadcn/ui primitives
- `@/lib` - Library code
- `@/hooks` - React hooks

#### Supabase Client Selection
Always use the correct client for the context:
- **Client Components**: `import { createClient } from '@/lib/supabase/client'`
- **Server Components**: `import { createClient } from '@/lib/supabase/server'`
- **Middleware**: `import { createClient } from '@/lib/supabase/middleware'`

#### Permission Checks
Check permissions before rendering UI or performing actions:
```typescript
import { canPerformAction } from '@/lib/permissions';

if (canPerformAction('create_donor', user.role)) {
  // Show create button
}

// Context template permissions
if (canPerformAction('create_context_template', user.role)) {
  // Allow template creation
}

// Collaboration permissions checked via collaborator roles
if (canPerformAction('manage_collaborators', user.role)) {
  // Show collaborator management UI
}
```

Available permission actions:
- Donors: `create_donor`, `edit_donor`, `delete_donor`
- Campaigns: `create_campaign`, `edit_campaign`, `delete_campaign`
- Context Templates: `create_context_template`, `edit_context_template`, `delete_context_template`, `view_context_templates`, `export_context_template`, `clone_template`, `approve_template`
- Collaboration: `manage_collaborators`
- Administration: `manage_users`, `manage_organization`, `export_data`, `import_data`
- Reporting: `view_reports`

#### Type Safety
- All database entities have TypeScript interfaces in `lib/types.ts`
- Form data has separate types (e.g., `DonorFormData`, `ContextTemplateFormData`)
- API responses use `ApiResponse<T>` and `PaginatedResponse<T>`
- Context template types include: `ContextTemplate`, `ContextTemplateCollaborator`, `ContextTemplateComment`, `ContextTemplateVersion`, `ContextTemplateAnalytics`
- Enums for: `UserRole`, `DonorType`, `DonorStatus`, `GivingLevel`, `ScenarioType`, `ComplexityLevel`, `ValidationStatus`, `CollaboratorRole`, `PlanningStage`

### Context Engineering Templates

The system includes an advanced Context Engineering Template feature for managing AI prompts and workflows:

#### Template Structure
Each template contains 7 core components:
1. **Instructions** - System-level directives and behavior guidelines
2. **User Prompt** - The actual user request or query
3. **State History** - Conversation and action history
4. **Long-term Memory** - Persistent knowledge and context
5. **Retrieved Information** - External data and references
6. **Available Tools** - Tool definitions and capabilities
7. **Structured Output** - Response format specifications

#### Planning Framework
Templates include a 5-stage planning methodology:
1. **Problem Identification** - Define the challenge
2. **Context Gathering** - Collect relevant information
3. **Information Organization** - Structure and categorize data
4. **Validation & Review** - Quality assurance checks
5. **Implementation Preparation** - Finalize for execution

#### Real-time Collaboration
- Multiple users can collaborate on templates simultaneously
- Four collaboration roles: Owner, Editor, Contributor, Viewer
- Live presence tracking shows who's currently viewing/editing
- Threaded comments with resolution tracking
- Version history with rollback capability

#### Working with Context Templates
```typescript
import { contextTemplateService } from '@/lib/services/context-template-service';

// Create a new template
const template = await contextTemplateService.createTemplate(organizationId, {
  title: 'Feature Development Template',
  scenario_type: 'feature_development',
  complexity_level: 'moderate',
  // ... other fields
});

// Add collaborators
await contextTemplateService.addCollaborator(templateId, userId, 'editor');

// Track usage analytics
await contextTemplateService.trackTemplateUsage(templateId, organizationId, {
  event_type: 'template_used',
  completion_time_seconds: 120,
  quality_score: 85,
  success_outcome: true
});
```

### Configuration Notes

#### Next.js Configuration
The `next.config.ts` includes important settings:
- **Standalone output mode** - Optimizes Docker deployments with minimal dependencies
- **Build error handling** - ESLint and TypeScript errors are currently ignored during builds (development setting)
- **Image optimization** - Configured for Supabase storage with remote patterns
- **Security headers** - `poweredByHeader` disabled for security

#### Windows Development
This project is configured for Windows development:
- PowerShell scripts (`.ps1`) for Docker management
- Batch scripts (`.bat`) as fallback for restricted PowerShell environments
- Docker Desktop required for containerized development
- WSL2 backend recommended for Docker Desktop on Windows

#### Component Installation
Use shadcn/ui CLI to add new components:
```bash
npx shadcn@latest add [component-name]
```
This maintains consistency with the "New York" style, CSS variables, and Radix UI primitives.
Never manually edit files in `components/ui/` - always reinstall via CLI if changes needed.

## Common Issues & Troubleshooting

### Multiple Dev Servers Running
If you see "Port 3004 already in use":
```powershell
# Windows PowerShell
.\scripts\kill-dev-servers.ps1

# Then restart
npm run dev
```

### Supabase Not Starting
```bash
# Verify Docker is running
docker ps

# If issues persist, restart Supabase
npx supabase stop
npx supabase start

# Check all services are healthy
npx supabase status
```

### Authentication Issues
- Check `.env.local` has correct Supabase URL and anon key
- Verify Supabase is running: `npx supabase status`
- Clear browser cookies for localhost
- Check Supabase Studio auth users: http://127.0.0.1:60323

### Database Schema Issues
```bash
# Reset local database and reapply all migrations
npx supabase db reset

# Or apply only new migrations
npx supabase db push
```

### Type Errors After Schema Changes
After modifying database schema, regenerate TypeScript types:
```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

### Build Errors
Note: The project currently has `ignoreBuildErrors: true` in `next.config.ts` for development convenience. This should be disabled before production deployment.