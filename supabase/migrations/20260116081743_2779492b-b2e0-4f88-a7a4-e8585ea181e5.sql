-- Step 1: Drop the broken foreign key constraint that references public.users
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;

-- Step 2: Delete orphan reminders with fake/demo user IDs that don't exist in auth.users
DELETE FROM public.reminders 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 3: Backfill profiles for any auth users that don't have one yet
INSERT INTO public.profiles (user_id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'role', 'user')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Add the correct foreign key to profiles(user_id)
ALTER TABLE public.reminders 
ADD CONSTRAINT reminders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;