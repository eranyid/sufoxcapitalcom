-- Add inception_year column to crm_companies table
ALTER TABLE public.crm_companies 
ADD COLUMN inception_year integer;