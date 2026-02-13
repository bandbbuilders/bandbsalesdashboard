-- Social Media Configuration
CREATE TABLE IF NOT EXISTS public.social_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE CHECK (platform IN ('tiktok', 'youtube', 'facebook', 'instagram')),
  app_id text NOT NULL,
  app_secret text NOT NULL,
  redirect_uri text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

-- Only admins/CEO/COO can view or manage settings
-- Based on the existing pattern: Zain Sarwar's ID is fab190bd-3c71-43e8-9385-3ec66044e501
CREATE POLICY "Admins can manage social settings" ON public.social_settings
  FOR ALL USING (
    auth.uid() = 'fab190bd-3c71-43e8-9385-3ec66044e501' OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ceo_coo')
    )
  );

-- Insert the provided Instagram credentials
INSERT INTO public.social_settings (platform, app_id, app_secret, redirect_uri)
VALUES ('instagram', '4329369610634668', '39a853124cc0dc395fe194360cae4322', 'https://bandbsalesdashboard.vercel.app/social/callback')
ON CONFLICT (platform) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  app_secret = EXCLUDED.app_secret,
  redirect_uri = EXCLUDED.redirect_uri,
  updated_at = now();
