-- Add ticker field to crm_companies for linking with transactions
ALTER TABLE public.crm_companies 
ADD COLUMN IF NOT EXISTS ticker text;

-- Add source_transaction_id to track which transaction created the row
ALTER TABLE public.crm_companies 
ADD COLUMN IF NOT EXISTS source_transaction_id uuid;

-- Add is_auto_linked flag to indicate auto-created rows
ALTER TABLE public.crm_companies 
ADD COLUMN IF NOT EXISTS is_auto_linked boolean DEFAULT false;

-- Create unique constraint on (user_id, project_id, ticker) for upsert logic
-- First drop if exists to avoid conflicts
ALTER TABLE public.crm_companies 
DROP CONSTRAINT IF EXISTS crm_companies_user_project_ticker_unique;

CREATE UNIQUE INDEX IF NOT EXISTS crm_companies_user_project_ticker_idx 
ON public.crm_companies (user_id, project_id, ticker) 
WHERE ticker IS NOT NULL;

-- Create crm_activity_log table for auditability
CREATE TABLE IF NOT EXISTS public.crm_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.crm_projects(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  action text NOT NULL CHECK (action IN ('auto_add_ongoing', 'auto_move_old_exits', 'manual_edit')),
  source_transaction_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on crm_activity_log
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_activity_log
CREATE POLICY "Approved users can view their own activity logs"
ON public.crm_activity_log
FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own activity logs"
ON public.crm_activity_log
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS crm_activity_log_user_project_idx 
ON public.crm_activity_log (user_id, project_id);

CREATE INDEX IF NOT EXISTS crm_activity_log_ticker_idx 
ON public.crm_activity_log (ticker);

-- Add trigger for updated_at on crm_companies (if not exists)
DROP TRIGGER IF EXISTS update_crm_companies_updated_at ON public.crm_companies;
CREATE TRIGGER update_crm_companies_updated_at
BEFORE UPDATE ON public.crm_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();