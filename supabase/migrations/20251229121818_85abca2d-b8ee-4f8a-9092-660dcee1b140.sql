-- Add linked_company_id column to valuations table
ALTER TABLE public.valuations 
ADD COLUMN linked_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_valuations_linked_company_id ON public.valuations(linked_company_id);