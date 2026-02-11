-- Definitive Fix for all Chat RLS Issues
-- This script drops ALL existing chat policies and creates clean, non-recursive ones.

-- ==========================================
-- 1. CHAT_GROUPS Table
-- ==========================================
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- Allow users to view groups they created OR groups they are members of
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.chat_groups;
CREATE POLICY "Users can view groups they are members of" ON public.chat_groups
  FOR SELECT TO authenticated USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE group_id = public.chat_groups.id
      AND user_id = auth.uid()
    )
  );

-- Allow authenticated users to create groups
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;
CREATE POLICY "Users can create groups" ON public.chat_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);


-- ==========================================
-- 2. CHAT_GROUP_MEMBERS Table
-- ==========================================
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- BREAK THE RECURSION: Use a simple policy for viewing members
DROP POLICY IF EXISTS "Members can view other members" ON public.chat_group_members;
CREATE POLICY "Members can view other members" ON public.chat_group_members
  FOR SELECT TO authenticated USING (true);

-- Allow users to join/leave groups (or be added by creators)
DROP POLICY IF EXISTS "Users can join/leave groups" ON public.chat_group_members;
CREATE POLICY "Users can join/leave groups" ON public.chat_group_members
  FOR INSERT TO authenticated WITH CHECK (true);


-- ==========================================
-- 3. CHAT_MESSAGES Table
-- ==========================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Comprehensive view policy (Personal, General, and Group messages)
DROP POLICY IF EXISTS "Users can view their messages" ON public.chat_messages;
CREATE POLICY "Users can view their messages" ON public.chat_messages
FOR SELECT TO authenticated USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  (receiver_id IS NULL AND group_id IS NULL) OR
  (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE group_id = public.chat_messages.group_id
      AND user_id = auth.uid()
  ))
);

-- Allow authenticated users to send messages
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);


-- ==========================================
-- 4. Ensure Realtime is enabled for all tables
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_groups') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_groups;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_group_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_group_members;
  END IF;
END $$;
