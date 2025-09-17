import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

interface DemoUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for demo mode
    const demoMode = localStorage.getItem('demoMode');
    const currentUser = localStorage.getItem('currentUser');
    
    if (demoMode === 'true' && currentUser) {
      try {
        const user = JSON.parse(currentUser);
        setDemoUser(user);
        setLoading(false);
        
        // Check access control for demo users
        if (location.pathname.startsWith('/sales')) {
          const canAccessSales = user.role === 'superadmin' || user.role === 'admin';
          if (!canAccessSales) {
            navigate("/crm");
            return;
          }
        }
        
        if (location.pathname.startsWith('/crm')) {
          const canAccessCrm = user.role === 'manager' || user.role === 'agent';
          if (!canAccessCrm && user.role !== 'superadmin') {
            navigate("/sales");
            return;
          }
        }
        
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
      setLoading(false);

      if (!session?.user) {
        navigate("/login");
        return;
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (!session?.user) {
          navigate("/login");
          return;
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