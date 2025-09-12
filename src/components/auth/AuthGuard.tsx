import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for demo mode flag in localStorage
    const demoMode = localStorage.getItem('demoMode');
    if (demoMode === 'true') {
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session?.user) {
        navigate("/login");
        return;
      }

      // Check access control for Sales Management (admin only)
      if (location.pathname.startsWith('/sales')) {
        const isAdmin = session.user.email === 'admin@demo.com' || session.user.email === 'superadmin@demo.com';
        if (!isAdmin) {
          navigate("/login");
          return;
        }
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

        // Check access control for Sales Management (admin only)
        if (location.pathname.startsWith('/sales')) {
          const isAdmin = session.user.email === 'admin@demo.com' || session.user.email === 'superadmin@demo.com';
          if (!isAdmin) {
            navigate("/login");
            return;
          }
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

  // Allow access in demo mode or with valid user
  if (isDemoMode || user) {
    return <>{children}</>;
  }

  return null;
};