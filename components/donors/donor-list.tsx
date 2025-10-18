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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Users,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { donorService, DonorFilters, DonorSortOptions } from '@/lib/services/donor-service';
import { Donor, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import DonorFilterPanel from '@/components/donors/donor-filter-panel';
import { toast } from 'sonner';

interface DonorListProps {
  organizationId: string;
  initialFilters?: DonorFilters;
  initialPage?: number;
  initialLimit?: number;
  initialSort?: DonorSortOptions;
  userProfile: UserProfile;
  canCreateDonor?: boolean;
}

export default function DonorList({
  organizationId,
  initialFilters = {},
  initialPage = 1,
  initialLimit = 20,
  initialSort = { field: 'name', direction: 'asc' },
  userProfile,
  canCreateDonor = true,
}: DonorListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDonors, setSelectedDonors] = useState<Set<string>>(new Set());

  // Filters and pagination state
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<DonorFilters>(initialFilters);
  const [sort, setSort] = useState<DonorSortOptions>(initialSort);
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');

  // Load donors
  const loadDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await donorService.getDonors(
        organizationId,
        page,
        limit,
        filters,
        sort
      );

      setDonors(result.data);
      setTotalCount(result.count);
      setTotalPages(result.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load donors');
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
    if (filters.status?.length) params.set('status', filters.status.join(','));
    if (filters.giving_level?.length) params.set('giving_level', filters.giving_level.join(','));
    if (filters.assigned_to) params.set('assigned_to', filters.assigned_to);
    if (filters.country?.length) params.set('country', filters.country.join(','));
    if (filters.state?.length) params.set('state', filters.state.join(','));
    if (filters.city?.length) params.set('city', filters.city.join(','));
    if (sort.field !== 'name') params.set('sort', sort.field);
    if (sort.direction !== 'asc') params.set('direction', sort.direction);

    const newURL = `/donors${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newURL, { scroll: false });
  }, [page, limit, filters, sort, router]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search: term || undefined }));
    setPage(1);
  }, []);

  // Handle sort
  const handleSort = useCallback((field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1);
  }, []);

  // Handle selection
  const toggleDonorSelection = useCallback((donorId: string) => {
    setSelectedDonors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(donorId)) {
        newSet.delete(donorId);
      } else {
        newSet.add(donorId);
      }
      return newSet;
    });
  }, []);

  const selectAllDonors = useCallback(() => {
    const allIds = donors.map(donor => donor.id);
    setSelectedDonors(new Set(allIds));
  }, [donors]);

  const clearSelection = useCallback(() => {
    setSelectedDonors(new Set());
  }, []);

  // Export donors
  const handleExport = useCallback(async () => {
    try {
      const csvData = await donorService.exportDonors(organizationId, filters);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `donors-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Donors exported successfully!');
      }
    } catch (err) {
      toast.error('Failed to export donors');
    }
  }, [organizationId, filters]);

  // Effects
  useEffect(() => {
    loadDonors();
  }, [loadDonors]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const canEditDonor = ['user', 'manager', 'admin'].includes(userProfile.role);
  const canDeleteDonor = ['manager', 'admin'].includes(userProfile.role);
  const canExport = ['manager', 'admin'].includes(userProfile.role);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search donors..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <DonorFilterPanel
            organizationId={organizationId}
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setPage(1);
            }}
          />
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link href="/donors/import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Link>
              </Button>
            </>
          )}

          {canCreateDonor && (
            <Button asChild>
              <Link href="/donors/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Donor
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            {loading ? 'Loading...' : `${totalCount} donors found`}
          </span>
          
          {selectedDonors.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedDonors.size} selected
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          )}
        </div>

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

      {/* Donor Cards/Table */}
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
      ) : donors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No donors found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.status?.length || filters.giving_level?.length
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first donor'}
            </p>
            {canCreateDonor && (
              <Button asChild>
                <Link href="/donors/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Donor
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {donors.map((donor) => (
            <Card key={donor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDonors.has(donor.id)}
                      onCheckedChange={() => toggleDonorSelection(donor.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {donor.first_name} {donor.last_name}
                        </h3>
                        {donor.preferred_name && (
                          <span className="text-sm text-gray-500">
                            ({donor.preferred_name})
                          </span>
                        )}
                        <Badge variant={donor.status === 'active' ? 'default' : 'secondary'}>
                          {donor.status}
                        </Badge>
                        {donor.giving_level && (
                          <Badge variant="outline">
                            {donor.giving_level}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          {donor.email && (
                            <span>{donor.email}</span>
                          )}
                          {donor.phone && (
                            <span>{donor.phone}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {donor.employer && (
                            <span>{donor.employer}</span>
                          )}
                          
                          <span>
                            Lifetime: {formatCurrency(donor.total_lifetime_giving)}
                          </span>
                          
                          {donor.last_gift_date && (
                            <span>
                              Last gift: {new Date(donor.last_gift_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {donor.tags && donor.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {donor.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {donor.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{donor.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
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
                        <Link href={`/donors/${donor.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      
                      {canEditDonor && (
                        <DropdownMenuItem asChild>
                          <Link href={`/donors/${donor.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      {canDeleteDonor && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={async () => {
                            if (confirm('Are you sure you want to deactivate this donor?')) {
                              try {
                                const success = await donorService.deleteDonor(donor.id);
                                if (success) {
                                  toast.success('Donor deactivated successfully!');
                                  loadDonors();
                                } else {
                                  toast.error('Failed to deactivate donor');
                                }
                              } catch (error) {
                                toast.error('Failed to deactivate donor');
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
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