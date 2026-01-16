-- Fix today's incorrectly marked attendance (check-in before 10:20 AM should not be late)
UPDATE attendance 
SET is_late = false, status = 'present' 
WHERE date = CURRENT_DATE 
AND check_in <= '10:20:00' 
AND is_late = true;

-- Add approval tracking columns to fines table
ALTER TABLE fines ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE fines ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;