# Implementation Tasks
## Donor CRM - Context Engineering UI, Additional Reporting & Campaign Management

**Status**: Planning Complete ✅ | Implementation: Not Started
**Subagent Created**: `context-template-builder` ✅
**Total Estimated Tasks**: 43-52 tasks across 3 features

---

## 🎯 PRIORITY ORDER

1. **Context Engineering UI** (Weeks 1-4) - Start Here
2. **Additional Reporting** (Weeks 5-6)
3. **Campaign Management** (Weeks 7-10)

---

## 📋 FEATURE 1: CONTEXT ENGINEERING UI
**Database**: ✅ Complete (5 tables with RLS policies)
**Status**: Ready to implement
**Estimated Tasks**: 15-20

### Phase 1: Foundation (Tasks 1-5)
**Estimated Time**: 3-5 days

- [ ] **Task 1.1**: Create `ContextTemplateService` (`lib/services/context-template-service.ts`)
  - **Methods to implement**:
    - `getTemplates(orgId, page, limit, filters, sort)` - Paginated list
    - `getTemplate(templateId)` - Single template by ID
    - `createTemplate(orgId, templateData)` - Create new
    - `updateTemplate(templateId, updates)` - Update existing
    - `deleteTemplate(templateId)` - Soft delete
    - `getVersions(templateId)` - Version history
    - `restoreVersion(templateId, versionId)` - Restore old version
    - `compareVersions(templateId, v1, v2)` - Diff view
    - `addCollaborator(templateId, userId, role)` - Add team member
    - `removeCollaborator(templateId, userId)` - Remove team member
    - `updateCollaboratorPermissions(collaboratorId, permissions)` - Update perms
    - `getComments(templateId, componentPath?)` - Get comments
    - `addComment(templateId, content, componentPath)` - Add comment
    - `resolveComment(commentId)` - Resolve/close comment
    - `trackEvent(templateId, eventType, eventData)` - Analytics tracking
    - `getAnalytics(templateId)` - Usage metrics
    - `calculateQualityScore(components)` - Auto-calculate quality
    - `assessCompleteness(component)` - Component completeness %
    - `exportToPDF(templateId)` - PDF export
    - `exportToMarkdown(templateId)` - Markdown export
    - `exportToJSON(templateId)` - JSON export
  - **Pattern**: Follow `DonorService` structure
  - **Testing**: Mock Supabase calls

- [ ] **Task 1.2**: Add TypeScript types to `lib/types.ts`
  - **Types to add**:
    - `PlanningStage` enum
    - `ScenarioType` enum
    - `ComplexityLevel` enum
    - `ValidationStatus` enum
    - `ContextTemplateComponent` interface
    - `ContextTemplate` interface (full structure)
    - `ContextTemplateCollaborator` interface
    - `ContextTemplateComment` interface
    - `ContextTemplateVersion` interface
    - `ContextTemplateAnalytics` interface
    - `TemplateFilters` interface
    - `TemplateFormData` interface
  - **Reference**: Database schema in migration file

- [ ] **Task 1.3**: Update `lib/permissions.ts`
  - **Routes to add**:
    - `/context-templates` (all roles)
    - `/context-templates/new` (user+)
    - `/context-templates/[id]` (all roles)
    - `/context-templates/[id]/edit` (user+)
  - **Actions to add**:
    - `create_context_template` (user+)
    - `edit_context_template` (user+)
    - `delete_context_template` (manager+)
    - `view_context_templates` (all roles)
    - `export_context_template` (user+)
    - `manage_collaborators` (user+)
    - `approve_template` (manager+)

- [ ] **Task 1.4**: Review RLS policies (migration already exists)
  - **Verify**:
    - Organization isolation enforced
    - Collaborator access rules work
    - Comment visibility correct
    - Version history accessible
  - **Note**: Schema migration already includes RLS policies

- [ ] **Task 1.5**: Write unit tests for `ContextTemplateService`
  - **Test file**: `lib/services/context-template-service.test.ts`
  - **Tests to write**:
    - CRUD operations (create, read, update, delete)
    - Pagination and filtering
    - Version management (create, restore, compare)
    - Collaborator management
    - Comment system
    - Quality score calculation
    - Analytics tracking
    - Export functionality
  - **Coverage goal**: >90%

