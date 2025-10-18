'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Download,
  Copy,
  Trash2,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  History,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { ContextTemplate, ContextTemplateCollaborator, ContextTemplateVersion, UserProfile, ValidationStatus } from '@/lib/types';
import { contextTemplateService } from '@/lib/services/context-template-service';
import { canPerformAction } from '@/lib/permissions';

interface ContextTemplateDetailProps {
  template: ContextTemplate & {
    created_user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url?: string | null;
    };
    updated_user?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url?: string | null;
    };
    parent_template?: {
      id: string;
      title: string;
    } | null;
  };
  userProfile: UserProfile;
  collaborators: ContextTemplateCollaborator[];
  versions: ContextTemplateVersion[];
}

export default function ContextTemplateDetail({
  template,
  userProfile,
  collaborators,
  versions,
}: ContextTemplateDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = canPerformAction('edit_context_template', userProfile.role);
  const canDelete = canPerformAction('delete_context_template', userProfile.role);
  const canExport = canPerformAction('export_context_template', userProfile.role);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const success = await contextTemplateService.deleteTemplate(template.id);
      if (success) {
        router.push('/context-templates');
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      alert('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = async () => {
    try {
      const cloned = await contextTemplateService.cloneTemplate(template.id, template.organization_id);
      if (cloned) {
        router.push(`/context-templates/${cloned.id}/edit`);
      } else {
        alert('Failed to clone template');
      }
    } catch (error) {
      alert('Failed to clone template');
    }
  };

  const handleExport = async (format: 'json' | 'markdown') => {
    try {
      const data = format === 'json'
        ? await contextTemplateService.exportToJSON(template.id)
        : await contextTemplateService.exportToMarkdown(template.id);

      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/markdown'
      });
      const link = document.createElement('a');
      const fileName = `${template.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert('Failed to export template');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: ValidationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'needs_revision':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ValidationStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_revision':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/context-templates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold">{template.title}</h1>

            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(template.status)}>
                {getStatusIcon(template.status)}
                <span className="ml-1 capitalize">{template.status.replace('_', ' ')}</span>
              </Badge>

              {template.is_template && (
                <Badge variant="secondary">Template</Badge>
              )}

              <Badge variant="outline" className="capitalize">
                {template.scenario_type.replace(/_/g, ' ')}
              </Badge>

              <Badge variant="outline" className="capitalize">
                {template.complexity_level}
              </Badge>

              <Badge variant="outline">
                v{template.version}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/context-templates/${template.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleClone}>
                <Copy className="h-4 w-4 mr-2" />
                Clone Template
              </DropdownMenuItem>

              {canExport && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('markdown')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                </>
              )}

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-700">{template.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Context Components */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <CardTitle>Template Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Purpose</Label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.header.purpose}</p>
              </div>
              <div>
                <Label>Scope</Label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.header.scope}</p>
              </div>
              {template.header.principles && template.header.principles.length > 0 && (
                <div>
                  <Label>Principles</Label>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-1">
                    {template.header.principles.map((principle, i) => (
                      <li key={i}>{principle}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Context Components */}
          {Object.entries(template.components).map(([key, component]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">
                    {key.replace(/_/g, ' ')}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      {component.completeness}% complete
                    </Badge>
                    <Badge variant="outline">
                      Quality: {component.quality_score}/5
                    </Badge>
                    <Badge variant={component.validation_status === 'approved' ? 'default' : 'secondary'}>
                      {component.validation_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm">
                    {component.content || <span className="text-gray-400 italic">No content provided</span>}
                  </pre>
                </div>
                {component.sources && component.sources.length > 0 && (
                  <div className="mt-4">
                    <Label>Sources</Label>
                    <ul className="text-sm text-gray-600 space-y-1 mt-1">
                      {component.sources.map((source, i) => (
                        <li key={i}>• {source}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar - Metadata, Collaborators, Versions */}
        <div className="space-y-6">
          {/* Quality Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {template.quality_assessment?.overall_score.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-gray-500">out of 5.0</div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Completeness</span>
                  <span className="font-medium">{template.quality_assessment?.completeness_score || 0}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clarity</span>
                  <span className="font-medium">{template.quality_assessment?.clarity_score || 0}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy</span>
                  <span className="font-medium">{template.quality_assessment?.accuracy_score || 0}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Effectiveness</span>
                  <span className="font-medium">{template.quality_assessment?.effectiveness_score || 0}/5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collaborators */}
          {collaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Collaborators ({collaborators.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collaborators.slice(0, 5).map((collab) => (
                    <div key={collab.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {collab.user?.first_name} {collab.user?.last_name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{collab.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          {versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {versions.slice(0, 5).map((version) => (
                    <div key={version.id} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{version.version_number}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(version.created_at)}
                        </span>
                      </div>
                      {version.change_summary && (
                        <p className="text-xs text-gray-600 mt-1">{version.change_summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <Label>Created</Label>
                  <p className="text-gray-700">{formatDate(template.created_at)}</p>
                  {template.created_user && (
                    <p className="text-xs text-gray-500">
                      by {template.created_user.first_name} {template.created_user.last_name}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-gray-700">{formatDate(template.updated_at)}</p>
                  {template.updated_user && (
                    <p className="text-xs text-gray-500">
                      by {template.updated_user.first_name} {template.updated_user.last_name}
                    </p>
                  )}
                </div>
                {template.parent_template && (
                  <div>
                    <Label>Parent Template</Label>
                    <p className="text-sm">
                      <Link
                        href={`/context-templates/${template.parent_template.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {template.parent_template.title}
                      </Link>
                    </p>
                  </div>
                )}
                {template.metadata?.tags && template.metadata.tags.length > 0 && (
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.metadata.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component for labels
function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-semibold text-gray-700 block mb-1 ${className || ''}`} {...props}>
      {children}
    </label>
  );
}
