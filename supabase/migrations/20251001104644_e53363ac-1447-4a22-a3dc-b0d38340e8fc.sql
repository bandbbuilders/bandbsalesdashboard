-- Temporarily allow public access to reminders for demo mode
-- Update reminders RLS policies to allow public access temporarily

DROP POLICY IF EXISTS "Authenticated users can view reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can insert reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can update reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can delete reminders" ON reminders;

CREATE POLICY "Allow public access to reminders" 
ON reminders FOR ALL 
USING (true);