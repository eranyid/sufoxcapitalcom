
-- ============================================================
-- Quant Analytics Cache Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quant_analytics_cache (
  cache_key    TEXT PRIMARY KEY,
  result       JSONB NOT NULL,
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until  TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.quant_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read analytics cache"
  ON public.quant_analytics_cache FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage analytics cache"
  ON public.quant_analytics_cache FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- RPC 1: quant_daily_closes
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_daily_closes(
  p_from DATE, p_to DATE, p_symbols TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  symbol TEXT, company_name TEXT, sector TEXT,
  market_cap NUMERIC, market_cap_rank INT,
  trade_date DATE, close_price NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT
    q.symbol, q.company_name, q.sector, q.market_cap, q.market_cap_rank::INT,
    (q.timestamp_minute AT TIME ZONE 'UTC')::DATE AS trade_date,
    (ARRAY_AGG(q.price ORDER BY q.timestamp_minute DESC))[1] AS close_price
  FROM quant_quotes q
  WHERE (q.timestamp_minute AT TIME ZONE 'UTC')::DATE BETWEEN p_from AND p_to
    AND (p_symbols IS NULL OR q.symbol = ANY(p_symbols))
  GROUP BY q.symbol, q.company_name, q.sector, q.market_cap, q.market_cap_rank,
           (q.timestamp_minute AT TIME ZONE 'UTC')::DATE
  ORDER BY q.symbol, trade_date;
$$;

-- ============================================================
-- RPC 2: quant_daily_returns
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_daily_returns(
  p_from DATE, p_to DATE, p_symbols TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  symbol TEXT, company_name TEXT, sector TEXT,
  market_cap NUMERIC, market_cap_rank INT,
  trade_date DATE, close_price NUMERIC, daily_return NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH closes AS (SELECT * FROM public.quant_daily_closes(p_from, p_to, p_symbols))
  SELECT c.symbol, c.company_name, c.sector, c.market_cap, c.market_cap_rank, c.trade_date, c.close_price,
    CASE WHEN LAG(c.close_price) OVER (PARTITION BY c.symbol ORDER BY c.trade_date) IS NOT NULL
              AND LAG(c.close_price) OVER (PARTITION BY c.symbol ORDER BY c.trade_date) != 0
    THEN (c.close_price - LAG(c.close_price) OVER (PARTITION BY c.symbol ORDER BY c.trade_date))
         / LAG(c.close_price) OVER (PARTITION BY c.symbol ORDER BY c.trade_date)
    ELSE NULL END AS daily_return
  FROM closes c;
$$;

-- ============================================================
-- RPC 3: quant_universe_returns
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_universe_returns(p_from DATE, p_to DATE)
RETURNS TABLE (trade_date DATE, market_return NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH dr AS (SELECT * FROM public.quant_daily_returns(p_from, p_to, NULL::TEXT[]))
  SELECT dr.trade_date, AVG(dr.daily_return) AS market_return
  FROM dr WHERE dr.daily_return IS NOT NULL
  GROUP BY dr.trade_date ORDER BY dr.trade_date;
$$;

-- ============================================================
-- RPC 4: quant_sector_returns
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_sector_returns(p_from DATE, p_to DATE)
RETURNS TABLE (sector TEXT, avg_cum_return NUMERIC, symbol_count BIGINT, total_market_cap NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH dr AS (
    SELECT * FROM public.quant_daily_returns(p_from, p_to, NULL::TEXT[]) WHERE daily_return IS NOT NULL
  ),
  cum AS (
    SELECT symbol, sector, market_cap, EXP(SUM(LN(1 + daily_return))) - 1 AS cum_return
    FROM dr GROUP BY symbol, sector, market_cap
  )
  SELECT cum.sector, AVG(cum.cum_return) AS avg_cum_return,
    COUNT(DISTINCT cum.symbol) AS symbol_count, SUM(cum.market_cap) AS total_market_cap
  FROM cum WHERE cum.sector IS NOT NULL
  GROUP BY cum.sector ORDER BY avg_cum_return DESC;
$$;

-- ============================================================
-- RPC 5: quant_symbol_stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_symbol_stats(
  p_from DATE, p_to DATE, p_symbols TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  symbol TEXT, company_name TEXT, sector TEXT,
  market_cap NUMERIC, market_cap_rank INT,
  trading_days BIGINT, cum_return NUMERIC, ann_return NUMERIC,
  ann_vol NUMERIC, avg_daily_return NUMERIC,
  sharpe NUMERIC, sortino NUMERIC,
  var_95 NUMERIC, cvar_95 NUMERIC,
  skewness NUMERIC, kurtosis NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH dr AS (
    SELECT * FROM public.quant_daily_returns(p_from, p_to, p_symbols) WHERE quant_daily_returns.daily_return IS NOT NULL
  ),
  stats AS (
    SELECT dr.symbol, dr.company_name, dr.sector, dr.market_cap, dr.market_cap_rank,
      COUNT(*)::BIGINT AS trading_days,
      EXP(SUM(LN(1 + dr.daily_return))) - 1 AS cum_return,
      AVG(dr.daily_return) AS avg_daily_return,
      STDDEV_SAMP(dr.daily_return) AS daily_vol,
      STDDEV_SAMP(CASE WHEN dr.daily_return < 0 THEN dr.daily_return END) AS downside_vol,
      PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY dr.daily_return ASC) AS var_95
    FROM dr GROUP BY dr.symbol, dr.company_name, dr.sector, dr.market_cap, dr.market_cap_rank
  ),
  cvar_calc AS (
    SELECT dr.symbol, AVG(dr.daily_return) AS cvar_95
    FROM dr JOIN stats s ON dr.symbol = s.symbol
    WHERE dr.daily_return <= s.var_95
    GROUP BY dr.symbol
  )
  SELECT s.symbol, s.company_name, s.sector, s.market_cap, s.market_cap_rank,
    s.trading_days, s.cum_return,
    CASE WHEN s.trading_days > 0 THEN POWER(1 + s.cum_return, 252.0 / s.trading_days) - 1 ELSE NULL END AS ann_return,
    s.daily_vol * SQRT(252.0) AS ann_vol,
    s.avg_daily_return,
    CASE WHEN s.daily_vol > 0 THEN (s.avg_daily_return * 252 - 0.045) / (s.daily_vol * SQRT(252.0)) ELSE NULL END AS sharpe,
    CASE WHEN s.downside_vol > 0 THEN (s.avg_daily_return * 252 - 0.045) / (s.downside_vol * SQRT(252.0)) ELSE NULL END AS sortino,
    s.var_95::NUMERIC,
    cv.cvar_95::NUMERIC,
    NULL::NUMERIC AS skewness,
    NULL::NUMERIC AS kurtosis
  FROM stats s LEFT JOIN cvar_calc cv ON s.symbol = cv.symbol;
END;
$$;

-- ============================================================
-- RPC 6: quant_market_breadth
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_market_breadth(p_from DATE, p_to DATE)
RETURNS TABLE (trade_date DATE, total_symbols BIGINT, positive_symbols BIGINT, pct_positive NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH dr AS (
    SELECT * FROM public.quant_daily_returns(p_from, p_to, NULL::TEXT[]) WHERE daily_return IS NOT NULL
  )
  SELECT trade_date, COUNT(*)::BIGINT AS total_symbols,
    COUNT(*) FILTER (WHERE daily_return > 0)::BIGINT AS positive_symbols,
    (COUNT(*) FILTER (WHERE daily_return > 0) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC AS pct_positive
  FROM dr GROUP BY trade_date ORDER BY trade_date;
$$;

-- ============================================================
-- RPC 7: quant_intraday_vol_profile
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_intraday_vol_profile(p_from DATE, p_to DATE)
RETURNS TABLE (minute_slot TEXT, avg_abs_return NUMERIC, sample_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH priced AS (
    SELECT symbol, (timestamp_minute AT TIME ZONE 'UTC')::DATE AS trade_date,
      TO_CHAR(timestamp_minute AT TIME ZONE 'America/New_York', 'HH24:MI') AS minute_slot,
      price,
      LAG(price) OVER (PARTITION BY symbol, (timestamp_minute AT TIME ZONE 'UTC')::DATE ORDER BY timestamp_minute) AS prev_price
    FROM quant_quotes
    WHERE (timestamp_minute AT TIME ZONE 'UTC')::DATE BETWEEN p_from AND p_to
  )
  SELECT minute_slot,
    AVG(ABS((price - prev_price) / NULLIF(prev_price, 0)))::NUMERIC AS avg_abs_return,
    COUNT(*)::BIGINT AS sample_count
  FROM priced WHERE prev_price IS NOT NULL AND prev_price > 0
  GROUP BY minute_slot ORDER BY minute_slot;
$$;

-- ============================================================
-- RPC 8: quant_intraday_window_returns
-- ============================================================
CREATE OR REPLACE FUNCTION public.quant_intraday_window_returns(p_from DATE, p_to DATE)
RETURNS TABLE (window_label TEXT, avg_return NUMERIC, sample_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  WITH priced AS (
    SELECT symbol, price,
      EXTRACT(HOUR FROM timestamp_minute AT TIME ZONE 'America/New_York') AS et_hour,
      EXTRACT(MINUTE FROM timestamp_minute AT TIME ZONE 'America/New_York') AS et_min,
      LAG(price) OVER (PARTITION BY symbol, (timestamp_minute AT TIME ZONE 'UTC')::DATE ORDER BY timestamp_minute) AS prev_price
    FROM quant_quotes
    WHERE (timestamp_minute AT TIME ZONE 'UTC')::DATE BETWEEN p_from AND p_to
  ),
  with_window AS (
    SELECT *,
      CASE
        WHEN et_hour = 13 AND et_min < 30 THEN '13:00-13:30'
        WHEN et_hour = 13 AND et_min >= 30 THEN '13:30-14:00'
        WHEN et_hour = 14 AND et_min < 30 THEN '14:00-14:30'
        WHEN et_hour = 14 AND et_min >= 30 THEN '14:30-15:00'
        WHEN et_hour = 15 AND et_min < 30 THEN '15:00-15:30'
        WHEN et_hour = 15 AND et_min >= 30 THEN '15:30-16:00'
        ELSE 'other'
      END AS window_label
    FROM priced WHERE prev_price IS NOT NULL AND prev_price > 0
  )
  SELECT window_label,
    AVG((price - prev_price) / prev_price)::NUMERIC AS avg_return,
    COUNT(*)::BIGINT AS sample_count
  FROM with_window WHERE window_label != 'other'
  GROUP BY window_label ORDER BY window_label;
$$;
