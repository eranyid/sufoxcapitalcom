-- =====================================================
-- CAPITAL FLOW & FX-AWARE LEDGER SYSTEM
-- Prime-Broker Grade Capital Accounting
-- =====================================================

-- 1. FX Rates Table - Historical exchange rate storage
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fx_rates
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies for fx_rates
CREATE POLICY "Users can view their own fx rates"
  ON public.fx_rates
  FOR SELECT
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own fx rates"
  ON public.fx_rates
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own fx rates"
  ON public.fx_rates
  FOR UPDATE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own fx rates"
  ON public.fx_rates
  FOR DELETE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Index for efficient FX lookups
CREATE INDEX idx_fx_rates_lookup ON public.fx_rates(user_id, from_currency, to_currency, rate_date DESC);

-- 2. Capital Ledger Table - Full audit trail of all cash movements
CREATE TABLE IF NOT EXISTS public.capital_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL, -- 'BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL', 'FX_CONVERSION', 'FEE', 'DIVIDEND', 'INTEREST'
  currency TEXT NOT NULL,
  amount NUMERIC NOT NULL, -- Positive for credits, negative for debits
  fx_rate_used NUMERIC,
  base_currency TEXT,
  amount_base NUMERIC, -- Amount in base currency
  running_balance NUMERIC, -- Running balance after this entry
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on capital_ledger
ALTER TABLE public.capital_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies for capital_ledger (read-only for users, system writes)
CREATE POLICY "Users can view their own ledger entries"
  ON public.capital_ledger
  FOR SELECT
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own ledger entries"
  ON public.capital_ledger
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Index for ledger queries
CREATE INDEX idx_capital_ledger_user_date ON public.capital_ledger(user_id, created_at DESC);
CREATE INDEX idx_capital_ledger_transaction ON public.capital_ledger(transaction_id);

-- 3. Add FX tracking fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS fx_rate_at_entry NUMERIC,
ADD COLUMN IF NOT EXISTS cost_local NUMERIC,
ADD COLUMN IF NOT EXISTS cost_base NUMERIC,
ADD COLUMN IF NOT EXISTS cash_impact_currency TEXT,
ADD COLUMN IF NOT EXISTS cash_impact_amount NUMERIC,
ADD COLUMN IF NOT EXISTS realized_pl_base NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS realized_fx_pl NUMERIC DEFAULT 0;

-- 4. Holdings snapshot table for position tracking
CREATE TABLE IF NOT EXISTS public.holdings_snapshot (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  avg_cost_local NUMERIC NOT NULL,
  avg_cost_base NUMERIC NOT NULL,
  asset_currency TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  fx_rate_at_entry NUMERIC,
  total_cost_base NUMERIC NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on holdings_snapshot
ALTER TABLE public.holdings_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holdings"
  ON public.holdings_snapshot
  FOR SELECT
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own holdings"
  ON public.holdings_snapshot
  FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own holdings"
  ON public.holdings_snapshot
  FOR UPDATE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own holdings"
  ON public.holdings_snapshot
  FOR DELETE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Unique constraint on user + ticker
CREATE UNIQUE INDEX idx_holdings_user_ticker ON public.holdings_snapshot(user_id, ticker);

-- 5. Add more currency columns to cash_balances for flexibility
ALTER TABLE public.cash_balances
ADD COLUMN IF NOT EXISTS gbp NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS chf NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS jpy NUMERIC DEFAULT 0;

-- 6. Create a view for NAV calculation
CREATE OR REPLACE VIEW public.portfolio_nav_view AS
SELECT 
  h.user_id,
  h.ticker,
  h.quantity,
  h.avg_cost_base,
  h.total_cost_base,
  h.asset_currency,
  h.base_currency,
  v.price_per_unit as current_price,
  v.fx_rate as current_fx_rate,
  (h.quantity * v.price_per_unit * COALESCE(v.fx_rate, 1)) as market_value_base,
  ((h.quantity * v.price_per_unit * COALESCE(v.fx_rate, 1)) - h.total_cost_base) as unrealized_pl
FROM public.holdings_snapshot h
LEFT JOIN LATERAL (
  SELECT price_per_unit, fx_rate
  FROM public.valuations
  WHERE ticker = h.ticker AND user_id = h.user_id AND deleted_at IS NULL
  ORDER BY month DESC
  LIMIT 1
) v ON true;