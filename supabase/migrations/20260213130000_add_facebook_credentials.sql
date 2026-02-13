-- Add Facebook credentials to social_settings
INSERT INTO public.social_settings (platform, app_id, app_secret, redirect_uri)
VALUES ('facebook', '1699723950991347', '8c821246a61ef958cf02d6eb207e7991', 'https://bandbsalesdashboard.vercel.app/social/callback')
ON CONFLICT (platform) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  app_secret = EXCLUDED.app_secret,
  redirect_uri = EXCLUDED.redirect_uri,
  updated_at = now();
