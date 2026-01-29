-- Create needs_profile table
CREATE TABLE public.needs_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_score INTEGER NOT NULL DEFAULT 50,
  profile_type TEXT NOT NULL DEFAULT 'balanced',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.needs_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own needs profiles" 
  ON public.needs_profile 
  FOR SELECT 
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own needs profiles" 
  ON public.needs_profile 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own needs profiles" 
  ON public.needs_profile 
  FOR UPDATE 
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own needs profiles" 
  ON public.needs_profile 
  FOR DELETE 
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Add needs_profile_id to target_allocations
ALTER TABLE public.target_allocations 
  ADD COLUMN needs_profile_id UUID REFERENCES public.needs_profile(id);

-- Create trigger for updated_at
CREATE TRIGGER update_needs_profile_updated_at
  BEFORE UPDATE ON public.needs_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();