-- Fix RLS policies to require authentication for data access
-- This will fix the reminders page and other security issues

-- Update reminders RLS policies to require authentication
DROP POLICY IF EXISTS "Users can view reminders" ON reminders;
DROP POLICY IF EXISTS "Users can insert reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete reminders" ON reminders;

CREATE POLICY "Authenticated users can view reminders" 
ON reminders FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert reminders" 
ON reminders FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id);

CREATE POLICY "Authenticated users can update reminders" 
ON reminders FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid()::text = user_id);

CREATE POLICY "Authenticated users can delete reminders" 
ON reminders FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid()::text = user_id);

-- Update leads RLS policies to require authentication
DROP POLICY IF EXISTS "Users can view all leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads" ON leads;
DROP POLICY IF EXISTS "Users can delete leads" ON leads;

CREATE POLICY "Authenticated users can view leads" 
ON leads FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert leads" 
ON leads FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update leads" 
ON leads FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete leads" 
ON leads FOR DELETE 
USING (auth.uid() IS NOT NULL);