# Donor CRM System
## Product Requirements Document (PRD)

<p align="center">
  <strong>A comprehensive donor relationship management system built with Next.js and Supabase</strong>
</p>

<p align="center">
  <a href="#overview"><strong>Overview</strong></a> ·
  <a href="#core-features"><strong>Core Features</strong></a> ·
  <a href="#user-stories"><strong>User Stories</strong></a> ·
  <a href="#technical-requirements"><strong>Technical Requirements</strong></a> ·
  <a href="#setup-and-deployment"><strong>Setup & Deployment</strong></a> ·
  <a href="#development-roadmap"><strong>Development Roadmap</strong></a>
</p>
<br/>

## Overview

The Donor CRM System is designed to help nonprofit organizations, charities, and fundraising teams effectively manage donor relationships, track contributions, and optimize fundraising efforts. This comprehensive solution provides tools for donor management, campaign tracking, communication, and reporting.

### Target Users
- **Development Directors**: Track major gift prospects and stewardship
- **Fundraising Coordinators**: Manage campaigns and donor communications
- **Executive Directors**: Monitor organizational fundraising performance
- **Board Members**: Access high-level donor and campaign metrics

## Core Features

### 🔐 Authentication & User Management
- Role-based access control (Admin, Manager, User, Viewer)
- Secure authentication with Supabase Auth
- Multi-factor authentication support
- User activity logging and audit trails

### 👥 Donor Management
- **Donor Profiles**: Comprehensive donor records with contact information, giving history, and preferences
- **Relationship Tracking**: Map relationships between donors, board members, and staff
- **Donor Segmentation**: Advanced filtering and tagging system for targeted outreach
- **Wealth Screening Integration**: Connect with external wealth screening services
- **Communication History**: Log all interactions, calls, emails, and meetings

### 💰 Donation Tracking
- **Gift Processing**: Record one-time, recurring, and pledge donations
- **Payment Integration**: Connect with Stripe, PayPal, and other payment processors
- **Gift Acknowledgment**: Automated thank-you letters and tax receipts
- **Pledge Management**: Track multi-year commitments and payment schedules
- **Gift Designation**: Allocate donations to specific funds or campaigns

### 📊 Campaign Management
- **Campaign Creation**: Set up fundraising campaigns with goals and timelines
- **Progress Tracking**: Real-time campaign performance dashboards
- **Multi-channel Campaigns**: Email, direct mail, events, and online campaigns
- **A/B Testing**: Test different messaging and approaches
- **ROI Analysis**: Track cost-effectiveness of different campaign strategies

### 📧 Communication Tools
- **Email Marketing**: Integrated email campaigns with templates and scheduling
- **Automated Workflows**: Trigger-based communications for stewardship
- **Newsletter Management**: Subscriber lists and content management
- **Event Invitations**: RSVP tracking and event management
- **Personalized Messaging**: Dynamic content based on donor data

### 📈 Analytics & Reporting
- **Donor Analytics**: Lifetime value, retention rates, and giving patterns
- **Campaign Performance**: Conversion rates, response rates, and ROI
- **Financial Reports**: Income statements, budget vs. actual, and trend analysis
- **Custom Dashboards**: Configurable widgets for different user roles
- **Export Capabilities**: CSV, PDF, and Excel export options

### 🎯 Prospect Research
- **Prospect Identification**: Identify potential major gift prospects
- **Research Integration**: Connect with iWave, DonorSearch, and other tools
- **Capacity Ratings**: Assess giving potential and affinity
- **Move Management**: Track cultivation strategies and activities
- **Portfolio Management**: Assign prospects to development officers

## User Stories

### As a Development Director, I want to:
- Track major gift prospects through the cultivation cycle
- Set up automated stewardship workflows for different donor segments
- Generate donor portfolio reports for board meetings
- Monitor team performance and activity metrics

### As a Fundraising Coordinator, I want to:
- Create and manage fundraising campaigns with goals and timelines
- Send personalized email campaigns to segmented donor lists
- Track campaign performance and adjust strategies accordingly
- Generate thank-you letters and tax receipts automatically

### As a Nonprofit Executive, I want to:
- View real-time fundraising dashboards with key metrics
- Compare current performance against historical data and goals
- Export financial reports for board presentations
- Monitor donor retention rates and lifetime value

### As a Board Member, I want to:
- Access high-level fundraising metrics and trends
- View campaign progress and organizational performance
- Identify opportunities for personal involvement in major gift solicitation

## Technical Requirements

### Frontend Technology Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with dark/light theme support
- **State Management**: React Server Components + Zustand for client state
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Tables**: TanStack Table for complex data grids

### Backend & Database
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access control
- **API**: Next.js API routes with Server Actions
- **File Storage**: Supabase Storage for documents and images
- **Real-time**: Supabase Realtime for live updates

