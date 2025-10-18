'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  FileText,
  Settings,
  BookOpen,
  MessageSquare,
  Database,
  Wrench,
  Target,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { contextTemplateService } from '@/lib/services/context-template-service';
import {
  ContextTemplate,
  ContextTemplateFormData,
  UserProfile,
  ScenarioType,
  ComplexityLevel,
  ValidationStatus,
  PlanningStage,
} from '@/lib/types';

// Validation schema
const templateSchema = z.object({
  // Basic Info
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  scenario_type: z.enum([
    'debugging',
    'feature_development',
    'code_review',
    'architecture_planning',
    'testing_strategy',
    'custom'
  ] as const),
  complexity_level: z.enum(['simple', 'moderate', 'complex', 'enterprise'] as const),
  status: z.enum(['draft', 'review', 'approved', 'needs_revision'] as const),
  is_template: z.boolean(),
  version: z.string(),

  // Header
  header_purpose: z.string().min(1, 'Purpose is required'),
  header_scope: z.string().min(1, 'Scope is required'),
  header_principles: z.array(z.string()).optional(),

  // Context Components
  instructions_content: z.string().min(1, 'Instructions are required'),
  instructions_sources: z.array(z.string()).optional(),

  user_prompt_content: z.string().min(1, 'User prompt is required'),
  user_prompt_sources: z.array(z.string()).optional(),

  state_history_content: z.string(),
  state_history_sources: z.array(z.string()).optional(),

  long_term_memory_content: z.string(),
  long_term_memory_sources: z.array(z.string()).optional(),

  retrieved_information_content: z.string(),
  retrieved_information_sources: z.array(z.string()).optional(),

  available_tools_content: z.string(),
  available_tools_sources: z.array(z.string()).optional(),

  structured_output_content: z.string(),
  structured_output_sources: z.array(z.string()).optional(),

  // Planning Framework
  planning_stage: z.enum([
    'problem_identification',
    'context_gathering',
    'information_organization',
    'validation_review',
    'implementation_preparation'
  ] as const).optional(),
  planning_objectives: z.array(z.string()).optional(),
  planning_success_criteria: z.array(z.string()).optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  additional_notes: z.string().optional(),
});

type TemplateFormInput = z.infer<typeof templateSchema>;

interface ContextTemplateFormProps {
  organizationId: string;
  userProfile: UserProfile;
  template?: ContextTemplate;
  mode?: 'create' | 'edit';
}

