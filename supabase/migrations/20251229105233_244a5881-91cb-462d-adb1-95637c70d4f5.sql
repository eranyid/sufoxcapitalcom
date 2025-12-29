-- Add linked_company_id column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN linked_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_transactions_linked_company ON public.transactions(linked_company_id) WHERE linked_company_id IS NOT NULL;