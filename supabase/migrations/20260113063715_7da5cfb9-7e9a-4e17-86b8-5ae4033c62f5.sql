-- Create a table for tracking fines
CREATE TABLE public.fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 500,
  reason TEXT NOT NULL,
  date DATE NOT NULL,
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Create policies for fines access
CREATE POLICY "Users can view all fines" 
ON public.fines 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert fines" 
ON public.fines 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update fines" 
ON public.fines 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete fines" 
ON public.fines 
FOR DELETE 
USING (true);

-- Create index for better performance
CREATE INDEX idx_fines_user_name ON public.fines(user_name);
CREATE INDEX idx_fines_date ON public.fines(date);
CREATE INDEX idx_fines_status ON public.fines(status);