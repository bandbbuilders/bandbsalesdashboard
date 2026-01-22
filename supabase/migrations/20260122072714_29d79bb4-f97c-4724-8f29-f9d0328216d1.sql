-- Create a separate table for sales agents that don't need auth accounts
CREATE TABLE public.sales_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all sales agents"
ON public.sales_agents
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert sales agents"
ON public.sales_agents
FOR INSERT
WITH CHECK (is_admin() OR is_hr_admin(auth.uid()));

CREATE POLICY "Admins can update sales agents"
ON public.sales_agents
FOR UPDATE
USING (is_admin() OR is_hr_admin(auth.uid()));

CREATE POLICY "Admins can delete sales agents"
ON public.sales_agents
FOR DELETE
USING (is_admin() OR is_hr_admin(auth.uid()));