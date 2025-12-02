-- Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  recipient_name text NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('agent', 'dealer', 'coo')),
  total_amount numeric NOT NULL,
  amount_70_percent numeric NOT NULL,
  amount_30_percent numeric NOT NULL,
  status_70_percent text NOT NULL DEFAULT 'pending' CHECK (status_70_percent IN ('pending', 'released')),
  status_30_percent text NOT NULL DEFAULT 'pending' CHECK (status_30_percent IN ('pending', 'released')),
  released_70_date date,
  released_30_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for commissions
CREATE POLICY "Users can view all commissions"
  ON public.commissions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert commissions"
  ON public.commissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update commissions"
  ON public.commissions
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete commissions"
  ON public.commissions
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-release commissions based on payment status
CREATE OR REPLACE FUNCTION public.check_commission_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_downpayment_complete boolean;
  v_installments_paid integer;
BEGIN
  v_sale_id := NEW.sale_id;
  
  -- Check if downpayment is complete (15% of total paid)
  SELECT 
    CASE 
      WHEN SUM(CASE WHEN status = 'paid' AND entry_type = 'downpayment' THEN paid_amount ELSE 0 END) >= 
           (SELECT unit_total_price * 0.15 FROM sales WHERE id = v_sale_id)
      THEN true
      ELSE false
    END INTO v_downpayment_complete
  FROM ledger_entries
  WHERE sale_id = v_sale_id;
  
  -- Count paid installments
  SELECT COUNT(*) INTO v_installments_paid
  FROM ledger_entries
  WHERE sale_id = v_sale_id 
    AND entry_type = 'installment' 
    AND status = 'paid';
  
  -- Update commission statuses
  IF v_downpayment_complete THEN
    UPDATE commissions
    SET status_70_percent = 'released',
        released_70_date = CURRENT_DATE
    WHERE sale_id = v_sale_id 
      AND status_70_percent = 'pending';
  END IF;
  
  IF v_installments_paid >= 2 THEN
    UPDATE commissions
    SET status_30_percent = 'released',
        released_30_date = CURRENT_DATE
    WHERE sale_id = v_sale_id 
      AND status_30_percent = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on ledger_entries to auto-update commission status
CREATE TRIGGER trigger_check_commission_release
  AFTER INSERT OR UPDATE ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_commission_release();