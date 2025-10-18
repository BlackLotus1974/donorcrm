// Database types
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';
export type OrganizationStatus = 'active' | 'inactive' | 'trial';
export type DonorType = 'individual' | 'foundation' | 'corporation';
export type DonorStatus = 'active' | 'inactive' | 'deceased' | 'do_not_contact';
export type GivingLevel = 'major' | 'mid-level' | 'annual' | 'lapsed' | 'prospect';

// Organization interface
export interface Organization {
  id: string;
  name: string;
  slug: string;
  tax_id?: string;
  address?: Record<string, any>;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  settings?: Record<string, any>;
  status: OrganizationStatus;
  subscription_tier: string;
  subscription_ends_at?: string;
  created_at: string;
  updated_at: string;
}

// User profile interface
export interface UserProfile {
  id: string;
  organization_id?: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  title?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  last_active_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

// Donor interface
export interface Donor {
  id: string;
  organization_id: string;
  external_id?: string;
  
  // Personal Information
  first_name: string;
  last_name: string;
  preferred_name?: string;
  title?: string;
  suffix?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  mobile?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  
  // Professional Information
  employer?: string;
  job_title?: string;
  work_address?: Record<string, any>;
  
  // Donor Specific Fields
  donor_type: DonorType;
  source?: string;
  assigned_to?: string;
  capacity_rating?: string;
  interest_areas?: string[];
  giving_level?: GivingLevel;
  
  // Communication Preferences
  communication_preferences?: Record<string, any>;
  
  // Status and Dates
  status: DonorStatus;
  first_gift_date?: string;
  last_gift_date?: string;
  total_lifetime_giving: number;
  largest_gift_amount: number;
  
  // Metadata
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Route permission configuration
export interface RoutePermission {
  path: string;
  requiredRoles: UserRole[];
  requiresOrganization?: boolean;
  redirectTo?: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form types
export interface DonorFormData {
  first_name: string;
  last_name: string;
  preferred_name?: string;
  title?: string;
  suffix?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  employer?: string;
  job_title?: string;
  donor_type: DonorType;
  source?: string;
  assigned_to?: string;
  capacity_rating?: string;
  interest_areas?: string[];
  giving_level?: GivingLevel;
  communication_preferences?: Record<string, any>;
  status: DonorStatus;
  notes?: string;
  tags?: string[];
}

export interface OrganizationFormData {
  name: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

// Context Template types
export type PlanningStage =
  | 'problem_identification'
  | 'context_gathering'
  | 'information_organization'
  | 'validation_review'
  | 'implementation_preparation';

export type ScenarioType =
  | 'debugging'
  | 'feature_development'
  | 'code_review'
  | 'architecture_planning'
  | 'testing_strategy'
  | 'custom';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'enterprise';
export type ValidationStatus = 'draft' | 'review' | 'approved' | 'needs_revision';
export type CollaboratorRole = 'owner' | 'editor' | 'contributor' | 'viewer';

// Context Template Component
export interface ContextTemplateComponent {
  content: string;
  completeness: number;
  quality_score: number;
  sources: string[];
  validation_status: ValidationStatus;
}

// Context Template Header
export interface ContextTemplateHeader {
  title: string;
  purpose: string;
  principles: string[];
  scope: string;
  usage_guidelines: string[];
}

// Planning Framework
export interface PlanningFramework {
  current_stage: PlanningStage;
  completed_stages: PlanningStage[];
  stage_outputs: Record<string, any>;
}

// Quality Assessment
export interface QualityAssessment {
  completeness_score: number;
  clarity_score: number;
  accuracy_score: number;
  effectiveness_score: number;
  overall_score: number;
  assessment_notes: string[];
}

// Template Metadata
export interface TemplateMetadata {
  team_size: number;
  estimated_duration: number;
  tags: string[];
  custom_fields: Record<string, any>;
}

// Context Template interface
export interface ContextTemplate {
  id: string;
  organization_id: string;

  // Template metadata
  title: string;
  description?: string;
  version: string;
  scenario_type: ScenarioType;
  complexity_level: ComplexityLevel;

  // Template content
  header: ContextTemplateHeader;
  components: {
    instructions: ContextTemplateComponent;
    user_prompt: ContextTemplateComponent;
    state_history: ContextTemplateComponent;
    long_term_memory: ContextTemplateComponent;
    retrieved_information: ContextTemplateComponent;
    available_tools: ContextTemplateComponent;
    structured_output: ContextTemplateComponent;
  };

  // Framework and assessment
  planning_framework: PlanningFramework;
  quality_assessment: QualityAssessment;
  metadata: TemplateMetadata;

  // Status and relationships
  status: ValidationStatus;
  is_template: boolean;
  parent_template_id?: string;

  // Timestamps and audit
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  // Populated fields
  created_user?: Partial<UserProfile>;
  updated_user?: Partial<UserProfile>;
  parent_template?: Partial<ContextTemplate>;
}

// Context Template Collaborator
export interface ContextTemplateCollaborator {
  id: string;
  template_id: string;
  user_id: string;
  role: CollaboratorRole;
  permissions: {
    can_edit: boolean;
    can_comment: boolean;
    can_approve: boolean;
    can_delete: boolean;
  };
  invited_at: string;
  accepted_at?: string;
  created_by?: string;

  // Populated fields
  user?: Partial<UserProfile>;
  created_user?: Partial<UserProfile>;
}

// Context Template Comment
export interface ContextTemplateComment {
  id: string;
  template_id: string;
  parent_comment_id?: string;
  content: string;
  component_path?: string;
  line_number?: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;

  // Populated fields
  created_user?: Partial<UserProfile>;
  resolved_user?: Partial<UserProfile>;
  parent_comment?: Partial<ContextTemplateComment>;
}

// Context Template Version
export interface ContextTemplateVersion {
  id: string;
  template_id: string;
  version_number: string;
  template_data: Record<string, any>;
  change_summary?: string;
  is_major_version: boolean;
  created_at: string;
  created_by: string;

  // Populated fields
  created_user?: Partial<UserProfile>;
}

// Context Template Analytics
export interface ContextTemplateAnalytics {
  id: string;
  template_id: string;
  organization_id: string;
  user_id?: string;
  event_type: string;
  event_data: Record<string, any>;
  completion_time_seconds?: number;
  quality_score?: number;
  success_outcome?: boolean;
  session_id?: string;
  user_agent?: string;
  created_at: string;
}

// Context Template Form Data
export interface ContextTemplateFormData {
  title: string;
  description?: string;
  version?: string;
  scenario_type: ScenarioType;
  complexity_level: ComplexityLevel;
  header: ContextTemplateHeader;
  components: ContextTemplate['components'];
  planning_framework: PlanningFramework;
  quality_assessment: QualityAssessment;
  metadata: TemplateMetadata;
  status: ValidationStatus;
  is_template: boolean;
  parent_template_id?: string;
}