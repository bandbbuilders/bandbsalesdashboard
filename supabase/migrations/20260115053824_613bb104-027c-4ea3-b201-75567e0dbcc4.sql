-- Drop existing delete policy
DROP POLICY IF EXISTS "Authorized users can delete tasks" ON public.tasks;

-- Create new delete policy: task creator, HR department, or CEO/COO can delete
CREATE POLICY "Creator HR or CEOCOO can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (
  -- Task creator can delete their own tasks
  (created_by = (SELECT full_name FROM profiles WHERE user_id = auth.uid()))
  OR
  -- HR department members can delete any task
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND department = 'HR'
  ))
  OR
  -- CEO/COO role can delete any task
  has_role(auth.uid(), 'ceo_coo'::app_role)
  OR
  -- Superadmin/Admin can also delete
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = ANY (ARRAY['superadmin'::text, 'admin'::text])
  ))
);