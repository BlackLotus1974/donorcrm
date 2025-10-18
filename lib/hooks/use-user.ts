'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { userService } from '@/lib/services/user-service';
import { UserProfile, UserRole } from '@/lib/types';

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  updateRole: (userId: string, role: UserRole) => Promise<boolean>;
  hasRole: (requiredRoles: UserRole | UserRole[]) => boolean;
  canPerformAction: (action: string) => boolean;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const refreshProfile = useCallback(async () => {
    try {
      setError(null);
      const userProfile = await userService.getCurrentProfile();
      setProfile(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      setError(null);
      const updatedProfile = await userService.updateProfile(updates);
      if (updatedProfile) {
        setProfile(updatedProfile);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  }, []);

  const updateRole = useCallback(async (userId: string, role: UserRole): Promise<boolean> => {
    try {
      setError(null);
      const success = await userService.updateUserRole(userId, role);
      if (success) {
        // If updating current user's role, refresh profile
        if (userId === user?.id) {
          await refreshProfile();
        }
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      return false;
    }
  }, [user?.id, refreshProfile]);

  const hasRole = useCallback((requiredRoles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(profile.role);
  }, [profile]);

  const canPerformAction = useCallback((action: string): boolean => {
    if (!profile) return false;
    
    const actionPermissions: Record<string, UserRole[]> = {
      'create_donor': ['user', 'manager', 'admin'],
      'edit_donor': ['user', 'manager', 'admin'],
      'delete_donor': ['manager', 'admin'],
      'create_campaign': ['manager', 'admin'],
      'edit_campaign': ['manager', 'admin'],
      'delete_campaign': ['admin'],
      'manage_users': ['admin'],
      'manage_organization': ['admin'],
      'view_reports': ['viewer', 'user', 'manager', 'admin'],
      'export_data': ['manager', 'admin'],
      'import_data': ['manager', 'admin']
    };

    const requiredRoles = actionPermissions[action];
    return requiredRoles ? hasRole(requiredRoles) : false;
  }, [profile, hasRole]);

  // Initialize user and profile
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Get profile if user is authenticated
        if (currentUser) {
          await refreshProfile();
          // Update last active timestamp
          userService.updateLastActive().catch(console.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize user');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshProfile();
        userService.updateLastActive().catch(console.error);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, refreshProfile]);

  // Listen for real-time profile updates
  useEffect(() => {
    if (!user) return;

    const profileSubscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`
        },
        () => {
          refreshProfile();
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
    };
  }, [user, supabase, refreshProfile]);

  return {
    user,
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    updateRole,
    hasRole,
    canPerformAction
  };
}