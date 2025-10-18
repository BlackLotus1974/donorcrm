import { createClient } from '@/lib/supabase/client';
import { Donor, DonorFormData, PaginatedResponse } from '@/lib/types';

export interface DonorFilters {
  search?: string;
  status?: string[];
  giving_level?: string[];
  assigned_to?: string;
  tags?: string[];
  created_after?: string;
  created_before?: string;
  // Geographic filters
  country?: string[];
  state?: string[];
  city?: string[];
}

export interface DonorSortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export class DonorService {
  private supabase = createClient();

  /**
   * Get donors with pagination, search, and filtering
   */
  async getDonors(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters?: DonorFilters,
    sort?: DonorSortOptions
  ): Promise<PaginatedResponse<Donor>> {
    try {
      let query = this.supabase
        .from('donors')
        .select(`
          *,
          assigned_user:user_profiles!donors_assigned_to_fkey(
            id,
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId);

      // Apply search
      if (filters?.search) {
        const searchTerm = filters.search.trim();
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,employer.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters?.giving_level?.length) {
        query = query.in('giving_level', filters.giving_level);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      // Apply geographic filters
      if (filters?.country?.length) {
        query = query.in('country', filters.country);
      }

      if (filters?.state?.length) {
        query = query.in('state', filters.state);
      }

      if (filters?.city?.length) {
        query = query.in('city', filters.city);
      }

      // Apply sorting
      if (sort) {
        if (sort.field === 'name') {
          query = query.order('first_name', { ascending: sort.direction === 'asc' })
                      .order('last_name', { ascending: sort.direction === 'asc' });
        } else {
          query = query.order(sort.field, { ascending: sort.direction === 'asc' });
        }
      } else {
        // Default sort by last name, first name
        query = query.order('last_name', { ascending: true })
                    .order('first_name', { ascending: true });
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
      console.error('Error fetching donors:', error);
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
   * Get a single donor by ID
   */
  async getDonor(donorId: string): Promise<Donor | null> {
    try {
      const { data, error } = await this.supabase
        .from('donors')
        .select(`
          *,
          assigned_user:user_profiles!donors_assigned_to_fkey(
            id,
            first_name,
            last_name
          ),
          created_user:user_profiles!donors_created_by_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', donorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching donor:', error);
      return null;
    }
  }

