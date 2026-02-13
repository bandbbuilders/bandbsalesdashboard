-- 1. Wipe all dummy/mock data from social media tables
TRUNCATE public.social_leads CASCADE;
TRUNCATE public.social_posts CASCADE;
TRUNCATE public.social_metrics CASCADE;
TRUNCATE public.social_accounts CASCADE;

-- 2. Update Instagram App Settings with the NEW credentials
INSERT INTO public.social_settings (platform, app_id, app_secret, redirect_uri)
VALUES ('instagram', '1448575243524827', '53232850ee3cf4059aeda99041eb01e2', 'https://bandbsalesdashboard.vercel.app/social/callback')
ON CONFLICT (platform) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  app_secret = EXCLUDED.app_secret,
  updated_at = now();

-- 3. Manually create the primary account with the provided Long-Lived Access Token for Zain
-- This bypasses the need for him to go through OAuth right now if he wants it active immediately
INSERT INTO public.social_accounts (
  user_id, 
  platform, 
  account_name, 
  username, 
  platform_account_id, 
  access_token, 
  is_active, 
  last_synced_at
)
VALUES (
  'fab190bd-3c71-43e8-9385-3ec66044e501', 
  'instagram', 
  'B&B Real Estate Official', -- Placeholder name, will update on first sync
  'bandb_official',           -- Placeholder, will update on first sync
  'initial_setup',            -- Will be corrected on first API call
  'EAAUleLTSGtsBQucgPU8ZAiojKD3bGQous9xN2q6QtnqPom70RDceil1GiDXy69sSOixE4OLdSJMTnIV4np1LHmUx2gFrZCdDugeEyGZAyeDtwRCoew7VNrDUybn5JgQ7oe5EBkYOhOZBZBJiGnYm0py0GDKfL7RRcpYNwL2vkJTsa5LuRx2YG2aDvZBpVmh70qflY5zJyPvZCq86CrC2ApdWImDzIdeRwS7l18RhcNmszg9ruFF7UlZAKrPYB1BVvpNrIFZBqxu5T3GUefQlkZC4bT',
  true,
  now()
);
