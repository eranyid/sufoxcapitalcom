-- Add is_approved and email fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

-- Update the handle_new_user function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, is_approved, approval_status)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'display_name',
    new.email,
    false,
    'pending'
  );
  RETURN new;
END;
$$;

-- Create admin check function (security definer to avoid RLS issues)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND p.email = 'eran.yidgar@sufoxcapital.com'
  )
$$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Update profiles RLS: Allow admin to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own or admin can view all"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR public.is_admin(auth.uid())
);

-- Allow admin to update any profile (for approve/reject)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update own or admin can update all"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id 
  OR public.is_admin(auth.uid())
);

-- Update RLS on main app tables to only allow approved users
-- Transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Approved users can view their own transactions"
ON public.transactions FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Approved users can create their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Approved users can update their own transactions"
ON public.transactions FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Approved users can delete their own transactions"
ON public.transactions FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

-- Valuations table
DROP POLICY IF EXISTS "Users can view their own valuations" ON public.valuations;
CREATE POLICY "Approved users can view their own valuations"
ON public.valuations FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own valuations" ON public.valuations;
CREATE POLICY "Approved users can create their own valuations"
ON public.valuations FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own valuations" ON public.valuations;
CREATE POLICY "Approved users can update their own valuations"
ON public.valuations FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own valuations" ON public.valuations;
CREATE POLICY "Approved users can delete their own valuations"
ON public.valuations FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

-- Portfolio settings table
DROP POLICY IF EXISTS "Users can view their own settings" ON public.portfolio_settings;
CREATE POLICY "Approved users can view their own settings"
ON public.portfolio_settings FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own settings" ON public.portfolio_settings;
CREATE POLICY "Approved users can create their own settings"
ON public.portfolio_settings FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.portfolio_settings;
CREATE POLICY "Approved users can update their own settings"
ON public.portfolio_settings FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

-- Cash balances table
DROP POLICY IF EXISTS "Users can view their own cash balances" ON public.cash_balances;
CREATE POLICY "Approved users can view their own cash balances"
ON public.cash_balances FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own cash balances" ON public.cash_balances;
CREATE POLICY "Approved users can create their own cash balances"
ON public.cash_balances FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own cash balances" ON public.cash_balances;
CREATE POLICY "Approved users can update their own cash balances"
ON public.cash_balances FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

-- Investment policies table
DROP POLICY IF EXISTS "Users can view their own policy" ON public.investment_policies;
CREATE POLICY "Approved users can view their own policy"
ON public.investment_policies FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own policy" ON public.investment_policies;
CREATE POLICY "Approved users can create their own policy"
ON public.investment_policies FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own policy" ON public.investment_policies;
CREATE POLICY "Approved users can update their own policy"
ON public.investment_policies FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

-- Custom scenarios table
DROP POLICY IF EXISTS "Users can view their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can view their own scenarios"
ON public.custom_scenarios FOR SELECT
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can create their own scenarios"
ON public.custom_scenarios FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can update their own scenarios"
ON public.custom_scenarios FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can delete their own scenarios"
ON public.custom_scenarios FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_user_approved(auth.uid())
);