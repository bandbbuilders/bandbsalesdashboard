-- Add position and department to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS department text;

-- Create chat messages table for company-wide and direct messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received, or company-wide messages
CREATE POLICY "Users can view their messages" ON public.chat_messages
FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  receiver_id IS NULL
);

-- Policy: Users can send messages
CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update their own messages (mark as read)
CREATE POLICY "Users can update messages" ON public.chat_messages
FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;