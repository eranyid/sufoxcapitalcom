-- Create a trigger function to prevent users from self-approving
-- Only admins can modify is_approved and approval_status fields
CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is not an admin, preserve the original approval fields
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.is_approved := OLD.is_approved;
    NEW.approval_status := OLD.approval_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on profiles table
CREATE TRIGGER prevent_self_approval_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();