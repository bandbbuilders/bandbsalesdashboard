import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const CashFlow = () => {
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashFlow();
  }, []);

  const fetchCashFlow = async () => {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      const operating: { description: string; amount: number }[] = [];
      const investing: { description: string; amount: number }[] = [];
      const financing: { description: string; amount: number }[] = [];

      entries?.forEach((entry) => {
        const isCashDebit = entry.debit_account === 'Cash';
        const isCashCredit = entry.credit_account === 'Cash';
        
        if (!isCashDebit && !isCashCredit) return;

        const amount = isCashDebit ? entry.amount : -entry.amount;

        // Categorize based on account types
        if (entry.debit_account.includes('Revenue') || entry.credit_account.includes('Revenue') ||
            entry.debit_account.includes('Expense') || entry.credit_account.includes('Expense')) {
          operating.push({ description: entry.description, amount });
        } else if (entry.debit_account.includes('Equipment') || entry.credit_account.includes('Equipment') ||
                   entry.debit_account.includes('Building') || entry.credit_account.includes('Building') ||
                   entry.debit_account.includes('Land') || entry.credit_account.includes('Land')) {
          investing.push({ description: entry.description, amount });
        } else if (entry.debit_account.includes('Capital') || entry.credit_account.includes('Capital') ||
                   entry.debit_account.includes('Payable') || entry.credit_account.includes('Payable')) {
          financing.push({ description: entry.description, amount });
        }
      });

      const totalOperating = operating.reduce((sum, item) => sum + item.amount, 0);
      const totalInvesting = investing.reduce((sum, item) => sum + item.amount, 0);
      const totalFinancing = financing.reduce((sum, item) => sum + item.amount, 0);
      const netCashFlow = totalOperating + totalInvesting + totalFinancing;

      setCashFlow({
        operating,
        investing,
        financing,
        totalOperating,
        totalInvesting,
        totalFinancing,
        netCashFlow
      });
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!cashFlow) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No cash flow data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (PKR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="font-semibold bg-muted/50">
              <TableCell>OPERATING ACTIVITIES</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {cashFlow.operating.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="pl-8">{item.description}</TableCell>
                <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Net Cash from Operating</TableCell>
              <TableCell className="text-right">{cashFlow.totalOperating.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="h-4"></TableRow>

            <TableRow className="font-semibold bg-muted/50">
              <TableCell>INVESTING ACTIVITIES</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {cashFlow.investing.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="pl-8">{item.description}</TableCell>
                <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Net Cash from Investing</TableCell>
              <TableCell className="text-right">{cashFlow.totalInvesting.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="h-4"></TableRow>

            <TableRow className="font-semibold bg-muted/50">
              <TableCell>FINANCING ACTIVITIES</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {cashFlow.financing.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="pl-8">{item.description}</TableCell>
                <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Net Cash from Financing</TableCell>
              <TableCell className="text-right">{cashFlow.totalFinancing.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="font-bold text-lg border-t-2">
              <TableCell>Net Increase in Cash</TableCell>
              <TableCell className={`text-right ${cashFlow.netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {cashFlow.netCashFlow.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
