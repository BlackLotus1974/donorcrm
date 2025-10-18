'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreHorizontal,
  FileText,
  Eye,
  Edit,
  Copy,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { contextTemplateService, TemplateFilters, TemplateSortOptions } from '@/lib/services/context-template-service';
import { ContextTemplate, UserProfile, ScenarioType, ComplexityLevel, ValidationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { canPerformAction } from '@/lib/permissions';

interface ContextTemplateListProps {
  organizationId: string;
  initialFilters?: TemplateFilters;
  initialPage?: number;
  initialLimit?: number;
  initialSort?: TemplateSortOptions;
  userProfile: UserProfile;
}

export default function ContextTemplateList({
  organizationId,
  initialFilters = {},
  initialPage = 1,
  initialLimit = 20,
  initialSort = { field: 'updated_at', direction: 'desc' },
  userProfile,
}: ContextTemplateListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [templates, setTemplates] = useState<ContextTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters and pagination state
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<TemplateFilters>(initialFilters);
  const [sort, setSort] = useState<TemplateSortOptions>(initialSort);
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await contextTemplateService.getTemplates(
        organizationId,
        page,
        limit,
        filters,
        sort
      );

      setTemplates(result.data);
      setTotalCount(result.count);
      setTotalPages(result.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, limit, filters, sort]);

  // Update URL with current filters and pagination
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (page > 1) params.set('page', page.toString());
    if (limit !== 20) params.set('limit', limit.toString());
    if (filters.search) params.set('search', filters.search);
    if (filters.scenario_type?.length) params.set('scenario_type', filters.scenario_type.join(','));
    if (filters.complexity_level?.length) params.set('complexity_level', filters.complexity_level.join(','));
    if (filters.status?.length) params.set('status', filters.status.join(','));
    if (filters.is_template !== undefined) params.set('is_template', filters.is_template.toString());
    if (sort.field !== 'updated_at') params.set('sort', sort.field);
    if (sort.direction !== 'desc') params.set('direction', sort.direction);

    const newURL = `/context-templates${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newURL, { scroll: false });
  }, [page, limit, filters, sort, router]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search: term || undefined }));
    setPage(1);
  }, []);

  // Export template
  const handleExport = useCallback(async (templateId: string, format: 'json' | 'markdown') => {
    try {
      const data = format === 'json'
        ? await contextTemplateService.exportToJSON(templateId)
        : await contextTemplateService.exportToMarkdown(templateId);

      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/markdown'
      });
      const link = document.createElement('a');
      const template = templates.find(t => t.id === templateId);
      const fileName = `${template?.title.replace(/\s+/g, '-').toLowerCase() || 'template'}-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;

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
      setError('Failed to export template');
    }
  }, [templates]);

  // Clone template
  const handleClone = useCallback(async (templateId: string) => {
    try {
      const cloned = await contextTemplateService.cloneTemplate(templateId, organizationId);
      if (cloned) {
        loadTemplates();
        router.push(`/context-templates/${cloned.id}/edit`);
      } else {
        setError('Failed to clone template');
      }
    } catch (err) {
      setError('Failed to clone template');
    }
  }, [organizationId, loadTemplates, router]);

  // Delete template
  const handleDelete = useCallback(async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const success = await contextTemplateService.deleteTemplate(templateId);
      if (success) {
        loadTemplates();
      } else {
        setError('Failed to delete template');
      }
    } catch (err) {
      setError('Failed to delete template');
    }
  }, [loadTemplates]);

  // Effects
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: ValidationStatus) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'review':
        return 'secondary';
      case 'needs_revision':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ValidationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'review':
        return <Clock className="h-3 w-3" />;
      case 'needs_revision':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const canCreate = canPerformAction('create_context_template', userProfile.role);
  const canEdit = canPerformAction('edit_context_template', userProfile.role);
  const canDelete = canPerformAction('delete_context_template', userProfile.role);
  const canExport = canPerformAction('export_context_template', userProfile.role);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Button asChild>
              <Link href="/context-templates/new">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {loading ? 'Loading...' : `${totalCount} templates found`}
        </span>

        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Template Cards */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.scenario_type?.length || filters.status?.length
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first context template'}
            </p>
            {canCreate && (
              <Button asChild>
                <Link href="/context-templates/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        <Link
                          href={`/context-templates/${template.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {template.title}
                        </Link>
                      </h3>

                      <Badge variant={getStatusVariant(template.status)} className="flex items-center gap-1">
                        {getStatusIcon(template.status)}
                        {template.status}
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
                    </div>

                    {template.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Version {template.version}</span>
                      <span>Updated {formatDate(template.updated_at)}</span>
                      {template.created_user && (
                        <span>
                          by {template.created_user.first_name} {template.created_user.last_name}
                        </span>
                      )}
                      <span>
                        Quality: {template.quality_assessment?.overall_score || 0}/5
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild>
                        <Link href={`/context-templates/${template.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>

                      {canEdit && (
                        <DropdownMenuItem asChild>
                          <Link href={`/context-templates/${template.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => handleClone(template.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone
                      </DropdownMenuItem>

                      {canExport && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleExport(template.id, 'json')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export as JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(template.id, 'markdown')}>
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
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-10"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
