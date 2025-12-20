-- Create company_research_entries table for per-company Calculator & Q&A log
CREATE TABLE public.company_research_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  ticker TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  entry_type TEXT NOT NULL DEFAULT 'NOTE',
  title TEXT NOT NULL,
  question_text TEXT,
  calculator_type TEXT,
  inputs_json JSONB DEFAULT '{}'::jsonb,
  outputs_json JSONB DEFAULT '{}'::jsonb,
  output_summary TEXT,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE',
  related_holding_id UUID,
  tags TEXT[] DEFAULT '{}',
  
  CONSTRAINT company_research_entries_entry_type_check CHECK (entry_type IN ('QUESTION', 'CALCULATION', 'ANSWER', 'NOTE')),
  CONSTRAINT company_research_entries_visibility_check CHECK (visibility IN ('PRIVATE', 'TEAM'))
);

-- Enable RLS
ALTER TABLE public.company_research_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own research entries"
ON public.company_research_entries FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own research entries"
ON public.company_research_entries FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own research entries"
ON public.company_research_entries FOR UPDATE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own research entries"
ON public.company_research_entries FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create indexes for fast queries
CREATE INDEX idx_company_research_entries_company_id ON public.company_research_entries(company_id);
CREATE INDEX idx_company_research_entries_ticker ON public.company_research_entries(ticker);
CREATE INDEX idx_company_research_entries_entry_type ON public.company_research_entries(entry_type);
CREATE INDEX idx_company_research_entries_created_at ON public.company_research_entries(created_at DESC);
CREATE INDEX idx_company_research_entries_tags ON public.company_research_entries USING GIN(tags);

-- Trigger for updated_at
CREATE TRIGGER update_company_research_entries_updated_at
BEFORE UPDATE ON public.company_research_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();