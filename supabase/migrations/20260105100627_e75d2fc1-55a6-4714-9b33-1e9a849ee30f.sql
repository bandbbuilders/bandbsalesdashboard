-- Drop the existing role check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add updated constraint that includes 'user' role
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('superadmin', 'admin', 'manager', 'employee', 'user'));