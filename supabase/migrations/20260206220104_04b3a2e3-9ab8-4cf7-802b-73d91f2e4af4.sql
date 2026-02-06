
-- Fix: Allow conversation creator to see their conversation (before participants are added)
DROP POLICY "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_conversation_member(auth.uid(), id)
);
