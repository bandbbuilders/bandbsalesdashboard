-- Add assignment workflow columns to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'pending' 
    CHECK (assignment_status IN ('pending', 'accepted', 'rejected', 'review_requested')),
  ADD COLUMN IF NOT EXISTS review_comment TEXT;

-- Update existing tasks to have 'accepted' status if they are already in progress or done
UPDATE tasks 
SET assignment_status = 'accepted' 
WHERE status IN ('in_progress', 'done', 'review') 
  AND assignment_status = 'pending';

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_assignment_status ON tasks(assignment_status);
