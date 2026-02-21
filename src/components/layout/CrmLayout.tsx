import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Users, LayoutDashboard, Plus, Clock, LogOut, Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

type LayoutUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export const CrmLayout = () => {
  const [user, setUser] = useState<LayoutUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      // Demo mode (legacy)
      const demoMode = localStorage.getItem("demoMode");
      const currentUser = localStorage.getItem("currentUser");
      if (demoMode === "true" && currentUser) {
        try {
          const parsed = JSON.parse(currentUser);
          setUser({ id: parsed.id, name: parsed.name, email: parsed.email, role: parsed.role });
          return;
        } catch {
          localStorage.removeItem("demoMode");
          localStorage.removeItem("currentUser");
        }
      }

      // Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email,role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setUser({
        id: session.user.id,
        name: profile?.full_name ?? session.user.email ?? "User",
        email: profile?.email ?? session.user.email ?? "",
        role: profile?.role ?? "user",
      });
    };

    init();
  }, [navigate]);

  const handleLogout = async () => {
    const demoMode = localStorage.getItem("demoMode");
    if (demoMode === "true") {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("demoMode");
      navigate("/auth");
      return;
    }

    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navigation = [
    { name: "Dashboard", href: "/crm", icon: LayoutDashboard },
    { name: "Leads", href: "/crm/leads", icon: Users },
    { name: "New Lead", href: "/crm/leads/new", icon: Plus },
    { name: "Reminders", href: "/crm/reminders", icon: Clock },
  ];

  const isActive = (href: string) => {
    if (href === "/crm") return location.pathname === "/crm";
    return location.pathname.startsWith(href);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold hidden sm:block">B&B CRM</h1>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/user-dashboard")} title="Go to Dashboard">
              <Home className="h-4 w-4" />
            </Button>
            <NotificationBell userName={user?.name} userId={user?.id} />
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="w-fit">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-14">
          <div className="flex-1 overflow-y-auto border-r bg-background">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive(item.href) && "bg-secondary text-secondary-foreground"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col bg-background border-r">
            <div className="flex h-14 items-center px-4 border-b">
              <Users className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold">B&B CRM</span>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      navigate(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64">
          <div className="container max-w-7xl mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};