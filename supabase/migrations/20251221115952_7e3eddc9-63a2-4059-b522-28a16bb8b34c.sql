-- Add order_index column for file ordering within categories
ALTER TABLE public.company_files 
ADD COLUMN order_index INTEGER DEFAULT 0;

-- Create index for ordering
CREATE INDEX idx_company_files_order ON public.company_files(company_id, category, order_index);