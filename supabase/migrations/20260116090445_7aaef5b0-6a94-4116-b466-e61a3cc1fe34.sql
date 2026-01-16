-- Step 1: Drop the broken foreign key constraint that references public.users
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_agent_id_fkey;

-- Step 2: Update any sales with demo/fake agent_ids to use a real user (Sara Memon)
UPDATE public.sales 
SET agent_id = '2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0'
WHERE agent_id NOT IN (SELECT id FROM auth.users);

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
ALTER TABLE public.sales 
ADD CONSTRAINT sales_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES public.profiles(user_id) ON DELETE RESTRICT;