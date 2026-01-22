-- Allow admins, superadmins, and CEO/COO to insert profiles for others
CREATE POLICY "Admins can insert profiles for others"
ON public.profiles
FOR INSERT
WITH CHECK (
  is_admin() OR is_hr_admin(auth.uid())
);