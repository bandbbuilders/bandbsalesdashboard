import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LedgerEntry {
  id: string;
  sale_id: string;
  due_date: string;
  entry_type: 'downpayment' | 'installment' | 'possession';
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_amount: number;
  paid_date?: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export const useLedgerEntries = () => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      const { data: ledgerData, error } = await supabase
        .from('ledger_entries')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const formattedEntries: LedgerEntry[] = ledgerData?.map(entry => ({
        id: entry.id,
        sale_id: entry.sale_id,
        due_date: entry.due_date,
        entry_type: entry.entry_type as 'downpayment' | 'installment' | 'possession',
        amount: parseFloat(entry.amount.toString()),
        status: entry.status as 'pending' | 'paid' | 'overdue',
        paid_amount: parseFloat((entry.paid_amount || 0).toString()),
        paid_date: entry.paid_date,
        description: entry.description,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      })) || [];

      setLedgerEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      toast({
        title: "Error",
        description: "Failed to load ledger entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerEntries();
  }, []);

  const updateLedgerEntry = async (entryId: string, updates: Partial<LedgerEntry>) => {
    try {
      const { error } = await supabase
        .from('ledger_entries')
        .update(updates)
        .eq('id', entryId);

      if (error) throw error;

      // If payment is being marked as paid, create journal entry
      if (updates.status === 'paid' && updates.paid_amount && updates.paid_amount > 0) {
        const entry = ledgerEntries.find(e => e.id === entryId);
        if (entry) {
          await supabase.from('journal_entries').insert({
            date: updates.paid_date || new Date().toISOString().split('T')[0],
            debit_account: 'Cash/Bank',
            credit_account: 'Accounts Receivable',
            amount: updates.paid_amount,
            description: `Payment received for ${entry.entry_type} - Sale ${entry.sale_id.substring(0, 8)}`
          });
        }
      }

      toast({
        title: "Success",
        description: "Ledger entry updated successfully",
      });
    } catch (error) {
      console.error('Error updating ledger entry:', error);
      toast({
        title: "Error",
        description: "Failed to update ledger entry",
        variant: "destructive",
      });
    }
  };

  const deleteLedgerEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('ledger_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ledger entry deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting ledger entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete ledger entry",
        variant: "destructive",
      });
    }
  };

  return {
    ledgerEntries,
    loading,
    refetch: fetchLedgerEntries,
    updateLedgerEntry,
    deleteLedgerEntry
  };
};