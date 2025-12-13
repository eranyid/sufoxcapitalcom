-- Add market_cap column to crm_companies
ALTER TABLE public.crm_companies ADD COLUMN market_cap text;

-- Remove priority column (optional data will be lost)
ALTER TABLE public.crm_companies DROP COLUMN priority;