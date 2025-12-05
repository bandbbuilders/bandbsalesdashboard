-- Create table to track imported file batches
CREATE TABLE public.import_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  entries_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all import batches" ON public.import_batches FOR SELECT USING (true);
CREATE POLICY "Users can insert import batches" ON public.import_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete import batches" ON public.import_batches FOR DELETE USING (true);

-- Add batch_id column to journal_entries to track which import batch each entry belongs to
ALTER TABLE public.journal_entries ADD COLUMN batch_id UUID REFERENCES public.import_batches(id) ON DELETE CASCADE;