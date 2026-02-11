-- Migration to fix user permissions for Social Media module visibility
-- This script safely updates the user 'Zain Sarwar' to have CEO/COO permissions

DO $$
DECLARE
  target_user_id UUID;
  user_email TEXT;
BEGIN
  -- 1. Try to find by specific ID first (The one we think it is)
  SELECT id, email INTO target_user_id, user_email 
  FROM auth.users 
  WHERE id = 'fab190bd-3c71-43e8-9381-3ec66044e501';

  -- 2. If not found, try to find by email (Zain Sarwar)
  IF target_user_id IS NULL THEN
    SELECT id, email INTO target_user_id, user_email 
    FROM auth.users 
    WHERE email ILIKE '%zain%' OR email ILIKE '%sarwar%' 
    LIMIT 1;
  END IF;

  -- 3. If we found a user, update their permissions
  IF target_user_id IS NOT NULL THEN
    RAISE NOTICE 'Updating permissions for user: % (ID: %)', user_email, target_user_id;

    -- Update Profile to be CEO/COO and Management
    UPDATE public.profiles
    SET 
      position = 'CEO/COO',
      department = 'Management',
      updated_at = now()
    WHERE user_id = target_user_id;

    -- Ensure they have the ceo_coo role in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'ceo_coo')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'ceo_coo', updated_at = now();

    RAISE NOTICE 'Successfully updated user permissions.';
  ELSE
    RAISE NOTICE 'WARNING: Could not find user Zain Sarwar to update permissions.';
  END IF;
END $$;
