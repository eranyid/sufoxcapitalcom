-- Add asset_type column to crm_companies table
ALTER TABLE public.crm_companies 
ADD COLUMN asset_type text DEFAULT 'equity';