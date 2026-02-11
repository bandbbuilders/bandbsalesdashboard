-- Consolidated migration for chat groups and members
-- Create chat groups table
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  image_url text
);

-- Create chat group members table
CREATE TABLE IF NOT EXISTS public.chat_group_members (
  group_id uuid REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Add group_id to chat_messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'group_id') THEN
        ALTER TABLE public.chat_messages ADD COLUMN group_id uuid REFERENCES public.chat_groups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- Policies for chat_groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.chat_groups;
CREATE POLICY "Users can view groups they are members of" ON public.chat_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE group_id = public.chat_groups.id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;
CREATE POLICY "Users can create groups" ON public.chat_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policies for chat_group_members
DROP POLICY IF EXISTS "Members can view other members" ON public.chat_group_members;
CREATE POLICY "Members can view other members" ON public.chat_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members m
      WHERE m.group_id = public.chat_group_members.group_id
      AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join/leave groups" ON public.chat_group_members;
CREATE POLICY "Users can join/leave groups" ON public.chat_group_members
  FOR INSERT WITH CHECK (true);

-- Storage for Chat Attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Authenticated users can read chat files" ON storage.objects;
CREATE POLICY "Authenticated users can read chat files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'chat-attachments');

-- Update chat_messages policy to allow viewing group messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.chat_messages;
CREATE POLICY "Users can view their messages" ON public.chat_messages
FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  receiver_id IS NULL OR
  (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE group_id = public.chat_messages.group_id
      AND user_id = auth.uid()
  ))
);

-- Ensure INSERT policy exists for chat_messages
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Safely enable Realtime
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
