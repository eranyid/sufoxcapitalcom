-- Add deleted_at column to all critical tables for soft delete

-- Transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Valuations
ALTER TABLE public.valuations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- CRM Companies
ALTER TABLE public.crm_companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- CRM Funds
ALTER TABLE public.crm_funds ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- CRM Tasks
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- CRM Projects
ALTER TABLE public.crm_projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for efficient querying of non-deleted items
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_valuations_deleted_at ON public.valuations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_companies_deleted_at ON public.crm_companies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_funds_deleted_at ON public.crm_funds(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_tasks_deleted_at ON public.crm_tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_projects_deleted_at ON public.crm_projects(deleted_at) WHERE deleted_at IS NULL;

-- Function to permanently delete items older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.transactions WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days';
  DELETE FROM public.valuations WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days';
  DELETE FROM public.crm_tasks WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days';
  DELETE FROM public.crm_companies WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days';
  DELETE FROM public.crm_funds WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days';
  DELETE FROM public.crm_projects WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days';
END;
$$;