import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { canAccessModule } from "@/lib/departmentAccess";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
}

interface DemoUser {
  id: string;
  email: string;
  role: string;
  name: string;
  department?: string;
}

interface UserProfile {
  department: string | null;
}

type AppRole = "ceo_coo" | "manager" | "executive";

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract module ID from the current path
  const getModuleFromPath = (path: string): string | null => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    return segments[0];
  };

  useEffect(() => {
    // Check for demo mode
    const demoMode = localStorage.getItem('demoMode');
    const currentUser = localStorage.getItem('currentUser');

    const touchLastSeen = async (userId: string) => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', userId);
      } catch (e) {
        // Don't block navigation if this fails
        console.warn('Failed to update last_seen', e);
      }
    };

    let heartbeatTimer: number | null = null;

    const startHeartbeat = (userId: string) => {
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      // update immediately + every 60s while user is active in the portal
      void touchLastSeen(userId);
      heartbeatTimer = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          void touchLastSeen(userId);
        }
      }, 60_000);
    };

    const stopHeartbeat = () => {
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        void touchLastSeen(user.id);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    if (demoMode === 'true' && currentUser) {
      try {
        const user = JSON.parse(currentUser);
        setDemoUser(user);

        // Check department-based access control for demo users
        const moduleId = getModuleFromPath(location.pathname);
        if (moduleId && user.department) {
          const hasAccess = canAccessModule(user.department, moduleId);
          if (!hasAccess) {
            toast.error(`You don't have access to this module`);
            navigate("/user-dashboard");
            setLoading(false);
            return;
          }
        }

        setLoading(false);
        return;
      } catch {
        // Invalid stored user data, clear it
        localStorage.removeItem('demoMode');
        localStorage.removeItem('currentUser');
      }
    }

    // Check Supabase session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (!session?.user) {
        stopHeartbeat();
        setLoading(false);
        navigate("/auth");
        return;
      }

      startHeartbeat(session.user.id);

      // Fetch user profile for department-based access
      const { data: profile } = await supabase
        .from('profiles')
        .select('department')
        .eq('user_id', session.user.id)
        .single();

      setUserProfile(profile);

      // Check if user is CEO/COO - they have access to all modules
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      const isCeoCoo = roleData?.role === 'ceo_coo';

      // Check module access - CEO/COO bypasses department restrictions
      const moduleId = getModuleFromPath(location.pathname);
      if (moduleId && !isCeoCoo && profile?.department) {
        const hasAccess = canAccessModule(profile.department, moduleId);
        if (!hasAccess) {
          toast.error(`You don't have access to this module`);
          navigate("/user-dashboard");
          return;
        }
      }

      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (!session?.user) {
          stopHeartbeat();
          setLoading(false);
          navigate("/auth");
          return;
        }

        startHeartbeat(session.user.id);

        // Fetch profile and role on auth change
        setTimeout(async () => {
          const [profileResult, roleResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('department')
              .eq('user_id', session.user.id)
              .single(),
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single()
          ]);

          const profile = profileResult.data;
          const isCeoCoo = roleResult.data?.role === 'ceo_coo';

          setUserProfile(profile);

          const moduleId = getModuleFromPath(location.pathname);
          if (moduleId && !isCeoCoo && profile?.department) {
            const hasAccess = canAccessModule(profile.department, moduleId);
            if (!hasAccess) {
              toast.error(`You don't have access to this module`);
              navigate("/user-dashboard");
            }
          }
          setLoading(false);
        }, 0);
      }
    );

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopHeartbeat();
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow access if demo user is logged in or valid Supabase user
  if (demoUser || user) {
    return <>{children}</>;
  }

  return null;
};