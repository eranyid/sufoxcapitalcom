-- Create rate_limits table to track authentication attempts
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(identifier, action)
);

-- Enable RLS but allow service role to manage
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access
-- This table is managed entirely by edge functions using service role key

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);

-- Create cleanup function to remove old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE last_attempt_at < now() - INTERVAL '1 hour'
    AND (blocked_until IS NULL OR blocked_until < now());
END;
$$;