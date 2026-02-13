-- Migration to fix Social Media Module RLS and Schema
-- 1. Fix social_leads: add unique constraint on comment_id for upsert logic
ALTER TABLE public.social_leads ADD CONSTRAINT social_leads_comment_id_key UNIQUE (comment_id);

-- 2. Fix social_posts: expand media_type check and add missing RLS policies
ALTER TABLE public.social_posts DROP CONSTRAINT IF EXISTS social_posts_media_type_check;
ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_media_type_check CHECK (media_type IN ('image', 'video', 'carousel', 'carousel_album'));

CREATE POLICY "Users can insert posts for their accounts" ON public.social_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.social_accounts
      WHERE id = public.social_posts.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts for their accounts" ON public.social_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts
      WHERE id = public.social_posts.account_id
      AND user_id = auth.uid()
    )
  );

-- 3. Fix social_metrics: add missing RLS policies
CREATE POLICY "Users can insert metrics for their accounts" ON public.social_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.social_accounts
      WHERE id = public.social_metrics.account_id
      AND user_id = auth.uid()
    )
  );

-- 4. Fix social_accounts: ensure user can update last_synced_at
CREATE POLICY "Users can update their own social accounts" ON public.social_accounts
  FOR UPDATE USING (auth.uid() = user_id);