---

### Phase 2: Core UI Components (Tasks 6-11)
**Estimated Time**: 7-10 days

- [ ] **Task 2.1**: Build template list page
  - **File**: `app/context-templates/page.tsx`
  - **Features**:
    - Server component with initial data fetch
    - Pass organizationId and userProfile
    - SEO metadata
    - Permission checks
  - **Components**: Uses `TemplateList` component

- [ ] **Task 2.2**: Create template list component
  - **File**: `components/context-templates/template-list.tsx`
  - **Features**:
    - Paginated card/table view
    - Search by title/description
    - Filter by scenario type, status, complexity
    - Sort by created_at, updated_at, quality_score
    - Grid/list view toggle
    - Quality score badges
    - Status indicators
    - Create new button (permission-gated)
    - Export/clone buttons per template
  - **shadcn/ui components**: Card, Input, Select, Button, Badge, Pagination
  - **State management**: useState for filters, useEffect for loading

- [ ] **Task 2.3**: Build template editor page
  - **File**: `app/context-templates/[id]/edit/page.tsx`
  - **Features**:
    - Fetch template data server-side
    - Permission check (user must be collaborator or creator)
    - Pass to editor component
  - **Components**: Uses `TemplateEditor` component

- [ ] **Task 2.4**: Create template form component
  - **File**: `components/context-templates/template-form.tsx`
  - **Features**:
    - React Hook Form + Zod validation
    - Multi-step wizard:
      1. Header (title, purpose, principles, scope)
      2. Components (7 sections)
      3. Planning framework (stage selection)
      4. Metadata (tags, team size, duration)
    - Auto-save with 1s debounce
    - Optimistic UI updates
    - Save status indicator (saving/saved/error)
    - Version indicator
  - **shadcn/ui components**: Form, Tabs, Input, Textarea, Select, Button, Stepper
  - **Hooks**: useDebounce for auto-save

- [ ] **Task 2.5**: Build component editors (7 sections)
  - **File**: `components/context-templates/component-editor.tsx`
  - **Features**:
    - Rich text editor (markdown support)
    - Completeness slider (0-100%)
    - Quality score input (0-5)
    - Source references (array of strings)
    - Validation status selector
    - Character count
    - AI suggestions button (future)
  - **Editors needed**:
    1. Instructions
    2. User Prompt
    3. State/History
    4. Long-term Memory
    5. Retrieved Information
    6. Available Tools
    7. Structured Output
  - **shadcn/ui components**: Textarea, Slider, Input, Select, Badge
  - **Library**: react-markdown for preview

- [ ] **Task 2.6**: Create template detail page
  - **File**: `app/context-templates/[id]/page.tsx`
  - **Features**:
    - Read-only view of template
    - Beautiful formatting with syntax highlighting
    - Quality assessment visualization
    - Planning framework progress
    - Collaborator list
    - Version history timeline
    - Export buttons (PDF, Markdown, JSON)
    - Clone button
    - Edit button (permission-gated)
    - Usage statistics
  - **shadcn/ui components**: Card, Tabs, Badge, Progress, Button
  - **Libraries**: react-syntax-highlighter, react-markdown

---

### Phase 3: Collaboration Features (Tasks 12-15)
**Estimated Time**: 5-7 days

- [ ] **Task 3.1**: Build collaborator management
  - **File**: `components/context-templates/collaborators.tsx`
  - **Features**:
    - List current collaborators with avatars
    - Role badges (owner, editor, contributor, viewer)
    - Permission indicators
    - Invite new collaborators (search users in org)
    - Update collaborator role
    - Remove collaborator (with confirmation)
    - Activity feed (who edited what when)
  - **shadcn/ui components**: Dialog, Select, Button, Avatar, Badge, Table
  - **Permissions**: Only owner and admins can manage

- [ ] **Task 3.2**: Implement comment system
  - **File**: `components/context-templates/comments.tsx`
  - **Features**:
    - Thread-based comments
    - Reply to comments (nested)
    - Inline comments on specific components
    - Resolve/unresolve toggle
    - @mention users (notification future)
    - Rich text in comments (markdown)
    - Comment count badges
    - Filter by resolved/unresolved
    - Sort by date
  - **shadcn/ui components**: Card, Button, Textarea, Badge, Avatar
  - **State**: Real-time updates (Supabase Realtime - future)

