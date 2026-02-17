import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Users, Calendar, DollarSign, TrendingUp, LayoutDashboard, FileText, Home, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const HrLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.user.id)
          .maybeSingle();

        setCurrentUser({
          id: session.user.id,
          name: profile?.full_name ?? session.user.email ?? "User"
        });
      }
    };
    init();
  }, []);

  const navItems = [
    { to: "/hr", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/hr/employees", icon: Users, label: "Employees" },
    { to: "/hr/leave", icon: Calendar, label: "Leave Management" },
    { to: "/hr/payroll", icon: DollarSign, label: "Payroll" },
    { to: "/hr/performance", icon: TrendingUp, label: "Performance" },
    { to: "/hr/documents", icon: FileText, label: "Documents" },
    { to: "/hr/fines", icon: AlertTriangle, label: "Fines" },
    { to: "/hr/policies", icon: FileText, label: "Policies" },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-2 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">HR Management</h1>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell userName={currentUser?.name} userId={currentUser?.id} />
              <Button variant="outline" size="sm" asChild>
                <Link to="/user-dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive(item.to, item.exact)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default HrLayout;
