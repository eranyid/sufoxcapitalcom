-- Fix security definer view by dropping and recreating with security_invoker
DROP VIEW IF EXISTS public.portfolio_nav_view;

CREATE VIEW public.portfolio_nav_view 
WITH (security_invoker = on)
AS
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