import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Users, 
  FileText,
  Calendar,
  Target
} from "lucide-react";
import { DashboardStats, User } from "@/types";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_sales_value: 125000000, // PKR 12.5 Crore
    receivables_3_months: 8500000,
    receivables_6_months: 15200000,
    receivables_1_year: 28900000,
    receivables_total: 45600000,
    collections_made: 79400000,
    pending_amount: 45600000,
    overdue_amount: 3200000,
    active_sales_count: 67,
    completed_sales_count: 23
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const receivablesData = [
    { period: "3 Months", amount: stats.receivables_3_months, color: "#0ea5e9" },
    { period: "6 Months", amount: stats.receivables_6_months, color: "#3b82f6" },
    { period: "1 Year", amount: stats.receivables_1_year, color: "#6366f1" },
    { period: "Total", amount: stats.receivables_total, color: "#8b5cf6" }
  ];

  const collectionData = [
    { name: "Collections Made", value: stats.collections_made, color: "#10b981" },
    { name: "Pending Amount", value: stats.pending_amount, color: "#f59e0b" },
    { name: "Overdue Amount", value: stats.overdue_amount, color: "#ef4444" }
  ];

  const monthlyTrendData = [
    { month: "Jan", sales: 12, collections: 8.5 },
    { month: "Feb", sales: 15, collections: 12.2 },
    { month: "Mar", sales: 18, collections: 15.8 },
    { month: "Apr", sales: 22, collections: 18.5 },
    { month: "May", sales: 25, collections: 22.1 },
    { month: "Jun", sales: 28, collections: 25.3 }
  ];

  const upcomingPayments = [
    { customer: "Ahmed Hassan", unit: "A-101", amount: 450000, dueDate: "2024-08-25", daysLeft: 3 },
    { customer: "Fatima Sheikh", unit: "B-205", amount: 380000, dueDate: "2024-08-28", daysLeft: 6 },
    { customer: "Ali Khan", unit: "C-301", amount: 520000, dueDate: "2024-09-02", daysLeft: 11 },
    { customer: "Sarah Ahmed", unit: "A-105", amount: 290000, dueDate: "2024-09-05", daysLeft: 14 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Here's your sales overview for today
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_sales_value)}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_sales_count}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed_sales_count} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections Made</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.collections_made)}</div>
            <p className="text-xs text-muted-foreground">
              63.5% of total sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.overdue_amount)}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Receivables Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Receivables Breakdown</CardTitle>
            <CardDescription>Expected collections by period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={receivablesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Collections vs Pending */}
        <Card>
          <CardHeader>
            <CardTitle>Collections Overview</CardTitle>
            <CardDescription>Collections made vs pending amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={collectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {collectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales & Collections Trend</CardTitle>
          <CardDescription>Sales performance over the last 6 months (in Crores)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} name="Sales" />
              <Line type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={3} name="Collections" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payments</CardTitle>
          <CardDescription>Payments due in the next 2 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{payment.customer}</h4>
                    <Badge variant="outline">{payment.unit}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Due: {payment.dueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                  <Badge 
                    variant={payment.daysLeft <= 5 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {payment.daysLeft} days left
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;