-- Fix is_admin() to use the user_roles table instead of hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- Ensure the admin user has a role in user_roles table
-- First, get the user id for the admin email and insert if not exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'eran.yidgar@sufoxcapital.com'
ON CONFLICT (user_id, role) DO NOTHING;