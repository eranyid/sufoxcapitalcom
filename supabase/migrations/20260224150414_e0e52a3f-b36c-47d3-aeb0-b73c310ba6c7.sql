
-- Add last_price and last_price_date to quant_universe for quick display
ALTER TABLE public.quant_universe ADD COLUMN IF NOT EXISTS last_price numeric;
ALTER TABLE public.quant_universe ADD COLUMN IF NOT EXISTS last_price_date date;
