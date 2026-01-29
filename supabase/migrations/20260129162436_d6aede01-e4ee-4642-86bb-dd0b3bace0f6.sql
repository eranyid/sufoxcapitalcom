-- Create enum for dimension types
CREATE TYPE target_dimension_type AS ENUM ('geography', 'asset_class', 'bucket');

-- Create target_allocations table
CREATE TABLE public.target_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Primary Target',
  is_active BOOLEAN NOT NULL DEFAULT false,
  objective TEXT NOT NULL DEFAULT 'balanced',
  horizon TEXT NOT NULL DEFAULT 'long_term',
  risk_level TEXT NOT NULL DEFAULT 'medium',
  constraints_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create target_allocation_lines table
CREATE TABLE public.target_allocation_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id UUID NOT NULL REFERENCES public.target_allocations(id) ON DELETE CASCADE,
  dimension_type target_dimension_type NOT NULL,
  key TEXT NOT NULL,
  parent_key TEXT,
  target_weight NUMERIC NOT NULL DEFAULT 0,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.target_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_allocation_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies for target_allocations
CREATE POLICY "Users can view their own target allocations"
  ON public.target_allocations FOR SELECT
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own target allocations"
  ON public.target_allocations FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own target allocations"
  ON public.target_allocations FOR UPDATE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own target allocations"
  ON public.target_allocations FOR DELETE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- RLS policies for target_allocation_lines (via join to parent)
CREATE POLICY "Users can view their target allocation lines"
  ON public.target_allocation_lines FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.target_allocations ta
    WHERE ta.id = target_id AND ta.user_id = auth.uid() AND is_user_approved(auth.uid())
  ));

CREATE POLICY "Users can create their target allocation lines"
  ON public.target_allocation_lines FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.target_allocations ta
    WHERE ta.id = target_id AND ta.user_id = auth.uid() AND is_user_approved(auth.uid())
  ));

CREATE POLICY "Users can update their target allocation lines"
  ON public.target_allocation_lines FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.target_allocations ta
    WHERE ta.id = target_id AND ta.user_id = auth.uid() AND is_user_approved(auth.uid())
  ));

CREATE POLICY "Users can delete their target allocation lines"
  ON public.target_allocation_lines FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.target_allocations ta
    WHERE ta.id = target_id AND ta.user_id = auth.uid() AND is_user_approved(auth.uid())
  ));

-- Trigger for updated_at
CREATE TRIGGER update_target_allocations_updated_at
  BEFORE UPDATE ON public.target_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();