  /**
   * Create a new donor
   */
  async createDonor(organizationId: string, donorData: DonorFormData): Promise<Donor | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Fields to exclude (not in database schema - they're part of communication_preferences)
      const excludeFields = ['email_opt_in', 'phone_opt_in', 'mail_opt_in', 'newsletter_opt_in'];

      // Clean up the data: convert empty strings to null for optional fields
      const cleanedData: any = {};
      for (const [key, value] of Object.entries(donorData)) {
        // Skip fields that don't exist in the database
        if (excludeFields.includes(key)) {
          continue;
        }

        // Convert empty strings to null, except for required fields
        if (value === '' && !['first_name', 'last_name'].includes(key)) {
          cleanedData[key] = null;
        } else if (value === undefined) {
          cleanedData[key] = null;
        } else {
          cleanedData[key] = value;
        }
      }

      const donorRecord = {
        organization_id: organizationId,
        ...cleanedData,
        created_by: user.id,
        updated_by: user.id
      };

      console.log('Creating donor with data:', JSON.stringify(donorRecord, null, 2));

      const { data, error } = await this.supabase
        .from('donors')
        .insert(donorRecord)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full_error: error
        }, null, 2));
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating donor:', error);
      return null;
    }
  }

  /**
   * Update an existing donor
   */
  async updateDonor(donorId: string, updates: Partial<DonorFormData>): Promise<Donor | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Fields to exclude (not in database schema - they're part of communication_preferences)
      const excludeFields = ['email_opt_in', 'phone_opt_in', 'mail_opt_in', 'newsletter_opt_in'];

      // Clean up the data: convert empty strings to null for optional fields
      const cleanedData: any = {};
      for (const [key, value] of Object.entries(updates)) {
        // Skip fields that don't exist in the database
        if (excludeFields.includes(key)) {
          continue;
        }

        // Convert empty strings to null, except for required fields
        if (value === '' && !['first_name', 'last_name'].includes(key)) {
          cleanedData[key] = null;
        } else if (value === undefined) {
          cleanedData[key] = null;
        } else {
          cleanedData[key] = value;
        }
      }

      console.log('Updating donor with data:', JSON.stringify(cleanedData, null, 2));

      const { data, error } = await this.supabase
        .from('donors')
        .update({
          ...cleanedData,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', donorId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }, null, 2));
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error updating donor:', error);
      return null;
    }
  }

  /**
   * Delete a donor (soft delete by updating status)
   */
  async deleteDonor(donorId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('donors')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', donorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting donor:', error);
      return false;
    }
  }

  /**
   * Get donor statistics for an organization
   */
  async getDonorStats(organizationId: string) {
    try {
      // Total active donors
      const { count: totalDonors } = await this.supabase
        .from('donors')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      // New donors this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { count: newDonors } = await this.supabase
        .from('donors')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .gte('created_at', thisMonth.toISOString());

      // Total lifetime giving
      const { data: givingData } = await this.supabase
        .from('donors')
        .select('total_lifetime_giving')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const totalGiving = givingData?.reduce((sum, donor) => 
        sum + (donor.total_lifetime_giving || 0), 0
      ) || 0;

      // Average gift size
      const averageGift = totalDonors ? totalGiving / totalDonors : 0;

      // Donors by giving level
      const { data: givingLevels } = await this.supabase
        .from('donors')
        .select('giving_level')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const levelCounts = givingLevels?.reduce((acc, donor) => {
        const level = donor.giving_level || 'unassigned';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalDonors: totalDonors || 0,
        newDonors: newDonors || 0,
        totalGiving,
        averageGift,
        givingLevels: levelCounts
      };
    } catch (error) {
      console.error('Error fetching donor statistics:', error);
      return {
        totalDonors: 0,
        newDonors: 0,
        totalGiving: 0,
        averageGift: 0,
        givingLevels: {}
      };
    }
  }

  /**
   * Get unique tags from all donors in organization
   */
  async getAvailableTags(organizationId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('donors')
        .select('tags')
        .eq('organization_id', organizationId)
        .not('tags', 'is', null);

      if (error) throw error;

      const allTags = data?.flatMap(donor => donor.tags || []) || [];
      return [...new Set(allTags)].sort();
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  }

  /**
   * Get unique countries from donors in organization
   */
  async getAvailableCountries(organizationId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('donors')
        .select('country')
        .eq('organization_id', organizationId)
        .not('country', 'is', null);

      if (error) throw error;

      const countries = [...new Set(data?.map(d => d.country).filter(Boolean) || [])];
      return countries.sort();
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  /**
   * Get unique states from donors in organization
   */
  async getAvailableStates(organizationId: string, country?: string): Promise<string[]> {
    try {
      let query = this.supabase
        .from('donors')
        .select('state')
        .eq('organization_id', organizationId)
        .not('state', 'is', null);

      if (country) {
        query = query.eq('country', country);
      }

      const { data, error } = await query;

      if (error) throw error;

      const states = [...new Set(data?.map(d => d.state).filter(Boolean) || [])];
      return states.sort();
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  }

  /**
   * Get unique cities from donors in organization
   */
  async getAvailableCities(organizationId: string, state?: string): Promise<string[]> {
    try {
      let query = this.supabase
        .from('donors')
        .select('city')
        .eq('organization_id', organizationId)
        .not('city', 'is', null);

      if (state) {
        query = query.eq('state', state);
      }

      const { data, error } = await query;

      if (error) throw error;

      const cities = [...new Set(data?.map(d => d.city).filter(Boolean) || [])];
      return cities.sort();
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  /**
   * Bulk update donors
   */
  async bulkUpdateDonors(donorIds: string[], updates: Partial<DonorFormData>): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await this.supabase
        .from('donors')
        .update({
          ...updates,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .in('id', donorIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk updating donors:', error);
      return false;
    }
  }

  /**
   * Export donors to CSV format
   */
  async exportDonors(organizationId: string, filters?: DonorFilters): Promise<string> {
    try {
      // Get all donors (no pagination for export)
      const result = await this.getDonors(organizationId, 1, 10000, filters);
      
      if (result.data.length === 0) {
        return 'No donors found for export';
      }

      // Create CSV header
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Address',
        'City',
        'State',
        'Postal Code',
        'Country',
        'Employer',
        'Job Title',
        'Donor Type',
        'Giving Level',
        'Status',
        'Total Lifetime Giving',
        'Last Gift Date',
        'Tags',
        'Created Date'
      ];

      // Create CSV rows
      const rows = result.data.map(donor => [
        donor.first_name,
        donor.last_name,
        donor.email || '',
        donor.phone || '',
        donor.address_line1 || '',
        donor.city || '',
        donor.state || '',
        donor.postal_code || '',
        donor.country,
        donor.employer || '',
        donor.job_title || '',
        donor.donor_type,
        donor.giving_level || '',
        donor.status,
        donor.total_lifetime_giving.toString(),
        donor.last_gift_date || '',
        (donor.tags || []).join('; '),
        new Date(donor.created_at).toLocaleDateString()
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting donors:', error);
      return 'Error occurred during export';
    }
  }
}

// Export singleton instance
export const donorService = new DonorService();