import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'ceo_coo' | 'manager' | 'executive' | 'hr' | 'admin';

interface UserRoleData {
  role: AppRole | null;
  isLoading: boolean;
  error: string | null;
  hasRole: (role: AppRole) => boolean;
  isCeoCoo: boolean;
  isManager: boolean;
  isExecutive: boolean;
  isHR: boolean;
  isAdmin: boolean;
}

export const useUserRole = (userId?: string): UserRoleData => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      let targetUserId = userId;

      if (!targetUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          targetUserId = session.user.id;
        } else {
          setIsLoading(false);
          return;
        }
      }

      // Hardcoded check for Sara Memon and Zain Sarwar (COO/CEO)
      const ADMIN_IDS = [
        "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0", // Sara Memon
        "fab190bd-3c71-43e8-9385-3ec66044e501"  // Zain Sarwar
      ];

      if (ADMIN_IDS.includes(targetUserId)) {
        setRole('ceo_coo');
        setIsLoading(false);
        return;
      }

      try {
        // Query the user_roles table
        const { data, error: queryError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (queryError) throw queryError;

        setRole((data?.role as AppRole) || null);
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
    isHR: role === 'hr',
    isAdmin: role === 'admin',
  };
};

// Function to assign a role to a user (typically done by admin/CEO)
export const assignUserRole = async (userId: string, role: AppRole) => {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role } as any, { onConflict: 'user_id' });

  if (error) throw error;
  return true;
};

// Function to get team members for a manager (by department)
export const getTeamMembersByDepartment = async (department: string, excludeProfileId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, position, department')
    .eq('department', department)
    .eq('position', 'Executive')
    .neq('id', excludeProfileId);

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
