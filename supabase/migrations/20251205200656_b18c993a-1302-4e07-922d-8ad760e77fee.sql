-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view own or admin can view all" ON public.profiles;

-- Create a new policy that explicitly requires authentication
CREATE POLICY "Authenticated users can view own or admin can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND ((auth.uid() = id) OR is_admin(auth.uid()))
);

-- Also fix passkey_credentials table
DROP POLICY IF EXISTS "Users can view their own passkeys" ON public.passkey_credentials;

CREATE POLICY "Authenticated users can view their own passkeys" 
ON public.passkey_credentials 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);