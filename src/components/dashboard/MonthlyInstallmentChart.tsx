import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface LedgerEntry {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  entry_type: string;
  sale_id: string;
  paid_amount?: number;
}

interface Sale {
  id: string;
  customer: { name: string };
  unit_number: string;
}

interface MonthlyInstallmentChartProps {
  ledgerEntries: LedgerEntry[];
  sales: Sale[];
}

export const MonthlyInstallmentChart = ({ ledgerEntries, sales }: MonthlyInstallmentChartProps) => {
  // Get installment entries for the next 12 months
  const getMonthlyInstallments = () => {
    const months = [];
    const currentDate = new Date();

    for (let i = 0; i < 1; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Filter installments for this month
      const monthlyInstallments = ledgerEntries.filter(entry => {
        if (entry.entry_type !== 'installment') return false;
        const dueDate = parseISO(entry.due_date);
        return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
      });

      // Calculate totals
      const totalReceivable = monthlyInstallments.reduce((sum, entry) => sum + entry.amount, 0);
      const totalReceived = monthlyInstallments
        .filter(entry => entry.status === 'paid')
        .reduce((sum, entry) => sum + (entry.paid_amount || entry.amount), 0);
      const pendingCount = monthlyInstallments.filter(entry => entry.status === 'pending').length;
      const receivedCount = monthlyInstallments.filter(entry => entry.status === 'paid').length;
      const overdueCount = monthlyInstallments.filter(entry => entry.status === 'overdue').length;

      months.push({
        month: format(monthDate, 'MMM yyyy'),
        date: monthDate,
        installments: monthlyInstallments.map(entry => {
          const sale = sales.find(s => s.id === entry.sale_id);
          return {
            ...entry,
            customerName: sale?.customer.name || 'Unknown',
            unitNumber: sale?.unit_number || 'Unknown'
          };
        }),
        totalReceivable,
        totalReceived,
        pendingCount,
        receivedCount,
        overdueCount,
        collectionRate: totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0
      });
    }

    return months;
  };

  const monthlyData = getMonthlyInstallments();

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `PKR ${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `PKR ${(amount / 100000).toFixed(1)}L`;
    } else {
      return `PKR ${amount.toLocaleString()}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Monthly Installment Receivables
        </CardTitle>
        <CardDescription>
          Track which installments are due this month and collection status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {monthlyData.map(month => (
            <div key={month.month} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{month.month}</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-green-600">
                    {month.receivedCount} Received
                  </Badge>
                  <Badge variant="outline" className="text-yellow-600">
                    {month.pendingCount} Pending
                  </Badge>
                  {month.overdueCount > 0 && (
                    <Badge variant="outline" className="text-red-600">
                      {month.overdueCount} Overdue
                    </Badge>
                  )}
                </div>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Receivable</div>
                  <div className="font-semibold">{formatCurrency(month.totalReceivable)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Amount Received</div>
                  <div className="font-semibold text-green-600">{formatCurrency(month.totalReceived)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Collection Rate</div>
                  <div className="font-semibold">{month.collectionRate.toFixed(1)}%</div>
                </div>
              </div>

              {/* Individual Installments */}
              {month.installments.length > 0 ? (
                <div className="space-y-2">
                  {month.installments.map(installment => (
                    <div key={installment.id} className="flex items-center justify-between p-3 bg-background border rounded">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded ${getStatusColor(installment.status)}`}>
                          {getStatusIcon(installment.status)}
                        </div>
                        <div>
                          <p className="font-medium">{installment.customerName}</p>
                          <p className="text-sm text-muted-foreground">Unit {installment.unitNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">PKR {installment.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {format(parseISO(installment.due_date), 'dd MMM')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No installments due this month
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};