-- Fix 1: Add RLS policies to rate_limits table to restrict access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access rate_limits (no public access)
CREATE POLICY "No public access to rate_limits"
ON public.rate_limits
FOR ALL
USING (false);

-- Fix 2: Add explicit policy to deny anonymous access on profiles
-- First, let's check and add a policy that explicitly requires authentication
CREATE POLICY "Only authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Remove any existing permissive policies for anonymous users by replacing with authenticated-only
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Fix 3: Strengthen passkey_credentials to ensure no anonymous access
DROP POLICY IF EXISTS "Users can view their own passkeys" ON public.passkey_credentials;
CREATE POLICY "Users can view their own passkeys"
ON public.passkey_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix 4: Ensure user_google_tokens has proper RLS
DROP POLICY IF EXISTS "Users can view their own Google tokens" ON public.user_google_tokens;
CREATE POLICY "Users can view their own Google tokens"
ON public.user_google_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own Google tokens" ON public.user_google_tokens;
CREATE POLICY "Users can insert their own Google tokens"
ON public.user_google_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own Google tokens" ON public.user_google_tokens;
CREATE POLICY "Users can update their own Google tokens"
ON public.user_google_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own Google tokens" ON public.user_google_tokens;
CREATE POLICY "Users can delete their own Google tokens"
ON public.user_google_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);