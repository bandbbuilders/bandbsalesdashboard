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
        setLoading(false);
        navigate("/auth");
        return;
      }

      // Fetch user profile for department-based access
      const { data: profile } = await supabase
        .from('profiles')
        .select('department')
        .eq('user_id', session.user.id)
        .single();

      setUserProfile(profile);
      
      // Check module access
      const moduleId = getModuleFromPath(location.pathname);
      if (moduleId && profile?.department) {
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
          setLoading(false);
          navigate("/auth");
          return;
        }
        
        // Fetch profile on auth change
        if (session?.user) {
          setTimeout(() => {
            supabase
              .from('profiles')
              .select('department')
              .eq('user_id', session.user.id)
              .single()
              .then(({ data: profile }) => {
                setUserProfile(profile);
                
                const moduleId = getModuleFromPath(location.pathname);
                if (moduleId && profile?.department) {
                  const hasAccess = canAccessModule(profile.department, moduleId);
                  if (!hasAccess) {
                    toast.error(`You don't have access to this module`);
                    navigate("/user-dashboard");
                  }
                }
                setLoading(false);
              });
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
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