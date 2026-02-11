
-- Allow approved users to see other approved users for messaging
CREATE POLICY "Approved users can see other approved users"
ON public.profiles
FOR SELECT
USING (
  is_user_approved(auth.uid()) AND is_approved = true
);