### Third-Party Integrations
- **Payment Processing**: Stripe for donation processing
- **Email Service**: Resend or SendGrid for transactional emails
- **Wealth Screening**: iWave or DonorSearch API integration
- **Export Services**: PDF generation with react-pdf
- **Analytics**: Posthog for user behavior tracking

### Database Schema (Key Tables)

```sql
-- Core Tables
donors (id, name, email, phone, address, created_at, updated_at)
donations (id, donor_id, amount, date, campaign_id, status, payment_method)
campaigns (id, name, goal_amount, start_date, end_date, status, created_by)
users (id, email, role, organization_id, created_at)
organizations (id, name, tax_id, address, settings)

-- Relationship Tables
donor_relationships (id, donor_id, related_donor_id, relationship_type)
donor_tags (id, donor_id, tag_name, created_at)
communication_log (id, donor_id, type, subject, content, created_by, created_at)
pledges (id, donor_id, total_amount, installments, frequency, start_date)

-- Analytics Tables
donor_segments (id, name, criteria, created_by)
campaign_analytics (id, campaign_id, date, metrics_json)
```

### Security Requirements
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based permissions (Admin, Manager, User, Viewer)
- **Data Protection**: PII encryption at rest and in transit
- **Audit Logging**: Track all user actions and data changes
- **Compliance**: GDPR and CCPA compliance features

## Setup and Deployment

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Stripe account (for payment processing)
- Email service account (Resend/SendGrid)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd donor-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or  
   pnpm install
   ```

3. **Set up Supabase project**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migrations in `/supabase/migrations/`
   - Set up Row Level Security (RLS) policies

4. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and configure:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Email Service
   RESEND_API_KEY=your_resend_api_key
   # or
   SENDGRID_API_KEY=your_sendgrid_api_key

   # Optional Integrations
   IWAVE_API_KEY=your_iwave_api_key
   POSTHOG_KEY=your_posthog_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Deployment

#### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

#### Deploy to Other Platforms
- **Railway**: Use `railway.app` for easy deployment
- **AWS/GCP/Azure**: Deploy using Docker containers
- **Self-hosted**: Use PM2 for process management

### Database Migrations

The system includes Supabase migrations for setting up the database schema:

```bash
# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

### Initial Data Setup

1. **Create organization**
   ```sql
   INSERT INTO organizations (name, tax_id, address) 
   VALUES ('Your Organization', '12-3456789', 'Your Address');
   ```

2. **Create admin user**
   - Sign up through the application
   - Update user role to 'admin' in the database

3. **Import initial data** (optional)
   - Use CSV import tools for existing donor data
   - Follow data mapping guidelines in `/docs/data-import.md`

## Development Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Authentication system with role-based access
- [ ] Basic donor profile management
- [ ] Simple donation tracking
- [ ] Core database schema implementation
- [ ] Basic dashboard with key metrics

### Phase 2: Core CRM Features (Weeks 5-8)
- [ ] Advanced donor management with relationships
- [ ] Campaign creation and management
- [ ] Communication logging and history
- [ ] Email integration for campaigns
- [ ] Basic reporting and analytics

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Payment processing integration (Stripe)
- [ ] Automated workflows and triggers
- [ ] Advanced segmentation and filtering
- [ ] Pledge and recurring donation management
- [ ] Export and import functionality

### Phase 4: Integrations & Polish (Weeks 13-16)
- [ ] Wealth screening API integration
- [ ] Advanced analytics and reporting
- [ ] Mobile responsiveness optimization
- [ ] Performance optimization
- [ ] Security audit and compliance features

### Phase 5: Enterprise Features (Future)
- [ ] Multi-organization support
- [ ] Advanced prospect research tools
- [ ] API for third-party integrations
- [ ] Custom field management
- [ ] Advanced automation workflows

## Performance Requirements

### Response Times
- Page load: < 2 seconds
- Search operations: < 500ms
- Report generation: < 5 seconds
- Real-time updates: < 100ms latency

### Scalability Targets
- Support 10,000+ donors per organization
- Handle 1,000+ concurrent users
- Process 100+ donations per minute
- Store 5+ years of historical data

## Compliance & Security

### Data Protection
- GDPR compliance with data export and deletion
- CCPA compliance for California donors
- PCI DSS compliance for payment processing
- SOC 2 Type II compliance for enterprise clients

### Security Features
- End-to-end encryption for sensitive data
- Regular security audits and penetration testing
- Role-based access controls (RBAC)
- Activity logging and audit trails
- Multi-factor authentication (MFA)

## Support & Maintenance

### Documentation
- User guide for end users
- API documentation for developers
- Database schema documentation
- Deployment and configuration guides

### Training & Onboarding
- Video tutorials for common workflows
- Live training sessions for organizations
- Best practices documentation
- Migration guides from other CRM systems

### Support Channels
- Email support for technical issues
- Community forum for user questions
- Professional services for custom implementations
- Regular product updates and feature releases
