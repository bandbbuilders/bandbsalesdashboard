-- Drop the policies that require auth.uid()
DROP POLICY IF EXISTS "Users can create baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Users can update own baselines" ON public.script_baselines;
DROP POLICY IF EXISTS "Users can delete own baselines" ON public.script_baselines;

-- Create public access policies to match other tables in the system
CREATE POLICY "Allow public to create baselines"
ON public.script_baselines
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public to update baselines"
ON public.script_baselines
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Allow public to delete baselines"
ON public.script_baselines
FOR DELETE
TO public
USING (true);