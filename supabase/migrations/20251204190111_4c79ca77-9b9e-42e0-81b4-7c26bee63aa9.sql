-- Create custom_scenarios table for user-defined scenarios
CREATE TABLE public.custom_scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'custom',
  description text,
  horizon text NOT NULL DEFAULT '1m',
  shocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_scenarios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scenarios"
ON public.custom_scenarios
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenarios"
ON public.custom_scenarios
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
ON public.custom_scenarios
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
ON public.custom_scenarios
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_scenarios_updated_at
BEFORE UPDATE ON public.custom_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();