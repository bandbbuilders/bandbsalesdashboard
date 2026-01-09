import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'ceo_coo' | 'manager' | 'executive';

interface UserRoleData {
  role: AppRole | null;
  isLoading: boolean;
  error: string | null;
  hasRole: (role: AppRole) => boolean;
  isCeoCoo: boolean;
  isManager: boolean;
  isExecutive: boolean;
}

export const useUserRole = (userId?: string): UserRoleData => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Query the user_roles table directly using raw SQL via rpc or direct query
        const { data, error: queryError } = await supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (queryError) throw queryError;
        
        const roleData = data as unknown as { role: AppRole } | null;
        setRole(roleData?.role || null);
      } catch (err: any) {
        console.error('Error fetching user role:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  const hasRole = (checkRole: AppRole): boolean => role === checkRole;

  return {
    role,
    isLoading,
    error,
    hasRole,
    isCeoCoo: role === 'ceo_coo',
    isManager: role === 'manager',
    isExecutive: role === 'executive',
  };
};

// Function to assign a role to a user (typically done by admin/CEO)
export const assignUserRole = async (userId: string, role: AppRole) => {
  const { error } = await (supabase as any)
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

  if (error) throw error;
  return true;
};

// Function to get team members for a manager
export const getTeamMembers = async (managerId: string) => {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('manager_id', managerId);

  if (error) throw error;
  return data;
};

// Function to get manager profile
export const getManagerProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  
  const profileData = data as unknown as { manager_id?: string } | null;
  
  if (profileData?.manager_id) {
    const { data: managerProfile, error: managerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileData.manager_id)
      .single();

    if (managerError) throw managerError;
    return managerProfile;
  }
  
  return null;
};
