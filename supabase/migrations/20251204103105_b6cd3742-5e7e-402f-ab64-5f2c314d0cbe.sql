-- Add paid_amount column to track commission payments
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;