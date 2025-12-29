-- Create reports table for storing report templates and configurations
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_size TEXT NOT NULL DEFAULT 'A4',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own reports"
ON public.reports
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own reports"
ON public.reports
FOR UPDATE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own reports"
ON public.reports
FOR DELETE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying
CREATE INDEX idx_reports_user_id ON public.reports(user_id);