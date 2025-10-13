-- Create table for script baselines (admin-created templates)
CREATE TABLE public.script_baselines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  baseline_content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for generated scripts
CREATE TABLE public.generated_scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  baseline_id uuid REFERENCES public.script_baselines(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id),
  prompt text NOT NULL,
  script_content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.script_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_scripts ENABLE ROW LEVEL SECURITY;

-- RLS policies for baselines
CREATE POLICY "Everyone can view baselines"
  ON public.script_baselines FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage baselines"
  ON public.script_baselines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- RLS policies for generated scripts
CREATE POLICY "Users can view their own scripts"
  ON public.generated_scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scripts"
  ON public.generated_scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
  ON public.generated_scripts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_script_baselines_updated_at
  BEFORE UPDATE ON public.script_baselines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();