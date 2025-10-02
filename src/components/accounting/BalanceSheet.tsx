import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const BalanceSheet = () => {
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const fetchBalanceSheet = async () => {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*');

      if (error) throw error;

      const assets: { [key: string]: number } = {};
      const liabilities: { [key: string]: number } = {};
      const equity: { [key: string]: number } = {};

      const assetAccounts = ['Cash', 'Accounts Receivable', 'Inventory', 'Land', 'Building', 'Equipment'];
      const liabilityAccounts = ['Accounts Payable', 'Notes Payable'];
      const equityAccounts = ['Capital'];

      entries?.forEach((entry) => {
        // Assets increase on debit
        if (assetAccounts.some(acc => entry.debit_account.includes(acc))) {
          assets[entry.debit_account] = (assets[entry.debit_account] || 0) + entry.amount;
        }
        if (assetAccounts.some(acc => entry.credit_account.includes(acc))) {
          assets[entry.credit_account] = (assets[entry.credit_account] || 0) - entry.amount;
        }

        // Liabilities increase on credit
        if (liabilityAccounts.some(acc => entry.credit_account.includes(acc))) {
          liabilities[entry.credit_account] = (liabilities[entry.credit_account] || 0) + entry.amount;
        }
        if (liabilityAccounts.some(acc => entry.debit_account.includes(acc))) {
          liabilities[entry.debit_account] = (liabilities[entry.debit_account] || 0) - entry.amount;
        }

        // Equity increases on credit
        if (equityAccounts.some(acc => entry.credit_account.includes(acc))) {
          equity[entry.credit_account] = (equity[entry.credit_account] || 0) + entry.amount;
        }
        if (equityAccounts.some(acc => entry.debit_account.includes(acc))) {
          equity[entry.debit_account] = (equity[entry.debit_account] || 0) - entry.amount;
        }
      });

      const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
      const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + val, 0);
      const totalEquity = Object.values(equity).reduce((sum, val) => sum + val, 0);

      setBalanceSheet({
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity
      });
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!balanceSheet) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No balance sheet data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Sheet</CardTitle>
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
              <TableCell>ASSETS</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {Object.entries(balanceSheet.assets).map(([account, amount]) => (
              <TableRow key={account}>
                <TableCell className="pl-8">{account}</TableCell>
                <TableCell className="text-right">{(amount as number).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Total Assets</TableCell>
              <TableCell className="text-right">{balanceSheet.totalAssets.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="h-4"></TableRow>

            <TableRow className="font-semibold bg-muted/50">
              <TableCell>LIABILITIES</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {Object.entries(balanceSheet.liabilities).map(([account, amount]) => (
              <TableRow key={account}>
                <TableCell className="pl-8">{account}</TableCell>
                <TableCell className="text-right">{(amount as number).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Total Liabilities</TableCell>
              <TableCell className="text-right">{balanceSheet.totalLiabilities.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="h-4"></TableRow>

            <TableRow className="font-semibold bg-muted/50">
              <TableCell>EQUITY</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {Object.entries(balanceSheet.equity).map(([account, amount]) => (
              <TableRow key={account}>
                <TableCell className="pl-8">{account}</TableCell>
                <TableCell className="text-right">{(amount as number).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold border-t">
              <TableCell>Total Equity</TableCell>
              <TableCell className="text-right">{balanceSheet.totalEquity.toLocaleString()}</TableCell>
            </TableRow>

            <TableRow className="font-bold text-lg border-t-2">
              <TableCell>Total Liabilities & Equity</TableCell>
              <TableCell className="text-right">
                {(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
