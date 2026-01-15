-- Allow CEO/COO to delete tasks alongside existing admin policy
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

CREATE POLICY "Authorized users can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = ANY (ARRAY['superadmin', 'admin'])
  )
  OR public.has_role(auth.uid(), 'ceo_coo')
);