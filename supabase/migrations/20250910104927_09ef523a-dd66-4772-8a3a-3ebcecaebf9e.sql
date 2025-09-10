-- Create users in auth.users table for manager and Umer
-- This is a one-time setup for the specified users

-- First, we need to insert into auth.users (this would normally be done through Supabase Auth UI)
-- But since we can't directly insert into auth schema, we'll create profiles that can be used for access control

-- Create user roles table for access control
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- Create conversations table for tracking calls/communications
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'note',
  subject TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations" 
ON public.conversations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete conversations" 
ON public.conversations 
FOR DELETE 
USING (true);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  reminder_type TEXT NOT NULL DEFAULT 'follow_up',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for reminders
CREATE POLICY "Users can view reminders" 
ON public.reminders 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update reminders" 
ON public.reminders 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete reminders" 
ON public.reminders 
FOR DELETE 
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();