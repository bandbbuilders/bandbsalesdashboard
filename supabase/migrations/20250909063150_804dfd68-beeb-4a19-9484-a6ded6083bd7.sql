-- Create enum for lead stages
CREATE TYPE public.lead_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Create enum for reminder types
CREATE TYPE public.reminder_type AS ENUM ('call', 'email', 'meeting', 'follow_up', 'other');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  budget NUMERIC,
  stage lead_stage NOT NULL DEFAULT 'new',
  source TEXT,
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create lead tags table
CREATE TABLE public.lead_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL DEFAULT 'note',
  subject TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  reminder_type reminder_type NOT NULL DEFAULT 'follow_up',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Users can view all leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Users can delete leads" ON public.leads FOR DELETE USING (true);

-- Create RLS policies for lead_tags
CREATE POLICY "Users can view lead tags" ON public.lead_tags FOR SELECT USING (true);
CREATE POLICY "Users can insert lead tags" ON public.lead_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update lead tags" ON public.lead_tags FOR UPDATE USING (true);
CREATE POLICY "Users can delete lead tags" ON public.lead_tags FOR DELETE USING (true);

-- Create RLS policies for conversations
CREATE POLICY "Users can view conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Users can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update conversations" ON public.conversations FOR UPDATE USING (true);
CREATE POLICY "Users can delete conversations" ON public.conversations FOR DELETE USING (true);

-- Create RLS policies for reminders
CREATE POLICY "Users can view reminders" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Users can insert reminders" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update reminders" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Users can delete reminders" ON public.reminders FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX idx_reminders_lead_id ON public.reminders(lead_id);
CREATE INDEX idx_reminders_due_date ON public.reminders(due_date);
CREATE INDEX idx_reminders_completed ON public.reminders(completed);

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();