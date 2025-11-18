-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name text NOT NULL,
  date date NOT NULL,
  check_in time,
  check_out time,
  status text DEFAULT 'absent',
  is_late boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_name, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Users can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Users can delete attendance" ON public.attendance FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();