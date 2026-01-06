import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Demo user accounts with different roles - using existing UUIDs from database
const DEMO_ACCOUNTS = {
  superadmin: {
    email: "superadmin",
    password: "super2025",
    role: "superadmin",
    name: "Super Administrator",
    id: "11111111-1111-1111-1111-111111111111",
    department: "Accounting" // Full access
  },
  admin: {
    email: "admin",
    password: "admin2025", 
    role: "admin",
    name: "Admin User",
    id: "11111111-1111-1111-1111-111111111111",
    department: "Accounting"
  },
  manager: {
    email: "manager",
    password: "manager2025",
    role: "manager", 
    name: "Manager User",
    id: "33333333-3333-3333-3333-333333333333",
    department: "Marketing"
  },
  agent: {
    email: "agent",
    password: "agent2025",
    role: "agent",
    name: "Sales Agent", 
    id: "22222222-2222-2222-2222-222222222222",
    department: "Sales"
  }
};

export const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Check demo accounts
      const account = Object.values(DEMO_ACCOUNTS).find(
        acc => acc.email === username && acc.password === password
      );

      if (account) {
        // Ensure demo user exists in database
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', account.id)
          .maybeSingle();

        const demoEmail = account.role === 'superadmin' ? 'admin@example.com' : `${account.role}@example.com`;
        
        if (!existingUser) {
          // Create demo user in database
          await supabase
            .from('users')
            .insert({
              id: account.id,
              email: demoEmail,
              name: account.name,
              role: account.role
            });
        }

        // For demo accounts, we'll use localStorage to track the logged in user
        localStorage.setItem('currentUser', JSON.stringify({
          id: account.id,
          email: demoEmail,
          role: account.role,
          name: account.name,
          department: account.department
        }));
        localStorage.setItem('demoMode', 'true');

        toast({
          title: "Login successful",
          description: `Welcome back, ${account.name}!`,
        });
        
        navigate("/user-dashboard");
        return;
      }

      // Try Supabase authentication as fallback
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password
      });

      if (error) {
        setError("Invalid username or password. Please use one of the demo accounts.");
        return;
      }

      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/user-dashboard");
        return;
      }

      setError("Invalid username or password.");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">B&B Sales Dashboard</CardTitle>
          <CardDescription>
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>

            {/* Demo Accounts Info */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Demo Accounts:</h4>
              <div className="space-y-2 text-xs">
                <div><strong>SuperAdmin:</strong> superadmin / super2025</div>
                <div><strong>Admin:</strong> admin / admin2025</div>
                <div><strong>Manager:</strong> manager / manager2025</div>
                <div><strong>Agent:</strong> agent / agent2025</div>
              </div>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
};