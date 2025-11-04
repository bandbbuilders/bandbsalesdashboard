import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/formatNumber";

interface DashboardStats {
  cashBalance: number;
  totalRevenue: number;
  totalExpenses: number;
  accountsReceivable: number;
  netIncome: number;
  monthlyTrend: Array<{ month: string; revenue: number; expenses: number }>;
}

export const AccountingDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    cashBalance: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    accountsReceivable: 0,
    netIncome: 0,
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    syncPaidLedgerEntries(); // Sync existing paid entries to journal
  }, []);

  const syncPaidLedgerEntries = async () => {
    try {
      // Get all paid ledger entries
      const { data: paidEntries, error: ledgerError } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('status', 'paid');

      if (ledgerError) throw ledgerError;

      // For each paid entry, check if journal entry exists
      for (const entry of paidEntries || []) {
        const { data: existingJournal, error: checkError } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('description', `Collection from ${entry.entry_type} - Sale ${entry.sale_id.substring(0, 8)}`)
          .maybeSingle();

        if (checkError) throw checkError;

        // If no journal entry exists, create one
        if (!existingJournal && entry.paid_amount > 0) {
          await supabase.from('journal_entries').insert({
            date: entry.paid_date || new Date().toISOString().split('T')[0],
            debit_account: 'Cash',
            credit_account: 'Sales Revenue',
            amount: entry.paid_amount,
            description: `Collection from ${entry.entry_type} - Sale ${entry.sale_id.substring(0, 8)}`
          });
        }
      }
    } catch (error) {
      console.error('Error syncing ledger entries:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch ledger entries to calculate cash balance (sum of paid amounts)
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('ledger_entries')
        .select('paid_amount, amount, status, due_date');

      if (ledgerError) throw ledgerError;

      // Calculate cash balance from paid amounts
      const cashBalance = ledgerEntries?.reduce((sum, entry) => sum + (parseFloat(entry.paid_amount?.toString() || '0')), 0) || 0;

      // Calculate accounts receivable (pending amounts)
      const accountsReceivable = ledgerEntries?.reduce((sum, entry) => {
        if (entry.status === 'pending' || entry.status === 'overdue') {
          return sum + (parseFloat(entry.amount?.toString() || '0') - parseFloat(entry.paid_amount?.toString() || '0'));
        }
        return sum;
      }, 0) || 0;

      // Fetch journal entries for revenue and expenses
      const { data: journalEntries, error: journalError } = await supabase
        .from('journal_entries')
        .select('*');

      if (journalError) throw journalError;

      let totalRevenue = 0;
      let totalExpenses = 0;

      journalEntries?.forEach((entry) => {
        if (entry.credit_account.includes('Revenue') || entry.credit_account.includes('Sales')) {
          totalRevenue += parseFloat(entry.amount?.toString() || '0');
        }
        if (entry.debit_account.includes('Expense') || entry.debit_account.includes('Cost')) {
          totalExpenses += parseFloat(entry.amount?.toString() || '0');
        }
      });

      // Calculate cash balance from Cash account in journal entries
      let cashFromJournal = 0;
      journalEntries?.forEach((entry) => {
        if (entry.debit_account === 'Cash') {
          cashFromJournal += parseFloat(entry.amount?.toString() || '0');
        }
        if (entry.credit_account === 'Cash') {
          cashFromJournal -= parseFloat(entry.amount?.toString() || '0');
        }
      });

      const netIncome = totalRevenue - totalExpenses;

      // Calculate monthly trend
      const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
      
      journalEntries?.forEach((entry) => {
        const month = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        
        if (entry.credit_account.includes('Revenue') || entry.credit_account.includes('Sales')) {
          monthlyData[month].revenue += parseFloat(entry.amount?.toString() || '0');
        }
        if (entry.debit_account.includes('Expense') || entry.debit_account.includes('Cost')) {
          monthlyData[month].expenses += parseFloat(entry.amount?.toString() || '0');
        }
      });

      const monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .slice(-6);

      setStats({
        cashBalance: cashFromJournal, // Use cash from journal entries instead
        totalRevenue,
        totalExpenses,
        accountsReceivable,
        netIncome,
        monthlyTrend
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">PKR {formatCurrency(stats.cashBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">From sales payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">PKR {formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">PKR {formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time costs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">PKR {formatCurrency(stats.accountsReceivable)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Income Card */}
      <Card className={`border-2 ${stats.netIncome >= 0 ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30' : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Net Income</CardTitle>
          {stats.netIncome >= 0 ? (
            <DollarSign className="h-6 w-6 text-emerald-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${stats.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            PKR {formatCurrency(stats.netIncome)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats.netIncome >= 0 ? 'Profitable operations' : 'Operating at a loss'}
          </p>
        </CardContent>
      </Card>

      {/* Charts */}
      {stats.monthlyTrend.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
