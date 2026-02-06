
-- Drop the recursive policy
DROP POLICY "Users can view participants of their conversations" ON public.conversation_participants;

-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Recreate policy using the function
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT TO authenticated
USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Also fix the messages policy which has the same pattern
DROP POLICY "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT TO authenticated
USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Fix the messages insert policy too
DROP POLICY "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_conversation_member(auth.uid(), conversation_id)
);

-- Also fix conversations SELECT policy (it references conversation_participants too)
DROP POLICY "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (public.is_conversation_member(auth.uid(), id));

-- Fix participant INSERT policy
DROP POLICY "Users can add participants to conversations they created" ON public.conversation_participants;
CREATE POLICY "Users can add participants to conversations they created"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND created_by = auth.uid()
  )
  OR user_id = auth.uid()
);