- [ ] **Task 3.3**: Create version history with diff
  - **File**: `components/context-templates/version-history.tsx`
  - **Features**:
    - Timeline view of all versions
    - Version metadata (number, date, author, change summary)
    - Major version indicators
    - Restore version button (with confirmation)
    - Compare versions side-by-side
    - Diff viewer highlighting changes
    - Version notes/changelog
  - **shadcn/ui components**: Card, Button, Badge, Dialog
  - **Library**: react-diff-viewer for visual diffs

- [ ] **Task 3.4**: Build analytics dashboard
  - **File**: `components/context-templates/analytics.tsx`
  - **Features**:
    - Usage metrics chart (views over time)
    - Quality score trend
    - Completion time histogram
    - Success rate indicator
    - Event type breakdown (pie chart)
    - Top collaborators
    - Export frequency
    - Session duration average
  - **shadcn/ui components**: Card, Tabs
  - **Library**: Recharts for visualizations

---

### Phase 4: Testing (Tasks 16-20)
**Estimated Time**: 5-7 days

- [ ] **Task 4.1**: Write service layer tests
  - **File**: `lib/services/context-template-service.test.ts`
  - **Coverage**: All methods, edge cases, error handling
  - **Mock**: Supabase client

- [ ] **Task 4.2**: Write component tests
  - **Files**: `components/context-templates/*.test.tsx`
  - **Tests**: User interactions, conditional rendering, permission checks
  - **Library**: React Testing Library

- [ ] **Task 4.3**: Write E2E tests
  - **File**: `e2e/context-templates.spec.ts`
  - **Workflows**:
    - Create template flow
    - Edit and auto-save flow
    - Collaboration flow
    - Version restore flow
    - Export flow
  - **Library**: Playwright

- [ ] **Task 4.4**: Integration tests
  - Test service + component integration
  - Test real Supabase queries (test database)

- [ ] **Task 4.5**: Performance tests
  - Large template rendering
  - Auto-save performance
  - List pagination performance

---

## 📊 FEATURE 2: ADDITIONAL REPORTING
**Database**: No schema needed (queries existing data)
**Status**: Routes configured, ready to implement
**Estimated Tasks**: 10-12

### Phase 1: Foundation (Tasks 1-3)
**Estimated Time**: 2-3 days

- [ ] **Task 1**: Create `ReportService` (`lib/services/report-service.ts`)
  - **Methods**:
    - `getDonorReports(orgId, dateRange)` - Retention, acquisition, LTV
    - `getGivingReports(orgId, dateRange)` - Trends, levels, campaigns
    - `getOrganizationReports(orgId, dateRange)` - Team performance, goals
    - `getCustomReport(orgId, config)` - Custom report builder
    - `exportReportCSV(reportData)` - CSV export
    - `exportReportPDF(reportData)` - PDF export
    - `exportReportExcel(reportData)` - Excel export
    - `scheduleReport(orgId, reportConfig, schedule)` - Scheduled reports

- [ ] **Task 2**: Add TypeScript types
  - `ReportConfig`, `ReportData`, `ChartConfig`, `ExportFormat`

- [ ] **Task 3**: Write service tests

### Phase 2: Core Reports (Tasks 4-7)
**Estimated Time**: 4-5 days

- [ ] **Task 4**: Build reports dashboard (`app/reports/page.tsx`)
- [ ] **Task 5**: Create donor reports component
- [ ] **Task 6**: Create giving reports component
- [ ] **Task 7**: Build advanced reports page (`app/reports/advanced/page.tsx`)

### Phase 3: Visualization & Export (Tasks 8-10)
**Estimated Time**: 3-4 days

- [ ] **Task 8**: Build chart components (Recharts wrappers)
- [ ] **Task 9**: Implement export functionality
- [ ] **Task 10**: Create report filters component

### Phase 4: Testing (Tasks 11-12)
**Estimated Time**: 2-3 days