export default function ContextTemplateForm({
  organizationId,
  userProfile,
  template,
  mode = 'create',
}: ContextTemplateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newPrinciple, setNewPrinciple] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newCriteria, setNewCriteria] = useState('');

  const form = useForm<TemplateFormInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? {
          title: template.title,
          description: template.description || '',
          scenario_type: template.scenario_type,
          complexity_level: template.complexity_level,
          status: template.status,
          is_template: template.is_template,
          version: template.version,
          header_purpose: template.header.purpose,
          header_scope: template.header.scope,
          header_principles: template.header.principles || [],
          instructions_content: template.components.instructions.content,
          instructions_sources: template.components.instructions.sources || [],
          user_prompt_content: template.components.user_prompt.content,
          user_prompt_sources: template.components.user_prompt.sources || [],
          state_history_content: template.components.state_history.content,
          state_history_sources: template.components.state_history.sources || [],
          long_term_memory_content: template.components.long_term_memory.content,
          long_term_memory_sources: template.components.long_term_memory.sources || [],
          retrieved_information_content: template.components.retrieved_information.content,
          retrieved_information_sources: template.components.retrieved_information.sources || [],
          available_tools_content: template.components.available_tools.content,
          available_tools_sources: template.components.available_tools.sources || [],
          structured_output_content: template.components.structured_output.content,
          structured_output_sources: template.components.structured_output.sources || [],
          planning_stage: template.planning_framework?.current_stage,
          planning_objectives: [],
          planning_success_criteria: [],
          tags: template.metadata?.tags || [],
          additional_notes: '',
        }
      : {
          scenario_type: 'custom',
          complexity_level: 'moderate',
          status: 'draft',
          is_template: false,
          version: '1.0.0',
          header_purpose: '',
          header_scope: '',
          header_principles: [],
          instructions_content: '',
          instructions_sources: [],
          user_prompt_content: '',
          user_prompt_sources: [],
          state_history_content: '',
          state_history_sources: [],
          long_term_memory_content: '',
          long_term_memory_sources: [],
          retrieved_information_content: '',
          retrieved_information_sources: [],
          available_tools_content: '',
          available_tools_sources: [],
          structured_output_content: '',
          structured_output_sources: [],
          planning_objectives: [],
          planning_success_criteria: [],
          tags: [],
          additional_notes: '',
        },
  });

  const watchedTags = form.watch('tags') || [];
  const watchedPrinciples = form.watch('header_principles') || [];
  const watchedObjectives = form.watch('planning_objectives') || [];
  const watchedCriteria = form.watch('planning_success_criteria') || [];

  const onSubmit = async (data: TemplateFormInput) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Transform form data to ContextTemplateFormData
      const templateData: ContextTemplateFormData = {
        title: data.title,
        description: data.description,
        version: data.version,
        scenario_type: data.scenario_type,
        complexity_level: data.complexity_level,
        header: {
          title: data.title,
          purpose: data.header_purpose,
          scope: data.header_scope,
          principles: data.header_principles || [],
          usage_guidelines: [],
        },
        components: {
          instructions: {
            content: data.instructions_content,
            completeness: 0,
            quality_score: 0,
            sources: data.instructions_sources || [],
            validation_status: 'draft',
          },
          user_prompt: {
            content: data.user_prompt_content,
            completeness: 0,
            quality_score: 0,
            sources: data.user_prompt_sources || [],
            validation_status: 'draft',
          },
          state_history: {
            content: data.state_history_content,
            completeness: 0,
            quality_score: 0,
            sources: data.state_history_sources || [],
            validation_status: 'draft',
          },
          long_term_memory: {
            content: data.long_term_memory_content,
            completeness: 0,
            quality_score: 0,
            sources: data.long_term_memory_sources || [],
            validation_status: 'draft',
          },
          retrieved_information: {
            content: data.retrieved_information_content,
            completeness: 0,
            quality_score: 0,
            sources: data.retrieved_information_sources || [],
            validation_status: 'draft',
          },
          available_tools: {
            content: data.available_tools_content,
            completeness: 0,
            quality_score: 0,
            sources: data.available_tools_sources || [],
            validation_status: 'draft',
          },
          structured_output: {
            content: data.structured_output_content,
            completeness: 0,
            quality_score: 0,
            sources: data.structured_output_sources || [],
            validation_status: 'draft',
          },
        },
        planning_framework: {
          current_stage: data.planning_stage || 'problem_identification',
          completed_stages: [],
          stage_outputs: {},
        },
        quality_assessment: {
          overall_score: 0,
          completeness_score: 0,
          clarity_score: 0,
          accuracy_score: 0,
          effectiveness_score: 0,
          assessment_notes: [],
        },
        metadata: {
          team_size: 0,
          estimated_duration: 0,
          tags: data.tags || [],
          custom_fields: {},
        },
        status: data.status,
        is_template: data.is_template,
      };

      let result: ContextTemplate | null = null;

      if (mode === 'create') {
        result = await contextTemplateService.createTemplate(organizationId, templateData);
      } else if (template) {
        result = await contextTemplateService.updateTemplate(template.id, templateData);
      }

      if (result) {
        router.push(`/context-templates/${result.id}`);
      } else {
        throw new Error(`Failed to ${mode} template`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} template`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for arrays
  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      form.setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    form.setValue('tags', watchedTags.filter(t => t !== tag));
  };

  const addPrinciple = () => {
    if (newPrinciple.trim() && !watchedPrinciples.includes(newPrinciple.trim())) {
      form.setValue('header_principles', [...watchedPrinciples, newPrinciple.trim()]);
      setNewPrinciple('');
    }
  };

  const removePrinciple = (principle: string) => {
    form.setValue('header_principles', watchedPrinciples.filter(p => p !== principle));
  };

  const addObjective = () => {
    if (newObjective.trim() && !watchedObjectives.includes(newObjective.trim())) {
      form.setValue('planning_objectives', [...watchedObjectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const removeObjective = (objective: string) => {
    form.setValue('planning_objectives', watchedObjectives.filter(o => o !== objective));
  };

  const addCriteria = () => {
    if (newCriteria.trim() && !watchedCriteria.includes(newCriteria.trim())) {
      form.setValue('planning_success_criteria', [...watchedCriteria, newCriteria.trim()]);
      setNewCriteria('');
    }
  };

  const removeCriteria = (criteria: string) => {
    form.setValue('planning_success_criteria', watchedCriteria.filter(c => c !== criteria));
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href={template ? `/context-templates/${template.id}` : '/context-templates'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Update Template'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">
            <Settings className="h-4 w-4 mr-2" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="components">
            <FileText className="h-4 w-4 mr-2" />
            Components
          </TabsTrigger>
          <TabsTrigger value="planning">
            <Target className="h-4 w-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="metadata">
            <Database className="h-4 w-4 mr-2" />
            Metadata
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="e.g., Bug Fix Context Template"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Brief description of this template's purpose..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scenario_type">Scenario Type *</Label>
                  <Select
                    value={form.watch('scenario_type')}
                    onValueChange={(value) => form.setValue('scenario_type', value as ScenarioType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debugging">Debugging</SelectItem>
                      <SelectItem value="feature_development">Feature Development</SelectItem>
                      <SelectItem value="code_review">Code Review</SelectItem>
                      <SelectItem value="architecture_planning">Architecture Planning</SelectItem>
                      <SelectItem value="testing_strategy">Testing Strategy</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="complexity_level">Complexity Level *</Label>
                  <Select
                    value={form.watch('complexity_level')}
                    onValueChange={(value) => form.setValue('complexity_level', value as ComplexityLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as ValidationStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="needs_revision">Needs Revision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="version">Version *</Label>
                  <Input
                    id="version"
                    {...form.register('version')}
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_template"
                  checked={form.watch('is_template')}
                  onChange={(e) => form.setValue('is_template', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_template" className="font-normal cursor-pointer">
                  Mark as reusable template
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="header_purpose">Purpose *</Label>
                <Textarea
                  id="header_purpose"
                  {...form.register('header_purpose')}
                  placeholder="Describe the main purpose of this context template..."
                  rows={3}
                />
                {form.formState.errors.header_purpose && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.header_purpose.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="header_scope">Scope *</Label>
                <Textarea
                  id="header_scope"
                  {...form.register('header_scope')}
                  placeholder="Define what this template covers and its boundaries..."
                  rows={3}
                />
                {form.formState.errors.header_scope && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.header_scope.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Guiding Principles</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newPrinciple}
                    onChange={(e) => setNewPrinciple(e.target.value)}
                    placeholder="Add a guiding principle"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPrinciple();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addPrinciple}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {watchedPrinciples.map((principle, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                      <span className="flex-1">{principle}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrinciple(principle)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <ComponentEditor
            label="1. Instructions"
            description="System behavior and general guidance"
            contentField="instructions_content"
            sourcesField="instructions_sources"
            form={form}
            icon={<BookOpen className="h-5 w-5" />}
          />

          <ComponentEditor
            label="2. User Prompt"
            description="Input specification and user request"
            contentField="user_prompt_content"
            sourcesField="user_prompt_sources"
            form={form}
            icon={<MessageSquare className="h-5 w-5" />}
          />

          <ComponentEditor
            label="3. State / History"
            description="Current system state and conversation history"
            contentField="state_history_content"
            sourcesField="state_history_sources"
            form={form}
            icon={<Database className="h-5 w-5" />}
          />

          <ComponentEditor
            label="4. Long-term Memory"
            description="Persistent knowledge and learned patterns"
            contentField="long_term_memory_content"
            sourcesField="long_term_memory_sources"
            form={form}
            icon={<Database className="h-5 w-5" />}
          />

          <ComponentEditor
            label="5. Retrieved Information"
            description="External knowledge and documentation"
            contentField="retrieved_information_content"
            sourcesField="retrieved_information_sources"
            form={form}
            icon={<FileText className="h-5 w-5" />}
          />

          <ComponentEditor
            label="6. Available Tools"
            description="Capabilities and resources accessible"
            contentField="available_tools_content"
            sourcesField="available_tools_sources"
            form={form}
            icon={<Wrench className="h-5 w-5" />}
          />

          <ComponentEditor
            label="7. Structured Output"
            description="Expected result format and structure"
            contentField="structured_output_content"
            sourcesField="structured_output_sources"
            form={form}
            icon={<Target className="h-5 w-5" />}
          />
        </TabsContent>

        {/* Planning Tab */}
        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planning Framework</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="planning_stage">Current Stage</Label>
                <Select
                  value={form.watch('planning_stage') || 'problem_identification'}
                  onValueChange={(value) => form.setValue('planning_stage', value as PlanningStage)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="problem_identification">Problem Identification</SelectItem>
                    <SelectItem value="context_gathering">Context Gathering</SelectItem>
                    <SelectItem value="information_organization">Information Organization</SelectItem>
                    <SelectItem value="validation_review">Validation & Review</SelectItem>
                    <SelectItem value="implementation_preparation">Implementation Preparation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Objectives</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add an objective"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addObjective();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addObjective}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {watchedObjectives.map((objective, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                      <span className="flex-1">{objective}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(objective)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Success Criteria</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newCriteria}
                    onChange={(e) => setNewCriteria(e.target.value)}
                    placeholder="Add success criteria"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCriteria();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCriteria}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {watchedCriteria.map((criteria, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                      <span className="flex-1">{criteria}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriteria(criteria)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {watchedTags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 p-0 h-auto"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  {...form.register('additional_notes')}
                  placeholder="Any additional information about this template..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}

// Component Editor Sub-component
interface ComponentEditorProps {
  label: string;
  description: string;
  contentField: keyof TemplateFormInput;
  sourcesField: keyof TemplateFormInput;
  form: any;
  icon: React.ReactNode;
}

function ComponentEditor({
  label,
  description,
  contentField,
  sourcesField,
  form,
  icon,
}: ComponentEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={contentField as string}>Content *</Label>
          <Textarea
            id={contentField as string}
            {...form.register(contentField)}
            placeholder="Enter the content for this component..."
            rows={8}
            className="font-mono text-sm"
          />
          {form.formState.errors[contentField] && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors[contentField].message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
