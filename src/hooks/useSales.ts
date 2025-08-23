import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sale, Customer, User } from '@/types';

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          agent:users(*),
          payment_plan:payment_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSales: Sale[] = salesData?.map(sale => ({
        id: sale.id,
        customer_id: sale.customer_id,
        customer: sale.customer as Customer,
        agent_id: sale.agent_id,
        agent: sale.agent as User,
        unit_number: sale.unit_number,
        unit_total_price: parseFloat(sale.unit_total_price.toString()),
        status: sale.status as "active" | "completed" | "defaulted",
        created_at: sale.created_at,
        updated_at: sale.updated_at,
        payment_plan: sale.payment_plan?.[0] ? {
          downpayment_amount: parseFloat((sale.payment_plan[0].downpayment_amount || 0).toString()),
          downpayment_due_date: sale.payment_plan[0].downpayment_due_date,
          monthly_installment: parseFloat((sale.payment_plan[0].monthly_installment || 0).toString()),
          installment_months: sale.payment_plan[0].installment_months,
          possession_amount: parseFloat((sale.payment_plan[0].possession_amount || 0).toString()),
          possession_due_date: sale.payment_plan[0].possession_due_date
        } : undefined
      })) || [];

      setSales(formattedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) throw error;

      setSales(sales.filter(sale => sale.id !== saleId));
      toast({
        title: "Success",
        description: "Sale deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return {
    sales,
    loading,
    refetch: fetchSales,
    deleteSale
  };
};