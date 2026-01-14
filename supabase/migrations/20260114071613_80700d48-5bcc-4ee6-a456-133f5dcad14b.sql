-- Create helper function to check if user is Sara Memon or has CEO/COO role
CREATE OR REPLACE FUNCTION public.is_hr_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Check if user is Sara Memon
    _user_id = '2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0'::uuid
    OR
    -- Check if user has CEO/COO role
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'ceo_coo'
    )
    OR
    -- Check if user is in HR department
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = _user_id AND LOWER(TRIM(department)) = 'hr'
    )
$$;

-- Fix employee_details RLS policies
DROP POLICY IF EXISTS "Employees can view own details" ON public.employee_details;
DROP POLICY IF EXISTS "HR can manage employee details" ON public.employee_details;
DROP POLICY IF EXISTS "View employee details" ON public.employee_details;
DROP POLICY IF EXISTS "Manage employee details" ON public.employee_details;

CREATE POLICY "View employee details"
ON public.employee_details FOR SELECT
TO authenticated
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.is_hr_admin(auth.uid())
);

CREATE POLICY "Manage employee details"
ON public.employee_details FOR ALL
TO authenticated
USING (public.is_hr_admin(auth.uid()))
WITH CHECK (public.is_hr_admin(auth.uid()));

-- Fix leave_applications RLS policies
DROP POLICY IF EXISTS "Employees can view own leave applications" ON public.leave_applications;
DROP POLICY IF EXISTS "Employees can insert own leave applications" ON public.leave_applications;
DROP POLICY IF EXISTS "HR can manage all leave applications" ON public.leave_applications;

CREATE POLICY "View leave applications"
ON public.leave_applications FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT ed.id FROM public.employee_details ed
    JOIN public.profiles p ON p.id = ed.profile_id
    WHERE p.user_id = auth.uid()
  )
  OR public.is_hr_admin(auth.uid())
);

CREATE POLICY "Insert leave applications"
ON public.leave_applications FOR INSERT
TO authenticated
WITH CHECK (
  employee_id IN (
    SELECT ed.id FROM public.employee_details ed
    JOIN public.profiles p ON p.id = ed.profile_id
    WHERE p.user_id = auth.uid()
  )
  OR public.is_hr_admin(auth.uid())
);

CREATE POLICY "Manage leave applications"
ON public.leave_applications FOR UPDATE
TO authenticated
USING (public.is_hr_admin(auth.uid()))
WITH CHECK (public.is_hr_admin(auth.uid()));

-- Fix leave_balances RLS policies
DROP POLICY IF EXISTS "Employees can view own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "HR can manage leave balances" ON public.leave_balances;

CREATE POLICY "View leave balances"
ON public.leave_balances FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT ed.id FROM public.employee_details ed
    JOIN public.profiles p ON p.id = ed.profile_id
    WHERE p.user_id = auth.uid()
  )
  OR public.is_hr_admin(auth.uid())
);

CREATE POLICY "Manage leave balances"
ON public.leave_balances FOR ALL
TO authenticated
USING (public.is_hr_admin(auth.uid()))
WITH CHECK (public.is_hr_admin(auth.uid()));

-- Fix profiles RLS to allow HR admins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "HR can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "View profiles" ON public.profiles;

CREATE POLICY "View profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_hr_admin(auth.uid())
);