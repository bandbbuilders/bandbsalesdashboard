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
import { useSales } from "@/hooks/useSales";
import { useLedgerEntries } from "@/hooks/useLedgerEntries";
import { MonthlyInstallmentChart } from "@/components/dashboard/MonthlyInstallmentChart";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const { sales, loading } = useSales();
  const { ledgerEntries, loading: ledgerLoading } = useLedgerEntries();
  
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Calculate real stats from sales and ledger data
  const stats: DashboardStats = {
    total_sales_value: sales.reduce((sum, sale) => sum + sale.unit_total_price, 0),
    receivables_3_months: ledgerEntries
      .filter(entry => {
        const dueDate = new Date(entry.due_date);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        return entry.status === 'pending' && dueDate <= threeMonthsFromNow;
      })
      .reduce((sum, entry) => sum + entry.amount, 0),
    receivables_6_months: ledgerEntries
      .filter(entry => {
        const dueDate = new Date(entry.due_date);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return entry.status === 'pending' && dueDate <= sixMonthsFromNow;
      })
      .reduce((sum, entry) => sum + entry.amount, 0),
    receivables_1_year: ledgerEntries
      .filter(entry => {
        const dueDate = new Date(entry.due_date);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return entry.status === 'pending' && dueDate <= oneYearFromNow;
      })
      .reduce((sum, entry) => sum + entry.amount, 0),
    receivables_total: ledgerEntries
      .filter(entry => entry.status === 'pending')
      .reduce((sum, entry) => sum + entry.amount, 0),
    collections_made: ledgerEntries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.paid_amount, 0),
    pending_amount: ledgerEntries
      .filter(entry => entry.status === 'pending')
      .reduce((sum, entry) => sum + entry.amount, 0),
    overdue_amount: ledgerEntries
      .filter(entry => entry.status === 'overdue')
      .reduce((sum, entry) => sum + entry.amount, 0),
    total_payment_pending: ledgerEntries
      .filter(entry => {
        const dueDate = new Date(entry.due_date);
        const fiveYearsFromNow = new Date();
        fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
        return entry.status === 'pending' && dueDate <= fiveYearsFromNow;
      })
      .reduce((sum, entry) => sum + entry.amount, 0),
    active_sales_count: sales.filter(sale => sale.status === 'active').length,
    completed_sales_count: sales.filter(sale => sale.status === 'completed').length
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `PKR ${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `PKR ${(amount / 100000).toFixed(1)}L`;
    } else {
      return `PKR ${amount.toLocaleString()}`;
    }
  };

  // Real receivables data from ledger entries
  const receivablesData = [
    { period: "3 Months", amount: stats.receivables_3_months, color: "#0ea5e9" },
    { period: "6 Months", amount: stats.receivables_6_months, color: "#3b82f6" },
    { period: "1 Year", amount: stats.receivables_1_year, color: "#6366f1" },
    { period: "Total", amount: stats.receivables_total, color: "#8b5cf6" }
  ];

  // Real collection data from ledger entries
  const collectionData = [
    { name: "Collections Made", value: stats.collections_made, color: "#10b981" },
    { name: "Pending Amount", value: stats.pending_amount, color: "#f59e0b" },
    { name: "Overdue Amount", value: stats.overdue_amount, color: "#ef4444" }
  ];

  // Calculate monthly trend from real sales data
  const monthlyTrendData = (() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      
      const salesInMonth = sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.getMonth() === monthDate.getMonth() && 
               saleDate.getFullYear() === monthDate.getFullYear();
      });
      
      const collectionsInMonth = ledgerEntries.filter(entry => {
        if (entry.status !== 'paid' || !entry.paid_date) return false;
        const paidDate = new Date(entry.paid_date);
        return paidDate.getMonth() === monthDate.getMonth() && 
               paidDate.getFullYear() === monthDate.getFullYear();
      });
      
      months.push({
        month: monthName,
        sales: salesInMonth.reduce((sum, sale) => sum + sale.unit_total_price, 0) / 10000000, // Convert to Crores
        collections: collectionsInMonth.reduce((sum, entry) => sum + entry.paid_amount, 0) / 10000000 // Convert to Crores
      });
    }
    
    return months;
  })();

  // Real upcoming payments from ledger entries
  const upcomingPayments = ledgerEntries
    .filter(entry => {
      const dueDate = new Date(entry.due_date);
      const today = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(today.getDate() + 14);
      return entry.status === 'pending' && dueDate >= today && dueDate <= twoWeeksFromNow;
    })
    .slice(0, 4)
    .map(entry => {
      const sale = sales.find(s => s.id === entry.sale_id);
      const dueDate = new Date(entry.due_date);
      const today = new Date();
      const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        customer: sale?.customer.name || 'Unknown Customer',
        unit: sale?.unit_number || 'Unknown Unit',
        amount: entry.amount,
        dueDate: entry.due_date,
        daysLeft: daysLeft
      };
    });

  if (loading || ledgerLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          B&B Builders Sales Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's your sales overview for today
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payment Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_payment_pending)}</div>
            <p className="text-xs text-muted-foreground">
              Next 5 years receivables
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sales Target Progress (Next 8 Months)
          </CardTitle>
          <CardDescription>50% target - 59 units out of 118 total units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {sales.length} / 59 units ({((sales.length / 59) * 100).toFixed(1)}%)
              </span>
            </div>
            <Progress value={(sales.length / 59) * 100} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{sales.length}</div>
                <div className="text-xs text-muted-foreground">Units Sold</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-warning">{59 - sales.length}</div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {Math.ceil((59 - sales.length) / 8)}
                </div>
                <div className="text-xs text-muted-foreground">Units/Month Needed</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-info">8</div>
                <div className="text-xs text-muted-foreground">Months Left</div>
              </div>
            </div>
            
            {sales.length >= 59 && (
              <div className="text-center p-4 bg-success/10 text-success rounded-lg">
                🎉 Target Achieved! Congratulations on reaching the 50% sales target!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Downpayment Completion Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Downpayment Completions by Month
          </CardTitle>
          <CardDescription>Track which clients' downpayments are completing each month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              // Get downpayment entries and group by month/year
              const downpaymentEntries = ledgerEntries.filter(entry => 
                entry.entry_type === 'downpayment' && entry.status !== 'paid'
              );
              
              // Group by month/year
              const groupedByMonth = downpaymentEntries.reduce((acc, entry) => {
                const date = parseISO(entry.due_date);
                const monthYear = format(date, 'MMMM yyyy');
                
                if (!acc[monthYear]) {
                  acc[monthYear] = [];
                }
                
                // Find the sale for this entry
                const sale = sales.find(s => s.id === entry.sale_id);
                if (sale) {
                  acc[monthYear].push({
                    ...entry,
                    customerName: sale.customer.name,
                    unitNumber: sale.unit_number
                  });
                }
                
                return acc;
              }, {} as Record<string, any[]>);

              // Sort months chronologically
              const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
                return new Date(a).getTime() - new Date(b).getTime();
              });

              if (sortedMonths.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending downpayments found
                  </div>
                );
              }

              return sortedMonths.map(monthYear => (
                <div key={monthYear} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{monthYear}</h3>
                    <Badge variant="secondary">
                      {groupedByMonth[monthYear].length} payment{groupedByMonth[monthYear].length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {groupedByMonth[monthYear].map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium">{entry.customerName}</p>
                          <p className="text-sm text-muted-foreground">Unit {entry.unitNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">PKR {entry.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(parseISO(entry.due_date), 'dd MMM')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Installment Receivables */}
      <MonthlyInstallmentChart ledgerEntries={ledgerEntries} sales={sales} />

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