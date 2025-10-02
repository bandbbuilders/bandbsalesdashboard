import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const ProfitAndLoss = () => {
  const [pnlData, setPnlData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPnLData();
  }, []);

  const fetchPnLData = async () => {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*');

      if (error) throw error;

      // Calculate revenues and expenses
      const revenues: { [key: string]: number } = {};
      const expenses: { [key: string]: number } = {};

      entries?.forEach((entry) => {
        // Revenue accounts (credits increase revenue)
        if (entry.credit_account.includes('Revenue') || entry.credit_account.includes('Sales')) {
          revenues[entry.credit_account] = (revenues[entry.credit_account] || 0) + entry.amount;
        }
        
        // Expense accounts (debits increase expenses)
        if (entry.debit_account.includes('Expense') || entry.debit_account.includes('Cost')) {
          expenses[entry.debit_account] = (expenses[entry.debit_account] || 0) + entry.amount;
        }
      });

      const totalRevenue = Object.values(revenues).reduce((sum, val) => sum + val, 0);
      const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
      const netIncome = totalRevenue - totalExpenses;

      setPnlData({
        revenues,
        expenses,
        totalRevenue,
        totalExpenses,
        netIncome
      });
    } catch (error) {
      console.error('Error fetching P&L data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!pnlData || (Object.keys(pnlData.revenues).length === 0 && Object.keys(pnlData.expenses).length === 0)) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No revenue or expense transactions found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit & Loss Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount (PKR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="font-semibold bg-muted/50">
              <TableCell>REVENUES</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {Object.entries(pnlData.revenues).map(([account, amount]) => (
              <TableRow key={account}>
                <TableCell className="pl-8">{account}</TableCell>
                <TableCell className="text-right">{(amount as number).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Total Revenue</TableCell>
              <TableCell className="text-right">{pnlData.totalRevenue.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="font-semibold bg-muted/50">
              <TableCell>EXPENSES</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {Object.entries(pnlData.expenses).map(([account, amount]) => (
              <TableRow key={account}>
                <TableCell className="pl-8">{account}</TableCell>
                <TableCell className="text-right">{(amount as number).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Total Expenses</TableCell>
              <TableCell className="text-right">{pnlData.totalExpenses.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="font-bold text-lg border-t-2">
              <TableCell>Net Income</TableCell>
              <TableCell className={`text-right ${pnlData.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                {pnlData.netIncome.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
