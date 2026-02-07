
-- Cache table for EOD market prices
CREATE TABLE public.market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  symbol TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'US', -- US or IL
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC NOT NULL,
  volume BIGINT,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'finnhub',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One price per symbol per date per user/client
  UNIQUE(user_id, client_id, symbol, price_date)
);

-- Handle nullable client_id in unique constraint
CREATE UNIQUE INDEX market_prices_unique_no_client 
  ON public.market_prices (user_id, symbol, price_date) 
  WHERE client_id IS NULL;

-- Enable RLS
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own market prices"
  ON public.market_prices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market prices"
  ON public.market_prices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market prices"
  ON public.market_prices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own market prices"
  ON public.market_prices FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_market_prices_symbol_date ON public.market_prices(symbol, price_date DESC);
CREATE INDEX idx_market_prices_user ON public.market_prices(user_id);
