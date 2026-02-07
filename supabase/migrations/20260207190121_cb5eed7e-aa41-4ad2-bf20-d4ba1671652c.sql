
-- Allow system-fetched rates (no user_id) 
ALTER TABLE public.fx_rates ALTER COLUMN user_id DROP NOT NULL;

-- Add index for fast lookups by pair + date
CREATE INDEX IF NOT EXISTS idx_fx_rates_pair_date 
ON public.fx_rates (from_currency, to_currency, rate_date DESC);

-- Add index for source filtering
CREATE INDEX IF NOT EXISTS idx_fx_rates_source
ON public.fx_rates (source);

-- Allow reading system rates (user_id IS NULL) for all authenticated users
CREATE POLICY "Users can read system FX rates"
ON public.fx_rates
FOR SELECT
USING (user_id IS NULL AND auth.uid() IS NOT NULL);
