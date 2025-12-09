-- Add max cash and max volatility columns to investment_policies
ALTER TABLE public.investment_policies 
ADD COLUMN IF NOT EXISTS cash_max_pct numeric DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_volatility_pct numeric DEFAULT NULL;