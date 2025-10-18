import { createClient } from '@/lib/supabase/client';
import { UserProfile, Organization, UserRole } from '@/lib/types';

export class UserService {
  private supabase = createClient();

  /**
   * Get current user profile with organization data
   */
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting current profile:', error);
      return null;
    }
  }

  /**
   * Create user profile during onboarding
   */
  async createProfile(profileData: {
    first_name: string;
    last_name: string;
    title?: string;
    phone?: string;
    organization_id?: string;
  }): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  /**
   * Get users in the same organization
   */
  async getOrganizationUsers(organizationId: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching organization users:', error);
      return [];
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    }
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      await this.supabase
        .from('user_profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  }
}

// Export singleton instance
export const userService = new UserService();