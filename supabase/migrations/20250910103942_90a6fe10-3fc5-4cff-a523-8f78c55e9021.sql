-- Create lead_stages table
CREATE TABLE public.lead_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_stages
CREATE POLICY "Users can view all lead stages" 
ON public.lead_stages 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert lead stages" 
ON public.lead_stages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update lead stages" 
ON public.lead_stages 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete lead stages" 
ON public.lead_stages 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_lead_stages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_stages_updated_at
BEFORE UPDATE ON public.lead_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_lead_stages_updated_at_column();

-- Insert default stages
INSERT INTO public.lead_stages (name, color, order_position) VALUES
('New', '#3b82f6', 0),
('Contacted', '#f59e0b', 1),
('Qualified', '#8b5cf6', 2),
('Proposal', '#10b981', 3),
('Negotiation', '#ec4899', 4),
('Closed Won', '#10b981', 5),
('Closed Lost', '#ef4444', 6);