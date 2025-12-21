-- Add category column to company_files
ALTER TABLE public.company_files 
ADD COLUMN category TEXT DEFAULT 'Other';

-- Create index for category filtering
CREATE INDEX idx_company_files_category ON public.company_files(category);