-- Add task_id column to fines table for task-based fines
ALTER TABLE public.fines 
ADD COLUMN task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_fines_task_id ON public.fines(task_id);

-- Create RLS policy to allow managers to create fines for tasks
CREATE POLICY "Managers can create task fines"
ON public.fines
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'ceo_coo')
  )
);