-- Create company_files table
CREATE TABLE public.company_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view files for their companies"
ON public.company_files FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can upload files to their companies"
ON public.company_files FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own files"
ON public.company_files FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create index
CREATE INDEX idx_company_files_company_id ON public.company_files(company_id);

-- Create storage bucket for company files
INSERT INTO storage.buckets (id, name, public) VALUES ('company-files', 'company-files', false);

-- Storage policies
CREATE POLICY "Users can view their company files"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload company files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their company files"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-files' AND auth.uid()::text = (storage.foldername(name))[1]);