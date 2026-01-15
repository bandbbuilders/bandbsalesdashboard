-- Create a trigger function to automatically set created_by to the logged-in user's name
CREATE OR REPLACE FUNCTION public.set_task_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
BEGIN
  -- Get the full_name of the logged-in user from profiles
  SELECT full_name INTO creator_name
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Set created_by to the creator's name (override any value passed from frontend)
  IF creator_name IS NOT NULL THEN
    NEW.created_by := creator_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on tasks table
DROP TRIGGER IF EXISTS set_task_created_by_trigger ON public.tasks;
CREATE TRIGGER set_task_created_by_trigger
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_created_by();

-- Fix the existing "Issues in software" task
UPDATE public.tasks
SET created_by = 'Abu Huraira Butt'
WHERE title = 'Issues in software'
  AND created_by = 'Zain Sarwar';