-- Add completed_at column to tasks table for tracking when tasks are marked as done
ALTER TABLE public.tasks 
ADD COLUMN completed_at timestamp with time zone DEFAULT NULL;