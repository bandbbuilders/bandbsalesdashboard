-- Drop all foreign key constraints first
ALTER TABLE public.content_tasks 
DROP CONSTRAINT IF EXISTS content_tasks_assigned_to_fkey,
DROP CONSTRAINT IF EXISTS content_tasks_created_by_fkey;

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey,
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

-- Now change column types to text
ALTER TABLE public.content_tasks 
ALTER COLUMN assigned_to TYPE text,
ALTER COLUMN created_by TYPE text;

ALTER TABLE public.tasks 
ALTER COLUMN assigned_to TYPE text,
ALTER COLUMN created_by TYPE text;