- [ ] **Task 11**: Service and component tests
- [ ] **Task 12**: E2E tests for report generation

---

## 🎯 FEATURE 3: CAMPAIGN MANAGEMENT
**Database**: Schema needed (4 tables)
**Status**: Routes configured, database schema needed
**Estimated Tasks**: 18-22

### Phase 1: Foundation (Tasks 1-5)
**Estimated Time**: 3-4 days

- [ ] **Task 1**: Create database migration
  - **Tables**: campaigns, campaign_donors, campaign_activities, campaign_metrics
  - **RLS policies**: Organization isolation, role-based access

- [ ] **Task 2**: Create `CampaignService` (`lib/services/campaign-service.ts`)
  - CRUD, donor assignment, progress tracking, ROI calculation

- [ ] **Task 3**: Add TypeScript types
  - `Campaign`, `CampaignStatus`, `CampaignType`, activity tracking types

- [ ] **Task 4**: Update permissions
  - Campaign routes and action permissions

- [ ] **Task 5**: Write service tests

### Phase 2: Core Campaign UI (Tasks 6-11)
**Estimated Time**: 8-10 days

- [ ] **Task 6**: Build campaign list page
- [ ] **Task 7**: Create campaign list component
- [ ] **Task 8**: Build campaign creation wizard (multi-step)
- [ ] **Task 9**: Create campaign form component
- [ ] **Task 10**: Build campaign detail page
- [ ] **Task 11**: Create campaign dashboard component

### Phase 3: Campaign Operations (Tasks 12-16)
**Estimated Time**: 6-8 days

- [ ] **Task 12**: Build donor assignment UI
- [ ] **Task 13**: Create activity tracking component
- [ ] **Task 14**: Build campaign analytics
- [ ] **Task 15**: Create email campaign component
- [ ] **Task 16**: Build goal tracking component

### Phase 4: Advanced Features (Tasks 17-19)
**Estimated Time**: 4-6 days

- [ ] **Task 17**: Build campaign templates
- [ ] **Task 18**: Create A/B testing UI
- [ ] **Task 19**: Build campaign reports

### Phase 5: Testing (Tasks 20-22)
**Estimated Time**: 4-5 days

- [ ] **Task 20**: Service layer tests
- [ ] **Task 21**: Component tests
- [ ] **Task 22**: E2E campaign workflow tests

---

## 🎨 SUBAGENT USAGE

### Context Template Builder
```bash
# Use the subagent for Context Engineering UI tasks
"Build the ContextTemplateService following the DonorService pattern"
"Create the template list page with pagination and filters"
"Implement the comment system with threading"
"Build the analytics dashboard"
```

### Future Subagents (Build when needed)

**`report-generator`** (For Reporting)
- Data aggregation specialist
- Chart configuration expert
- Export format handler

**`campaign-orchestrator`** (For Campaigns)
- Campaign lifecycle expert
- Donor assignment algorithms
- Goal tracking and forecasting

---

## 📈 SUCCESS METRICS

### Context Engineering UI
- [ ] Templates created per organization
- [ ] Collaboration engagement (comments, invites)
- [ ] Version restore rate
- [ ] Quality score improvements
- [ ] Export usage

### Reporting
- [ ] Report generation frequency
- [ ] Export format preferences
- [ ] Advanced report usage
- [ ] Scheduled report adoption

### Campaign Management
- [ ] Campaigns created
- [ ] Goal achievement rate
- [ ] Donor engagement
- [ ] ROI tracking adoption
- [ ] A/B test usage

---

## 🚀 GETTING STARTED

### Step 1: Start with Context Engineering UI
```bash
# Mark Phase 1 tasks as in_progress
# Begin with Task 1.1: ContextTemplateService
```

### Step 2: Use the Subagent
```bash
# Launch the context-template-builder subagent
"Build the ContextTemplateService with all CRUD methods"
```

### Step 3: Track Progress
- Update this document as tasks complete
- Use TodoWrite tool for daily tracking
- Run tests at each phase completion

---

**Last Updated**: 2025-10-14
**Status**: Ready to begin implementation
**Next Action**: Start Phase 1, Task 1.1 - Create ContextTemplateService
