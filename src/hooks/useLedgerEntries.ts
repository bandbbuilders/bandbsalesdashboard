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

  return {
    ledgerEntries,
    loading,
    refetch: fetchLedgerEntries
  };
};