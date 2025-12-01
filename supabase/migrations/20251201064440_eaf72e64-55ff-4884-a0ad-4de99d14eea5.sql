-- Create custom_accounts table for user-defined accounts
CREATE TABLE IF NOT EXISTS public.custom_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_accounts
CREATE POLICY "Users can view all custom accounts"
  ON public.custom_accounts
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert custom accounts"
  ON public.custom_accounts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update custom accounts"
  ON public.custom_accounts
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete custom accounts"
  ON public.custom_accounts
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_custom_accounts_updated_at
  BEFORE UPDATE ON public.custom_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();