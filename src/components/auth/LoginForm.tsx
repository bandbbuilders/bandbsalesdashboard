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

export const LoginForm = () => {
  const [email, setEmail] = useState("");
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
      // Simple dummy admin account - no Supabase auth required
      if (email === "admin" && password === "admin123") {
        toast({
          title: "Login successful",
          description: "Welcome back, Admin!",
        });
        navigate("/sales");
        return;
      }

      // Check for SuperAdmin account
      if (email === "admin" && password === "AbdullahShah@123") {
        toast({
          title: "Login successful", 
          description: "Welcome back, SuperAdmin!",
        });
        navigate("/sales");
        return;
      }

      // Check for specific demo accounts
      if (email === "manager@B&Bbuilders" && password === "manager") {
        // Sign in with Supabase Auth using a real account or create mock session
        const { error } = await supabase.auth.signInWithPassword({
          email: "manager@demo.com", // Using a standard email format
          password: "manager123"
        });

        if (error) {
          // If account doesn't exist, sign up first
          await supabase.auth.signUp({
            email: "manager@demo.com",
            password: "manager123",
            options: { emailRedirectTo: `${window.location.origin}/` }
          });
          
          await supabase.auth.signInWithPassword({
            email: "manager@demo.com",
            password: "manager123"
          });
        }

        toast({
          title: "Login successful",
          description: "Welcome back, Manager!",
        });
        navigate("/crm");
        return;
      }

      if (email === "Umer@B&Bbuilders" && password === "Umer@B&B") {
        const { error } = await supabase.auth.signInWithPassword({
          email: "umer@demo.com",
          password: "umer123"
        });

        if (error) {
          await supabase.auth.signUp({
            email: "umer@demo.com",
            password: "umer123",
            options: { emailRedirectTo: `${window.location.origin}/` }
          });
          
          await supabase.auth.signInWithPassword({
            email: "umer@demo.com",
            password: "umer123"
          });
        }

        toast({
          title: "Login successful",
          description: "Welcome back, Umer!",
        });
        navigate("/crm");
        return;
      }

      // Check if user is admin for sales management access
      if (email.includes("admin")) {
        const { error } = await supabase.auth.signInWithPassword({
          email: "admin@demo.com",
          password: "admin123"
        });

        if (error) {
          await supabase.auth.signUp({
            email: "admin@demo.com",
            password: "admin123",
            options: { emailRedirectTo: `${window.location.origin}/` }
          });
          
          await supabase.auth.signInWithPassword({
            email: "admin@demo.com",
            password: "admin123"
          });
        }

        toast({
          title: "Login successful",
          description: "Welcome back, Admin!",
        });
        navigate("/sales");
        return;
      }

      setError("Access denied. Please use authorized credentials.");
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials or access denied");
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
          <CardTitle className="text-2xl">Sales Management</CardTitle>
          <CardDescription>
            Sign in to access your sales dashboard
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
              <Label htmlFor="email">Username/Email</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your username or email"
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
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
};