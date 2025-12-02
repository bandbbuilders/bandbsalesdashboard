import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, TrendingUp, Users, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CORRECT_PASSWORD = "b&bcom1";

const CommissionManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCommissions();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to Commission Management",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          sale:sales(
            id,
            unit_number,
            unit_total_price,
            customer:customers(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast({
        title: "Error",
        description: "Failed to load commissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Commission Management</CardTitle>
            <CardDescription>
              Enter password to access commission data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter password"
              />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              Access Commission Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.total_amount.toString()), 0);
  const released70 = commissions.reduce((sum, c) => 
    c.status_70_percent === 'released' ? sum + parseFloat(c.amount_70_percent.toString()) : sum, 0);
  const released30 = commissions.reduce((sum, c) => 
    c.status_30_percent === 'released' ? sum + parseFloat(c.amount_30_percent.toString()) : sum, 0);
  const totalReleased = released70 + released30;
  const totalPending = totalCommissions - totalReleased;

  // Group by recipient type
  const byType = commissions.reduce((acc: Record<string, number>, c: any) => {
    const type = c.recipient_type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += parseFloat(c.total_amount.toString());
    return acc;
  }, {});

  const pieData = Object.entries(byType).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  const COLORS = ['#B40202', '#F59E0B', '#10B981', '#3B82F6'];

  // Top recipients
  const recipientTotals = commissions.reduce((acc: Record<string, number>, c: any) => {
    const name = c.recipient_name;
    if (!acc[name]) acc[name] = 0;
    acc[name] += parseFloat(c.total_amount.toString());
    return acc;
  }, {});

  const barData = Object.entries(recipientTotals)
    .map(([name, total]) => ({ name, total: total as number }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">Track and manage all commission payments</p>
        </div>
        <Button variant="outline" onClick={() => {
          setIsAuthenticated(false);
          setPassword("");
        }}>
          Logout
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">{commissions.length} commission entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Released (70%)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(released70)}</div>
            <p className="text-xs text-muted-foreground">On downpayment completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Released (30%)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(released30)}</div>
            <p className="text-xs text-muted-foreground">After 2 installments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Release</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment milestones</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Recipients</CardTitle>
            <CardDescription>Highest commission earners</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#B40202" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission by Type</CardTitle>
            <CardDescription>Distribution across recipient types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Commissions</CardTitle>
          <CardDescription>Complete commission payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sale</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>70% Status</TableHead>
                  <TableHead>30% Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.recipient_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{commission.recipient_type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{commission.sale?.unit_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {commission.sale?.customer?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(parseFloat(commission.total_amount))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={commission.status_70_percent === 'released' ? 'default' : 'secondary'}
                        className={commission.status_70_percent === 'released' ? 'bg-green-600' : ''}
                      >
                        {commission.status_70_percent === 'released' 
                          ? `Released ${commission.released_70_date ? `(${commission.released_70_date})` : ''}` 
                          : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={commission.status_30_percent === 'released' ? 'default' : 'secondary'}
                        className={commission.status_30_percent === 'released' ? 'bg-blue-600' : ''}
                      >
                        {commission.status_30_percent === 'released' 
                          ? `Released ${commission.released_30_date ? `(${commission.released_30_date})` : ''}` 
                          : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {commission.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionManagement;
