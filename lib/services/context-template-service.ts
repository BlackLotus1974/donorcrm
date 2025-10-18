import { createClient } from '@/lib/supabase/client';
import {
  ContextTemplate,
  ContextTemplateFormData,
  ContextTemplateCollaborator,
  ContextTemplateComment,
  ContextTemplateVersion,
  PaginatedResponse
} from '@/lib/types';

export interface TemplateFilters {
  search?: string;
  scenario_type?: string[];
  complexity_level?: string[];
  status?: string[];
  is_template?: boolean;
  created_by?: string;
  tags?: string[];
  created_after?: string;
  created_before?: string;
}

export interface TemplateSortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AnalyticsEvent {
  event_type: 'created' | 'viewed' | 'edited' | 'completed' | 'exported' | 'cloned' | 'deleted';
  event_data?: Record<string, any>;
  completion_time_seconds?: number;
  quality_score?: number;
  success_outcome?: boolean;
}

export class ContextTemplateService {
  private supabase = createClient();

  /**
   * Get context templates with pagination, search, and filtering
   */
  async getTemplates(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters?: TemplateFilters,
    sort?: TemplateSortOptions
  ): Promise<PaginatedResponse<ContextTemplate>> {
    try {
      let query = this.supabase
        .from('context_templates')
        .select(`
          *,
          created_user:user_profiles!context_templates_created_by_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          updated_user:user_profiles!context_templates_updated_by_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          parent_template:context_templates!context_templates_parent_template_id_fkey(
            id,
            title
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId);

      // Apply search (full-text search on title, description, header content)
      if (filters?.search) {
        query = query.or(`
          title.ilike.%${filters.search}%,
          description.ilike.%${filters.search}%
        `);
      }

      // Apply filters
      if (filters?.scenario_type?.length) {
        query = query.in('scenario_type', filters.scenario_type);
      }

      if (filters?.complexity_level?.length) {
        query = query.in('complexity_level', filters.complexity_level);
      }

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters?.is_template !== undefined) {
        query = query.eq('is_template', filters.is_template);
      }

      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters?.tags?.length) {
        query = query.contains('metadata->tags', filters.tags);
      }

      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        // Default sort by updated date (most recent first)
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching context templates:', error);
      return {
        data: [],
        count: 0,
        page,
        limit,
        total_pages: 0
      };
    }
  }

  /**
   * Get a single context template by ID
   */
  async getTemplate(templateId: string): Promise<ContextTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('context_templates')
        .select(`
          *,
          created_user:user_profiles!context_templates_created_by_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          updated_user:user_profiles!context_templates_updated_by_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          parent_template:context_templates!context_templates_parent_template_id_fkey(
            id,
            title
          )
        `)
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching context template:', error);
      return null;
    }
  }

  /**
   * Create a new context template
   */
  async createTemplate(
    organizationId: string,
    templateData: ContextTemplateFormData
  ): Promise<ContextTemplate | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .from('context_templates')
        .insert({
          organization_id: organizationId,
          ...templateData,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Track analytics event
      if (data) {
        await this.trackEvent(data.id, {
          event_type: 'created',
          event_data: { scenario_type: data.scenario_type }
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating context template:', error);
      return null;
    }
  }

  /**
   * Update an existing context template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<ContextTemplateFormData>
  ): Promise<ContextTemplate | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .from('context_templates')
        .update({
          ...updates,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      // Track analytics event
      if (data) {
        await this.trackEvent(templateId, {
          event_type: 'edited',
          event_data: { fields_updated: Object.keys(updates) }
        });
      }

      return data;
    } catch (error) {
      console.error('Error updating context template:', error);
      return null;
    }
  }

  /**
   * Delete a context template (soft delete by updating status)
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('context_templates')
        .update({
          status: 'draft', // Soft delete by reverting to draft
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;

      // Track analytics event
      await this.trackEvent(templateId, {
        event_type: 'deleted',
        success_outcome: true
      });

      return true;
    } catch (error) {
      console.error('Error deleting context template:', error);
      return false;
    }
  }

  /**
   * Clone a template (create a new instance from a template)
   */
  async cloneTemplate(
    templateId: string,
    organizationId: string,
    newTitle?: string
  ): Promise<ContextTemplate | null> {
    try {
      const original = await this.getTemplate(templateId);
      if (!original) throw new Error('Template not found');

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const clonedData: ContextTemplateFormData = {
        title: newTitle || `${original.title} (Copy)`,
        description: original.description,
        version: '1.0',
        scenario_type: original.scenario_type,
        complexity_level: original.complexity_level,
        header: original.header,
        components: original.components,
        planning_framework: {
          current_stage: 'problem_identification',
          completed_stages: [],
          stage_outputs: {}
        },
        quality_assessment: {
          completeness_score: 0,
          clarity_score: 0,
          accuracy_score: 0,
          effectiveness_score: 0,
          overall_score: 0,
          assessment_notes: []
        },
        metadata: {
          ...original.metadata,
          tags: original.metadata?.tags || []
        },
        status: 'draft',
        is_template: false,
        parent_template_id: original.is_template ? original.id : original.parent_template_id
      };

      const cloned = await this.createTemplate(organizationId, clonedData);

      // Track analytics event
      if (cloned) {
        await this.trackEvent(cloned.id, {
          event_type: 'cloned',
          event_data: { parent_template_id: templateId }
        });
      }

      return cloned;
    } catch (error) {
      console.error('Error cloning template:', error);
      return null;
    }
  }

  /**
   * Get version history for a template
   */
  async getVersions(templateId: string): Promise<ContextTemplateVersion[]> {
    try {
      const { data, error } = await this.supabase
        .from('context_template_versions')
        .select(`
          *,
          created_user:user_profiles!context_template_versions_created_by_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  }

  /**
   * Restore a previous version of a template
   */
  async restoreVersion(templateId: string, versionId: string): Promise<ContextTemplate | null> {
    try {
      // Get the version data
      const { data: version, error: versionError } = await this.supabase
        .from('context_template_versions')
        .select('template_data')
        .eq('id', versionId)
        .eq('template_id', templateId)
        .single();

      if (versionError) throw versionError;
      if (!version) throw new Error('Version not found');

      // Update the template with the version data
      const versionData = version.template_data as any;
      const updated = await this.updateTemplate(templateId, {
        header: versionData.header,
        components: versionData.components,
        planning_framework: versionData.planning_framework,
        quality_assessment: versionData.quality_assessment,
        metadata: versionData.metadata
      });

      return updated;
    } catch (error) {
      console.error('Error restoring version:', error);
      return null;
    }
  }

  /**
   * Get collaborators for a template
   */
  async getCollaborators(templateId: string): Promise<ContextTemplateCollaborator[]> {
    try {
      const { data, error } = await this.supabase
        .from('context_template_collaborators')
        .select(`
          *,
          user:user_profiles!context_template_collaborators_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          created_user:user_profiles!context_template_collaborators_created_by_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('template_id', templateId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      return [];
    }
  }

  /**
   * Add a collaborator to a template
   */
  async addCollaborator(
    templateId: string,
    userId: string,
    role: 'owner' | 'editor' | 'contributor' | 'viewer',
    permissions?: Record<string, boolean>
  ): Promise<ContextTemplateCollaborator | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const defaultPermissions = {
        can_edit: role === 'owner' || role === 'editor',
        can_comment: true,
        can_approve: role === 'owner',
        can_delete: role === 'owner'
      };

      const { data, error } = await this.supabase
        .from('context_template_collaborators')
        .insert({
          template_id: templateId,
          user_id: userId,
          role,
          permissions: permissions || defaultPermissions,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding collaborator:', error);
      return null;
    }
  }

  /**
   * Remove a collaborator from a template
   */
  async removeCollaborator(collaboratorId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('context_template_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      return false;
    }
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaboratorPermissions(
    collaboratorId: string,
    permissions: Record<string, boolean>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('context_template_collaborators')
        .update({ permissions })
        .eq('id', collaboratorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating collaborator permissions:', error);
      return false;
    }
  }

  /**
   * Get comments for a template
   */
  async getComments(
    templateId: string,
    componentPath?: string
  ): Promise<ContextTemplateComment[]> {
    try {
      let query = this.supabase
        .from('context_template_comments')
        .select(`
          *,
          created_user:user_profiles!context_template_comments_created_by_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          resolved_user:user_profiles!context_template_comments_resolved_by_fkey(
            id,
            first_name,
            last_name
          ),
          parent_comment:context_template_comments!context_template_comments_parent_comment_id_fkey(
            id,
            content
          )
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: true });

      if (componentPath) {
        query = query.eq('component_path', componentPath);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * Add a comment to a template
   */
  async addComment(
    templateId: string,
    content: string,
    componentPath?: string,
    parentCommentId?: string,
    lineNumber?: number
  ): Promise<ContextTemplateComment | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .from('context_template_comments')
        .insert({
          template_id: templateId,
          content,
          component_path: componentPath,
          parent_comment_id: parentCommentId,
          line_number: lineNumber,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  /**
   * Resolve a comment
   */
  async resolveComment(commentId: string, resolved: boolean = true): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await this.supabase
        .from('context_template_comments')
        .update({
          is_resolved: resolved,
          resolved_at: resolved ? new Date().toISOString() : null,
          resolved_by: resolved ? user.id : null
        })
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resolving comment:', error);
      return false;
    }
  }

  /**
   * Track an analytics event for a template
   */
  async trackEvent(
    templateId: string,
    event: AnalyticsEvent
  ): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      // Get the template to access organization_id
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      const { error } = await this.supabase
        .from('context_template_analytics')
        .insert({
          template_id: templateId,
          organization_id: template.organization_id,
          user_id: user?.id,
          event_type: event.event_type,
          event_data: event.event_data || {},
          completion_time_seconds: event.completion_time_seconds,
          quality_score: event.quality_score,
          success_outcome: event.success_outcome,
          session_id: `session_${Date.now()}`,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      return false;
    }
  }

  /**
   * Get analytics for a template
   */
  async getAnalytics(templateId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('context_template_analytics')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate summary metrics
      const totalViews = data?.filter(e => e.event_type === 'viewed').length || 0;
      const totalEdits = data?.filter(e => e.event_type === 'edited').length || 0;
      const totalExports = data?.filter(e => e.event_type === 'exported').length || 0;
      const avgCompletionTime = data
        ?.filter(e => e.completion_time_seconds)
        .reduce((sum, e) => sum + (e.completion_time_seconds || 0), 0) /
        (data?.filter(e => e.completion_time_seconds).length || 1);

      return {
        events: data || [],
        summary: {
          totalViews,
          totalEdits,
          totalExports,
          avgCompletionTime,
          uniqueUsers: new Set(data?.map(e => e.user_id).filter(Boolean)).size
        }
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { events: [], summary: {} };
    }
  }

  /**
   * Calculate quality score for template components
   */
  calculateQualityScore(components: ContextTemplate['components']): number {
    const componentScores = Object.values(components).map(c => c.quality_score || 0);
    if (componentScores.length === 0) return 0;

    const sum = componentScores.reduce((a, b) => a + b, 0);
    return Number((sum / componentScores.length).toFixed(2));
  }

  /**
   * Assess completeness of a component
   */
  assessCompleteness(component: ContextTemplate['components']['instructions']): number {
    const factors = {
      hasContent: component.content.length > 0 ? 25 : 0,
      hasSources: (component.sources?.length || 0) > 0 ? 25 : 0,
      isApproved: component.validation_status === 'approved' ? 25 : 0,
      hasQuality: component.quality_score > 0 ? 25 : 0,
    };

    return Object.values(factors).reduce((a, b) => a + b, 0);
  }

  /**
   * Export template to JSON
   */
  async exportToJSON(templateId: string): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      // Track export event
      await this.trackEvent(templateId, {
        event_type: 'exported',
        event_data: { format: 'json' },
        success_outcome: true
      });

      return JSON.stringify(template, null, 2);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      return JSON.stringify({ error: 'Export failed' });
    }
  }

  /**
   * Export template to Markdown
   */
  async exportToMarkdown(templateId: string): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      let markdown = `# ${template.title}\n\n`;

      if (template.description) {
        markdown += `${template.description}\n\n`;
      }

      markdown += `---\n\n`;
      markdown += `## Header\n\n`;
      markdown += `**Purpose:** ${template.header.purpose}\n\n`;
      markdown += `**Scope:** ${template.header.scope}\n\n`;

      if (template.header.principles?.length) {
        markdown += `### Principles\n`;
        template.header.principles.forEach(p => {
          markdown += `- ${p}\n`;
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
      markdown += `## Context Components\n\n`;

      const componentNames = [
        'instructions',
        'user_prompt',
        'state_history',
        'long_term_memory',
        'retrieved_information',
        'available_tools',
        'structured_output'
      ];

      componentNames.forEach(name => {
        const component = (template.components as any)[name];
        if (component && component.content) {
          markdown += `### ${name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}\n\n`;
          markdown += `${component.content}\n\n`;
          markdown += `**Completeness:** ${component.completeness}% | **Quality:** ${component.quality_score}/5\n\n`;
        }
      });

      // Track export event
      await this.trackEvent(templateId, {
        event_type: 'exported',
        event_data: { format: 'markdown' },
        success_outcome: true
      });

      return markdown;
    } catch (error) {
      console.error('Error exporting to Markdown:', error);
      return '# Export Error\n\nFailed to export template.';
    }
  }
}

// Export singleton instance
export const contextTemplateService = new ContextTemplateService();
