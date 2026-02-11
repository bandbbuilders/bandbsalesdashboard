-- Social Media Module Schema
-- Supports TikTok, YouTube, Facebook, and Instagram integration

-- 1. Social Accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'facebook', 'instagram')),
  platform_account_id text,
  account_name text,
  username text,
  profile_image_url text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, platform, platform_account_id)
);

-- 2. Social Posts table
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform_post_id text NOT NULL,
  content text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video', 'carousel')),
  posted_at timestamp with time zone,
  engagement_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(account_id, platform_post_id)
);

-- 3. Social Metrics table (for historical tracking)
CREATE TABLE IF NOT EXISTS public.social_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  recorded_at timestamp with time zone DEFAULT now()
);

-- 4. Social Leads table
CREATE TABLE IF NOT EXISTS public.social_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  post_id text,
  comment_id text,
  commenter_name text,
  commenter_username text,
  comment_content text,
  intent_score text CHECK (intent_score IN ('high', 'medium', 'low', 'none')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'ignored')),
  captured_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own social accounts" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view posts for their accounts" ON public.social_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts
      WHERE id = public.social_posts.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view metrics for their accounts" ON public.social_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts
      WHERE id = public.social_metrics.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view leads for their accounts" ON public.social_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts
      WHERE id = public.social_leads.account_id
      AND user_id = auth.uid()
    )
  );

-- Function to handle lead classification (intent tagging)
-- This is a placeholder for actual keyword analysis logic
CREATE OR REPLACE FUNCTION public.classify_social_lead_intent(content text) 
RETURNS text AS $$
DECLARE
  high_keywords text[] := ARRAY['info', 'details', 'check', 'price', 'cost', 'buy', 'interested', 'location'];
  medium_keywords text[] := ARRAY['wow', 'great', 'nice', 'good', 'how', 'when'];
BEGIN
  content := lower(content);
  IF EXISTS (SELECT 1 FROM unnest(high_keywords) k WHERE content LIKE '%' || k || '%') THEN
    RETURN 'high';
  ELSIF EXISTS (SELECT 1 FROM unnest(medium_keywords) k WHERE content LIKE '%' || k || '%') THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to classify intent on insert
CREATE OR REPLACE FUNCTION public.trigger_classify_social_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.intent_score IS NULL THEN
    NEW.intent_score := public.classify_social_lead_intent(NEW.comment_content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classify_social_lead_trigger
BEFORE INSERT ON public.social_leads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_classify_social_lead();
