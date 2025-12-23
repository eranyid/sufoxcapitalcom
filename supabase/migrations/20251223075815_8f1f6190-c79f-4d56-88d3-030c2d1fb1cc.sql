-- Remove SELECT policy from user_google_tokens to prevent client-side access to OAuth tokens
-- OAuth tokens should only be accessed server-side via edge functions with service role
DROP POLICY IF EXISTS "Users can view their own tokens" ON user_google_tokens;