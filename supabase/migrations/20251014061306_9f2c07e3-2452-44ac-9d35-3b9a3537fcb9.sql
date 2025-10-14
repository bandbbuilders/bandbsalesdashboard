-- First, drop ALL existing policies on script_baselines
DROP POLICY IF EXISTS "Everyone can view baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Allow public to create baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Allow public to update baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Allow public to delete baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Users can create baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Users can update own baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Users can delete own baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Admins can manage baselines" ON public.script_baselines;

-- Create simple public access policies (matching the pattern used in other tables)
CREATE POLICY "Allow public access to baselines"
ON public.script_baselines
FOR ALL
TO public
USING (true)
WITH CHECK (true);