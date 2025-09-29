-- Temporarily allow unauthenticated access to leads data
-- While keeping user-specific data protected

-- Update leads RLS policies to allow unauthenticated access for now
DROP POLICY IF EXISTS "Authenticated users can view leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON leads;

CREATE POLICY "Allow public access to leads" 
ON leads FOR ALL 
USING (true);

-- Keep reminders restricted to authenticated users only
-- (these policies are already correct)