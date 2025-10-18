import { ContextTemplateService } from './context-template-service';
import type { ContextTemplate, ContextTemplateFormData } from '@/lib/types';

// Supabase client is already mocked in jest.setup.js

describe('ContextTemplateService', () => {
  let service: ContextTemplateService;
  let mockSupabase: any;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockTemplateId = 'template-123';

  const mockTemplate: ContextTemplate = {
    id: mockTemplateId,
    organization_id: mockOrganizationId,
    title: 'Test Template',
    description: 'A test template',
    version: '1.0',
    scenario_type: 'debugging',
    complexity_level: 'moderate',
    header: {
      title: 'Test Header',
      purpose: 'Testing',
      principles: ['Test principle 1'],
      scope: 'Test scope',
      usage_guidelines: ['Guideline 1']
    },
    components: {
      instructions: {
        content: 'Test instructions',
        completeness: 80,
        quality_score: 4,
        sources: ['source1'],
        validation_status: 'approved'
      },
      user_prompt: {
        content: 'Test prompt',
        completeness: 70,
        quality_score: 3.5,
        sources: [],
        validation_status: 'draft'
      },
      state_history: {
        content: 'Test state',
        completeness: 60,
        quality_score: 3,
        sources: [],
        validation_status: 'draft'
      },
      long_term_memory: {
        content: 'Test memory',
        completeness: 50,
        quality_score: 2.5,
        sources: [],
        validation_status: 'draft'
      },
      retrieved_information: {
        content: 'Test info',
        completeness: 40,
        quality_score: 2,
        sources: [],
        validation_status: 'draft'
      },
      available_tools: {
        content: 'Test tools',
        completeness: 30,
        quality_score: 1.5,
        sources: [],
        validation_status: 'draft'
      },
      structured_output: {
        content: 'Test output',
        completeness: 20,
        quality_score: 1,
        sources: [],
        validation_status: 'draft'
      }
    },
    planning_framework: {
      current_stage: 'problem_identification',
      completed_stages: [],
      stage_outputs: {}
    },
    quality_assessment: {
      completeness_score: 50,
      clarity_score: 60,
      accuracy_score: 70,
      effectiveness_score: 80,
      overall_score: 65,
      assessment_notes: []
    },
    metadata: {
      team_size: 1,
      estimated_duration: 60,
      tags: ['test', 'debugging'],
      custom_fields: {}
    },
    status: 'draft',
    is_template: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: mockUserId,
    updated_by: mockUserId
  };

  const mockFormData: ContextTemplateFormData = {
    title: 'New Template',
    description: 'New description',
    scenario_type: 'feature_development',
    complexity_level: 'complex',
    header: mockTemplate.header,
    components: mockTemplate.components,
    planning_framework: mockTemplate.planning_framework,
    quality_assessment: mockTemplate.quality_assessment,
    metadata: mockTemplate.metadata,
    status: 'draft',
    is_template: false
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Service is instantiated fresh for each test
    service = new ContextTemplateService();

    // Access the mocked supabase instance
    // @ts-ignore - accessing private member for testing
    mockSupabase = service['supabase'];

    // Setup default mock behavior
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    });
  });

  describe('getTemplates', () => {
    it('should fetch templates with pagination', async () => {
      const mockData = [mockTemplate];
      const mockCount = 1;

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: mockCount
        })
      });

      const result = await service.getTemplates(mockOrganizationId, 1, 20);

      expect(result).toEqual({
        data: mockData,
        count: mockCount,
        page: 1,
        limit: 20,
        total_pages: 1
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('context_templates');
    });

    it('should apply search filter', async () => {
      const mockOr = jest.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: mockOr,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      });

      await service.getTemplates(mockOrganizationId, 1, 20, { search: 'test' });

      expect(mockOr).toHaveBeenCalled();
    });

    it('should apply scenario_type filter', async () => {
      const mockIn = jest.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: mockIn,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      });

      await service.getTemplates(mockOrganizationId, 1, 20, {
        scenario_type: ['debugging', 'feature_development']
      });

      expect(mockIn).toHaveBeenCalledWith('scenario_type', ['debugging', 'feature_development']);
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
          count: 0
        })
      });

      const result = await service.getTemplates(mockOrganizationId);

      expect(result).toEqual({
        data: [],
        count: 0,
        page: 1,
        limit: 20,
        total_pages: 0
      });
    });
  });

  describe('getTemplate', () => {
    it('should fetch a single template by ID', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTemplate, error: null })
      });

      const result = await service.getTemplate(mockTemplateId);

      expect(result).toEqual(mockTemplate);
      expect(mockSupabase.from).toHaveBeenCalledWith('context_templates');
    });

    it('should return null on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found')
        })
      });

      const result = await service.getTemplate(mockTemplateId);

      expect(result).toBeNull();
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTemplate, error: null })
      });

      // Mock trackEvent to avoid infinite recursion
      const trackEventSpy = jest.spyOn(service, 'trackEvent').mockResolvedValue(true);

      const result = await service.createTemplate(mockOrganizationId, mockFormData);

      expect(result).toEqual(mockTemplate);
      expect(mockSupabase.from).toHaveBeenCalledWith('context_templates');
      expect(trackEventSpy).toHaveBeenCalled();

      trackEventSpy.mockRestore();
    });

    it('should return null if no authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await service.createTemplate(mockOrganizationId, mockFormData);

      expect(result).toBeNull();
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const updates = { title: 'Updated Title' };
      const updatedTemplate = { ...mockTemplate, ...updates };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedTemplate, error: null })
      });

      const trackEventSpy = jest.spyOn(service, 'trackEvent').mockResolvedValue(true);

      const result = await service.updateTemplate(mockTemplateId, updates);

      expect(result).toEqual(updatedTemplate);
      expect(trackEventSpy).toHaveBeenCalled();

      trackEventSpy.mockRestore();
    });
  });

  describe('deleteTemplate', () => {
    it('should soft delete a template', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      const trackEventSpy = jest.spyOn(service, 'trackEvent').mockResolvedValue(true);

      const result = await service.deleteTemplate(mockTemplateId);

      expect(result).toBe(true);
      expect(trackEventSpy).toHaveBeenCalled();

      trackEventSpy.mockRestore();
    });

    it('should return false on error', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') })
      });

      const result = await service.deleteTemplate(mockTemplateId);

      expect(result).toBe(false);
    });
  });

  describe('cloneTemplate', () => {
    it('should clone a template successfully', async () => {
      const getTemplateSpy = jest.spyOn(service, 'getTemplate').mockResolvedValue(mockTemplate);
      const createTemplateSpy = jest.spyOn(service, 'createTemplate').mockResolvedValue({
        ...mockTemplate,
        id: 'new-id',
        title: 'Test Template (Copy)'
      });
      const trackEventSpy = jest.spyOn(service, 'trackEvent').mockResolvedValue(true);

      const result = await service.cloneTemplate(mockTemplateId, mockOrganizationId);

      expect(result).toBeTruthy();
      expect(result?.title).toBe('Test Template (Copy)');
      expect(getTemplateSpy).toHaveBeenCalledWith(mockTemplateId);
      expect(createTemplateSpy).toHaveBeenCalled();

      getTemplateSpy.mockRestore();
      createTemplateSpy.mockRestore();
      trackEventSpy.mockRestore();
    });

    it('should use custom title when provided', async () => {
      const customTitle = 'Custom Clone Title';
      const getTemplateSpy = jest.spyOn(service, 'getTemplate').mockResolvedValue(mockTemplate);
      const createTemplateSpy = jest.spyOn(service, 'createTemplate').mockResolvedValue({
        ...mockTemplate,
        id: 'new-id',
        title: customTitle
      });
      const trackEventSpy = jest.spyOn(service, 'trackEvent').mockResolvedValue(true);

      const result = await service.cloneTemplate(mockTemplateId, mockOrganizationId, customTitle);

      expect(result?.title).toBe(customTitle);

      getTemplateSpy.mockRestore();
      createTemplateSpy.mockRestore();
      trackEventSpy.mockRestore();
    });
  });

  describe('getCollaborators', () => {
    it('should fetch collaborators for a template', async () => {
      const mockCollaborators = [
        {
          id: 'collab-1',
          template_id: mockTemplateId,
          user_id: mockUserId,
          role: 'editor' as const,
          permissions: { can_edit: true, can_comment: true, can_approve: false, can_delete: false },
          invited_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockCollaborators, error: null })
      });

      const result = await service.getCollaborators(mockTemplateId);

      expect(result).toEqual(mockCollaborators);
      expect(mockSupabase.from).toHaveBeenCalledWith('context_template_collaborators');
    });
  });

  describe('addCollaborator', () => {
    it('should add a collaborator with default permissions', async () => {
      const newCollaborator = {
        id: 'collab-1',
        template_id: mockTemplateId,
        user_id: 'user-456',
        role: 'editor' as const,
        permissions: { can_edit: true, can_comment: true, can_approve: false, can_delete: false },
        invited_at: '2024-01-01T00:00:00Z',
        created_by: mockUserId
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newCollaborator, error: null })
      });

      const result = await service.addCollaborator(mockTemplateId, 'user-456', 'editor');

      expect(result).toEqual(newCollaborator);
    });
  });

  describe('getComments', () => {
    it('should fetch comments for a template', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          template_id: mockTemplateId,
          content: 'Test comment',
          is_resolved: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: mockUserId
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockComments, error: null })
      });

      const result = await service.getComments(mockTemplateId);

      expect(result).toEqual(mockComments);
      expect(mockSupabase.from).toHaveBeenCalledWith('context_template_comments');
    });

    it('should filter by component_path when provided', async () => {
      // Create a promise-like object that also has the eq method for chaining after order()
      const finalPromise = Promise.resolve({ data: [], error: null });
      (finalPromise as any).eq = jest.fn().mockResolvedValue({ data: [], error: null });

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue(finalPromise)  // order() returns promise with eq method
      };

      // Make sure each method returns the chain object
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);

      mockSupabase.from.mockReturnValue(mockChain);

      await service.getComments(mockTemplateId, 'components.instructions');

      // Check both eq() calls - first for template_id on the chain, second for component_path on the promise
      expect(mockChain.eq).toHaveBeenCalledWith('template_id', mockTemplateId);
      expect((finalPromise as any).eq).toHaveBeenCalledWith('component_path', 'components.instructions');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
  });

  describe('addComment', () => {
    it('should add a comment to a template', async () => {
      const newComment = {
        id: 'comment-1',
        template_id: mockTemplateId,
        content: 'New comment',
        is_resolved: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: mockUserId
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newComment, error: null })
      });

      const result = await service.addComment(mockTemplateId, 'New comment');

      expect(result).toEqual(newComment);
    });
  });

  describe('resolveComment', () => {
    it('should resolve a comment', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await service.resolveComment('comment-1', true);

      expect(result).toBe(true);
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate average quality score from components', () => {
      const score = service.calculateQualityScore(mockTemplate.components);

      // Average of [4, 3.5, 3, 2.5, 2, 1.5, 1] = 2.5
      expect(score).toBe(2.5);
    });

    it('should return 0 for empty components', () => {
      const emptyComponents = {} as any;
      const score = service.calculateQualityScore(emptyComponents);

      expect(score).toBe(0);
    });
  });

  describe('assessCompleteness', () => {
    it('should assess component completeness correctly', () => {
      const component = mockTemplate.components.instructions;
      const completeness = service.assessCompleteness(component);

      // Has content (25) + has sources (25) + approved (25) + has quality (25) = 100
      expect(completeness).toBe(100);
    });

    it('should return 0 for empty component', () => {
      const emptyComponent = {
        content: '',
        completeness: 0,
        quality_score: 0,
        sources: [],
        validation_status: 'draft' as const
      };

      const completeness = service.assessCompleteness(emptyComponent);

      expect(completeness).toBe(0);
    });
  });

  describe('exportToJSON', () => {
    it('should export template as JSON string', async () => {
      const getTemplateSpy = jest.spyOn(service, 'getTemplate').mockResolvedValue(mockTemplate);
      const trackEventSpy = jest.spyOn(service, 'trackEvent').mockResolvedValue(true);

      const result = await service.exportToJSON(mockTemplateId);

      expect(result).toBeTruthy();
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe(mockTemplateId);

      getTemplateSpy.mockRestore();
      trackEventSpy.mockRestore();
    });
  });

  describe('exportToMarkdown', () => {
    it('should export template as Markdown string', async () => {
      const getTemplateSpy = jest.spyOn(service, 'getTemplate').mockResolvedValue(mockTemplate);
      const trackEventSpy = jest.spyOn(service, 'trackEvent').mockResolvedValue(true);

      const result = await service.exportToMarkdown(mockTemplateId);

      expect(result).toContain('# Test Template');
      expect(result).toContain('## Header');
      expect(result).toContain('## Context Components');

      getTemplateSpy.mockRestore();
      trackEventSpy.mockRestore();
    });
  });
});
