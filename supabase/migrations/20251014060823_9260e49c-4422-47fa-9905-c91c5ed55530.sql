-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage baselines" ON public.script_baselines;

-- Allow authenticated users to create their own baselines
CREATE POLICY "Users can create baselines"
ON public.script_baselines
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own baselines
CREATE POLICY "Users can update own baselines"
ON public.script_baselines
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Allow users to delete their own baselines
CREATE POLICY "Users can delete own baselines"
ON public.script_baselines
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Keep the existing select policy (everyone can view)
-- "Everyone can view baselines" policy already exists