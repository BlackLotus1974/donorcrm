'use client';

import { useState, useEffect, useCallback } from 'react';
import { organizationService } from '@/lib/services/organization-service';
import { Organization, OrganizationFormData, UserProfile } from '@/lib/types';

interface OrganizationStats {
  donorCount: number;
  userCount: number;
  totalGiving: number;
  recentDonors: number;
}

interface UseOrganizationReturn {
  organization: Organization | null;
  stats: OrganizationStats | null;
  loading: boolean;
  error: string | null;
  createOrganization: (data: OrganizationFormData) => Promise<Organization | null>;
  updateOrganization: (updates: Partial<Organization>) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<string | null>;
  refreshStats: () => Promise<void>;
  isSlugAvailable: (slug: string) => Promise<boolean>;
}

export function useOrganization(userProfile?: UserProfile | null): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrganization = useCallback(async (data: OrganizationFormData): Promise<Organization | null> => {
    try {
      setError(null);
      setLoading(true);
      const newOrg = await organizationService.createOrganization(data);
      if (newOrg) {
        setOrganization(newOrg);
      }
      return newOrg;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrganization = useCallback(async (updates: Partial<Organization>): Promise<boolean> => {
    if (!organization) return false;

    try {
      setError(null);
      setLoading(true);
      const updatedOrg = await organizationService.updateOrganization(organization.id, updates);
      if (updatedOrg) {
        setOrganization(updatedOrg);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
      return false;
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    if (!organization) return null;

    try {
      setError(null);
      const logoUrl = await organizationService.uploadLogo(organization.id, file);
      if (logoUrl) {
        setOrganization(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      }
      return logoUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
      return null;
    }
  }, [organization]);

  const refreshStats = useCallback(async () => {
    if (!organization) return;

    try {
      setError(null);
      const orgStats = await organizationService.getOrganizationStats(organization.id);
      setStats(orgStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    }
  }, [organization]);

  const isSlugAvailable = useCallback(async (slug: string): Promise<boolean> => {
    try {
      return await organizationService.isSlugAvailable(slug, organization?.id);
    } catch (err) {
      console.error('Error checking slug availability:', err);
      return false;
    }
  }, [organization]);

  // Load organization when user profile changes
  useEffect(() => {
    const loadOrganization = async () => {
      if (!userProfile?.organization_id) {
        setOrganization(null);
        setStats(null);
        return;
      }

      // If organization is already loaded from profile, use it
      if (userProfile.organization) {
        setOrganization(userProfile.organization as Organization);
        return;
      }

      try {
        setError(null);
        setLoading(true);
        const org = await organizationService.getOrganization(userProfile.organization_id);
        setOrganization(org);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [userProfile]);

  // Load stats when organization changes
  useEffect(() => {
    if (organization) {
      refreshStats();
    }
  }, [organization, refreshStats]);

  return {
    organization,
    stats,
    loading,
    error,
    createOrganization,
    updateOrganization,
    uploadLogo,
    refreshStats,
    isSlugAvailable
  };
}