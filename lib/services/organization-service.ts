import { createClient } from '@/lib/supabase/client';
import { Organization, OrganizationFormData } from '@/lib/types';

export class OrganizationService {
  private supabase = createClient();

  /**
   * Create new organization during onboarding
   */
  async createOrganization(orgData: OrganizationFormData): Promise<Organization | null> {
    try {
      // Use RPC function to bypass RLS and return the created organization
      const { data, error } = await this.supabase.rpc('create_organization_for_user', {
        p_name: orgData.name,
        p_tax_id: orgData.tax_id || null,
        p_phone: orgData.phone || null,
        p_email: orgData.email || null,
        p_website: orgData.website || null,
        p_address: orgData.address || {}
      });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      return data as Organization;
    } catch (error) {
      console.error('Error creating organization:', error);
      return null;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization by slug:', error);
      return null;
    }
  }

  /**
   * Update organization settings
   */
  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating organization:', error);
      return null;
    }
  }

  /**
   * Check if organization slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.length === 0;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string) {
    try {
      // Get donor count
      const { count: donorCount } = await this.supabase
        .from('donors')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      // Get user count
      const { count: userCount } = await this.supabase
        .from('user_profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Get total lifetime giving (will need donations table later)
      // For now, sum from donors table
      const { data: givingData } = await this.supabase
        .from('donors')
        .select('total_lifetime_giving')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const totalGiving = givingData?.reduce((sum, donor) => 
        sum + (donor.total_lifetime_giving || 0), 0
      ) || 0;

      // Get recent donor additions
      const { count: recentDonors } = await this.supabase
        .from('donors')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      return {
        donorCount: donorCount || 0,
        userCount: userCount || 0,
        totalGiving,
        recentDonors: recentDonors || 0
      };
    } catch (error) {
      console.error('Error fetching organization stats:', error);
      return {
        donorCount: 0,
        userCount: 0,
        totalGiving: 0,
        recentDonors: 0
      };
    }
  }

  /**
   * Update organization subscription
   */
  async updateSubscription(
    organizationId: string,
    tier: string,
    endsAt?: Date
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('organizations')
        .update({
          subscription_tier: tier,
          subscription_ends_at: endsAt?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  }

  /**
   * Upload organization logo
   */
  async uploadLogo(organizationId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}/logo.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      // Update organization with logo URL
      await this.updateOrganization(organizationId, { logo_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();