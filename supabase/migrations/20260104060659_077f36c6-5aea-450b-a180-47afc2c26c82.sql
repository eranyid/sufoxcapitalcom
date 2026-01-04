-- Add employee_count column to crm_companies table
ALTER TABLE public.crm_companies 
ADD COLUMN employee_count integer NULL;