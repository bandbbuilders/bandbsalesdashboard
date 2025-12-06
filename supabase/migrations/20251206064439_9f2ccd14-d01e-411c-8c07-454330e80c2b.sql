-- Update the handle_new_user function to include position and department
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, position, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user'),
    NEW.raw_user_meta_data ->> 'position',
    NEW.raw_user_meta_data ->> 'department'
  );
  RETURN NEW;
END;
$$;