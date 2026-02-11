-- Add status column to employee_details table
ALTER TABLE employee_details ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing records to 'active' if they are null
UPDATE employee_details SET status = 'active' WHERE status IS NULL;
