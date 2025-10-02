-- Create journal_entries table for accounting
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all journal entries" 
ON public.journal_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert journal entries" 
ON public.journal_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update journal entries" 
ON public.journal_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete journal entries" 
ON public.journal_entries 
FOR DELETE 
USING (true);