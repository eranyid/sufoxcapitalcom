-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('policy-documents', 'policy-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own policy documents
CREATE POLICY "Users can upload policy documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own policy documents
CREATE POLICY "Users can view their policy documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own policy documents
CREATE POLICY "Users can delete their policy documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own policy documents
CREATE POLICY "Users can update their policy documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'policy-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);