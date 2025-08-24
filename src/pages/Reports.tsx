import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Download, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  FileText,
  Filter
} from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { User } from "@/types";

const Reports = () => {
  const [user, setUser] = useState<User | null>(null);
  const { sales, loading } = useSales();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `PKR ${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `PKR ${(amount / 100000).toFixed(1)}L`;
    } else {
      return `PKR ${amount.toLocaleString()}`;
    }
  };

  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.unit_total_price, 0);
  const activeSales = sales.filter(sale => sale.status === "active");
  const completedSales = sales.filter(sale => sale.status === "completed");

  const statusData = [
    { name: "Active", value: activeSales.length, color: "#10b981" },
    { name: "Completed", value: completedSales.length, color: "#B40202" },
    { name: "Defaulted", value: sales.filter(sale => sale.status === "defaulted").length, color: "#ef4444" }
  ];

  const monthlyData = sales.reduce((acc: any[], sale) => {
    const month = new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existingMonth = acc.find(item => item.month === month);
    
    if (existingMonth) {
      existingMonth.sales += 1;
      existingMonth.value += sale.unit_total_price;
    } else {
      acc.push({ month, sales: 1, value: sale.unit_total_price });
    }
    
    return acc;
  }, []).slice(-6);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive sales analytics and performance metrics
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSalesValue)}</div>
            <p className="text-xs text-muted-foreground">
              From {sales.length} sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSales.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(activeSales.reduce((sum, sale) => sum + sale.unit_total_price, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSales.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(completedSales.reduce((sum, sale) => sum + sale.unit_total_price, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale Value</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.length > 0 ? formatCurrency(totalSalesValue / sales.length) : "PKR 0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
            <CardDescription>Sales performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any, name: string) => [
                  name === 'value' ? formatCurrency(value) : value,
                  name === 'value' ? 'Sales Value' : 'Number of Sales'
                ]} />
                <Bar dataKey="sales" fill="#B40202" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Status Distribution</CardTitle>
            <CardDescription>Breakdown of sales by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Top performing sales agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Sales Value</TableHead>
                  <TableHead>Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.reduce((acc: any[], sale) => {
                  const existing = acc.find(item => item.agent_id === sale.agent_id);
                  if (existing) {
                    existing.total_sales += 1;
                    existing.total_value += sale.unit_total_price;
                    if (sale.status === "completed") existing.completed += 1;
                  } else {
                    acc.push({
                      agent_id: sale.agent_id,
                      agent_name: sale.agent.name,
                      total_sales: 1,
                      total_value: sale.unit_total_price,
                      completed: sale.status === "completed" ? 1 : 0
                    });
                  }
                  return acc;
                }, []).map((agent) => (
                  <TableRow key={agent.agent_id}>
                    <TableCell className="font-medium">{agent.agent_name}</TableCell>
                    <TableCell>{agent.total_sales}</TableCell>
                    <TableCell>{formatCurrency(agent.total_value)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {((agent.completed / agent.total_sales) * 100).toFixed(1)}%
                      </Badge>
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

export default Reports;