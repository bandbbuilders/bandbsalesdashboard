import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { canAccessModule } from "@/lib/departmentAccess";
import { toast } from "sonner";
import ChatWidget from "@/components/chat/ChatWidget";

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
  position?: string | null;
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

    // Check Supabase session FIRST; only fall back to demo mode if no session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If there's an active Supabase session, ignore demo mode leftovers
      if (session?.user) {
        if (demoMode === 'true') {
          localStorage.removeItem('demoMode');
          localStorage.removeItem('currentUser');
        }

        setDemoUser(null);
        setUser(session.user);
        startHeartbeat(session.user.id);

        // Fetch user profile for department-based access
        // Fetch user profile for department-based access
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('department, position')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setLoading(false);
          return;
        }

        setUserProfile(profile);

        // Fetch role from user_roles table
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // CEO/COO has access to everything
        const ADMIN_IDS = [
          "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0", // Sara Memon
          "fab190bd-3c71-43e8-9385-3ec66044e501", // Zain Sarwar
          "e91f0415-009a-4712-97e1-c70d1c29e6f9", // Zia Shahid
          "a1248bc9-86ba-44cc-9772-2df754d4db91"  // Hamna Malik
        ];

        const isCeoCoo = (roleData?.role === 'ceo_coo') ||
          ADMIN_IDS.includes(session.user.id) ||
          profile?.position === 'CEO/COO' ||
          profile?.department === 'Management';

        // Debug logging
        console.log('AuthGuard - Role check:', {
          userId: session.user.id,
          roleData: roleData?.role,
          isCeoCoo,
        });

        // CEO/COO has access to everything
        if (isCeoCoo) {
          console.log('AuthGuard - CEO/COO detected, granting full access');
          setLoading(false);
          return;
        }

        // For non-CEO/COO users, check department-based access (including user overrides)
        const moduleId = getModuleFromPath(location.pathname);
        if (moduleId) { // Check access even if department is null, to allow for overrides
          const hasAccess = canAccessModule(profile?.department || null, moduleId, session.user.id);
          console.log('AuthGuard - Module access check:', { moduleId, department: profile?.department, userId: session.user.id, hasAccess });
          if (!hasAccess) {
            toast.error(`You don't have access to this module`);
            navigate('/user-dashboard');
            return;
          }
        }

        setLoading(false);
        return;
      }

      // No Supabase session -> allow demo mode if enabled
      setUser(null);
      stopHeartbeat();

      if (demoMode === 'true' && currentUser) {
        try {
          const parsed = JSON.parse(currentUser);
          setDemoUser(parsed);

          const moduleId = getModuleFromPath(location.pathname);
          if (moduleId) { // Check access even if department is null, to allow for overrides
            // Include user-specific overrides for demo users as well
            const hasAccess = canAccessModule(parsed.department || null, moduleId, parsed.id);
            if (!hasAccess) {
              toast.error(`You don't have access to this module`);
              navigate('/user-dashboard');
              setLoading(false);
              return;
            }
          }

          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('demoMode');
          localStorage.removeItem('currentUser');
        }
      }

      setLoading(false);
      navigate('/auth');
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
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('department, position')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile on auth change:', profileError);
            setLoading(false);
            return;
          }

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const ADMIN_IDS = [
            "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0", // Sara Memon
            "fab190bd-3c71-43e8-9385-3ec66044e501", // Zain Sarwar
            "e91f0415-009a-4712-97e1-c70d1c29e6f9", // Zia Shahid
            "a1248bc9-86ba-44cc-9772-2df754d4db91"  // Hamna Malik
          ];

          const isCeoCoo = (roleData?.role === 'ceo_coo') || ADMIN_IDS.includes(session.user.id);

          setUserProfile(profile);

          // CEO/COO has access to everything
          if (isCeoCoo) {
            console.log('AuthGuard (onAuthStateChange) - CEO/COO detected, granting full access');
            setLoading(false);
            return;
          }

          const moduleId = getModuleFromPath(location.pathname);
          if (moduleId) { // Check access even if department is null, to allow for overrides
            const hasAccess = canAccessModule(profile?.department || null, moduleId, session.user.id);
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
    return (
      <>
        {children}
        <ChatWidget />
      </>
    );
  }

  return null;
};