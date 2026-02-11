-- Fix for infinite recursion in chat_group_members policy
-- This happens when a policy for a table queries the same table in a loop.

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Members can view other members" ON public.chat_group_members;

-- 2. Create a simplified, non-recursive policy
-- We'll allow all authenticated users to see group memberships for now.
-- This breaks the recursion loop safely.
CREATE POLICY "Members can view other members" ON public.chat_group_members
  FOR SELECT TO authenticated USING (true);

-- 3. Ensure other policies are robust
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
