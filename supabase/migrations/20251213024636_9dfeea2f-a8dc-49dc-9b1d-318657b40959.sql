-- Create companies table for CRM
CREATE TABLE public.crm_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT,
  geography TEXT,
  investment_thesis TEXT,
  status TEXT NOT NULL DEFAULT 'research',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funds table for CRM
CREATE TABLE public.crm_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fund_name TEXT NOT NULL,
  strategy TEXT,
  asset_class TEXT,
  geography TEXT,
  manager TEXT,
  status TEXT NOT NULL DEFAULT 'screening',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_funds ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies
CREATE POLICY "Approved users can view their own companies"
ON public.crm_companies FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own companies"
ON public.crm_companies FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own companies"
ON public.crm_companies FOR UPDATE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own companies"
ON public.crm_companies FOR DELETE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- RLS policies for funds
CREATE POLICY "Approved users can view their own funds"
ON public.crm_funds FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own funds"
ON public.crm_funds FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own funds"
ON public.crm_funds FOR UPDATE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own funds"
ON public.crm_funds FOR DELETE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_crm_companies_updated_at
BEFORE UPDATE ON public.crm_companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_funds_updated_at
BEFORE UPDATE ON public.crm_funds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();