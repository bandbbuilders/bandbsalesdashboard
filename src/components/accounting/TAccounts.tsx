import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface TAccountData {
  account: string;
  debits: { description: string; amount: number; date: string }[];
  credits: { description: string; amount: number; date: string }[];
  balance: number;
}

export const TAccounts = () => {
  const [accounts, setAccounts] = useState<TAccountData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTAccounts();
  }, []);

  const fetchTAccounts = async () => {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // Group entries by account
      const accountMap = new Map<string, TAccountData>();

      entries?.forEach((entry) => {
        // Process debit account
        if (!accountMap.has(entry.debit_account)) {
          accountMap.set(entry.debit_account, {
            account: entry.debit_account,
            debits: [],
            credits: [],
            balance: 0
          });
        }
        const debitAcc = accountMap.get(entry.debit_account)!;
        debitAcc.debits.push({
          description: entry.description,
          amount: entry.amount,
          date: entry.date
        });

        // Process credit account
        if (!accountMap.has(entry.credit_account)) {
          accountMap.set(entry.credit_account, {
            account: entry.credit_account,
            debits: [],
            credits: [],
            balance: 0
          });
        }
        const creditAcc = accountMap.get(entry.credit_account)!;
        creditAcc.credits.push({
          description: entry.description,
          amount: entry.amount,
          date: entry.date
        });
      });

      // Calculate balances
      accountMap.forEach((account) => {
        const totalDebits = account.debits.reduce((sum, d) => sum + d.amount, 0);
        const totalCredits = account.credits.reduce((sum, c) => sum + c.amount, 0);
        account.balance = totalDebits - totalCredits;
      });

      setAccounts(Array.from(accountMap.values()));
    } catch (error) {
      console.error('Error fetching T-accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No journal entries yet. Add entries to see T-Accounts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <Card key={account.account}>
          <CardHeader>
            <CardTitle className="text-center">{account.account}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 border-b pb-2 mb-2 font-semibold">
              <div>Debit</div>
              <div className="text-right">Credit</div>
            </div>
            <div className="grid grid-cols-2 gap-2 min-h-[100px]">
              <div className="space-y-1">
                {account.debits.map((debit, idx) => (
                  <div key={idx} className="text-sm">
                    PKR {debit.amount.toLocaleString()}
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-right">
                {account.credits.map((credit, idx) => (
                  <div key={idx} className="text-sm">
                    PKR {credit.amount.toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
              <span>Balance:</span>
              <span className={account.balance >= 0 ? "text-success" : "text-destructive"}>
                PKR {Math.abs(account.balance).toLocaleString()} {account.balance >= 0 ? "Dr" : "Cr"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
