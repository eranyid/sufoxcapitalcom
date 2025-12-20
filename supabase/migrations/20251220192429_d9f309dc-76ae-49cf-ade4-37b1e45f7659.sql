-- Add new fields to crm_companies for investment thesis sections
ALTER TABLE public.crm_companies
ADD COLUMN IF NOT EXISTS thesis_summary text,
ADD COLUMN IF NOT EXISTS confidence_level text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS why_we_own text,
ADD COLUMN IF NOT EXISTS time_horizon text,
ADD COLUMN IF NOT EXISTS valuation_logic text,
ADD COLUMN IF NOT EXISTS exit_criteria text,
ADD COLUMN IF NOT EXISTS key_risks text,
ADD COLUMN IF NOT EXISTS business_description text;

-- Create a decision log table for investment decisions
CREATE TABLE IF NOT EXISTS public.company_decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  decision_date date NOT NULL DEFAULT CURRENT_DATE,
  decision_type text NOT NULL, -- 'buy', 'sell', 'hold', 'increase', 'decrease', 'initiate', 'exit'
  rationale text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_decisions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Approved users can view their own decisions"
ON public.company_decisions FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own decisions"
ON public.company_decisions FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own decisions"
ON public.company_decisions FOR UPDATE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own decisions"
ON public.company_decisions FOR DELETE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_company_decisions_updated_at
BEFORE UPDATE ON public.company_decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Link tasks to companies (add company_id to crm_tasks)
ALTER TABLE public.crm_tasks
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL;