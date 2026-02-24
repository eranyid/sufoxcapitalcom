
-- Momentum ranking function (depends on quant_daily_returns)
CREATE OR REPLACE FUNCTION public.quant_momentum_ranking(p_to DATE)
RETURNS TABLE (
  symbol TEXT, company_name TEXT, sector TEXT,
  market_cap NUMERIC, market_cap_rank INT,
  return_5d NUMERIC, return_1m NUMERIC, return_3m NUMERIC,
  return_6m NUMERIC, return_1y NUMERIC, momentum_score NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH
  r5 AS (
    SELECT dr.symbol, EXP(SUM(LN(1 + dr.daily_return))) - 1 AS ret
    FROM public.quant_daily_returns(p_to - 7, p_to, NULL::TEXT[]) dr
    WHERE dr.daily_return IS NOT NULL GROUP BY dr.symbol
  ),
  r1m AS (
    SELECT dr.symbol, EXP(SUM(LN(1 + dr.daily_return))) - 1 AS ret
    FROM public.quant_daily_returns(p_to - 30, p_to, NULL::TEXT[]) dr
    WHERE dr.daily_return IS NOT NULL GROUP BY dr.symbol
  ),
  r3m AS (
    SELECT dr.symbol, EXP(SUM(LN(1 + dr.daily_return))) - 1 AS ret
    FROM public.quant_daily_returns(p_to - 90, p_to, NULL::TEXT[]) dr
    WHERE dr.daily_return IS NOT NULL GROUP BY dr.symbol
  ),
  r6m AS (
    SELECT dr.symbol, EXP(SUM(LN(1 + dr.daily_return))) - 1 AS ret
    FROM public.quant_daily_returns(p_to - 180, p_to, NULL::TEXT[]) dr
    WHERE dr.daily_return IS NOT NULL GROUP BY dr.symbol
  ),
  r1y AS (
    SELECT dr.symbol, EXP(SUM(LN(1 + dr.daily_return))) - 1 AS ret
    FROM public.quant_daily_returns(p_to - 365, p_to, NULL::TEXT[]) dr
    WHERE dr.daily_return IS NOT NULL GROUP BY dr.symbol
  ),
  base AS (
    SELECT DISTINCT ON (q.symbol) q.symbol, q.company_name, q.sector, q.market_cap, q.market_cap_rank::INT AS market_cap_rank
    FROM quant_quotes q WHERE q.symbol IS NOT NULL
    ORDER BY q.symbol, q.timestamp_minute DESC
  ),
  combined AS (
    SELECT b.symbol, b.company_name, b.sector, b.market_cap, b.market_cap_rank,
      r5.ret AS return_5d, r1m.ret AS return_1m, r3m.ret AS return_3m,
      r6m.ret AS return_6m, r1y.ret AS return_1y
    FROM base b
    LEFT JOIN r5 ON b.symbol = r5.symbol LEFT JOIN r1m ON b.symbol = r1m.symbol
    LEFT JOIN r3m ON b.symbol = r3m.symbol LEFT JOIN r6m ON b.symbol = r6m.symbol
    LEFT JOIN r1y ON b.symbol = r1y.symbol
  ),
  ranked AS (
    SELECT *, COALESCE(
      (COALESCE(PERCENT_RANK() OVER (ORDER BY return_5d), 0) +
       COALESCE(PERCENT_RANK() OVER (ORDER BY return_1m), 0) +
       COALESCE(PERCENT_RANK() OVER (ORDER BY return_3m), 0)
      ) / 3.0 * 100, 0)::NUMERIC AS momentum_score
    FROM combined
  )
  SELECT ranked.symbol, ranked.company_name, ranked.sector, ranked.market_cap, ranked.market_cap_rank,
    ranked.return_5d::NUMERIC, ranked.return_1m::NUMERIC, ranked.return_3m::NUMERIC,
    ranked.return_6m::NUMERIC, ranked.return_1y::NUMERIC,
    ROUND(ranked.momentum_score::NUMERIC, 1) AS momentum_score
  FROM ranked ORDER BY momentum_score DESC;
END;
$$;
