-- Fix profiles SELECT policy - remove redundant auth check
DROP POLICY IF EXISTS "Authenticated users can view own or admin can view all" ON public.profiles;

CREATE POLICY "Users can view own profile or admin can view all" 
ON public.profiles 
FOR SELECT 
USING ((auth.uid() = id) OR is_admin(auth.uid()));

-- Fix passkey_credentials SELECT policy - remove redundant auth check  
DROP POLICY IF EXISTS "Authenticated users can view their own passkeys" ON public.passkey_credentials;

CREATE POLICY "Users can view their own passkeys" 
ON public.passkey_credentials 
FOR SELECT 
USING (auth.uid() = user_id);