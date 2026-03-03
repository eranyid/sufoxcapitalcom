
-- Drop existing functions that need signature changes
DROP FUNCTION IF EXISTS public.quant_daily_returns(DATE, DATE, TEXT[]);
DROP FUNCTION IF EXISTS public.quant_symbol_stats(DATE, DATE, TEXT[]);
DROP FUNCTION IF EXISTS public.quant_sector_returns(DATE, DATE);

-- =====================================================
-- STEP 1: Rebuild quant_daily_returns with LOG returns
-- =====================================================
CREATE FUNCTION public.quant_daily_returns(p_from DATE, p_to DATE, p_symbols TEXT[] DEFAULT NULL)
RETURNS TABLE(
  symbol VARCHAR, company_name VARCHAR, sector VARCHAR,
  market_cap BIGINT, market_cap_rank INT,
  trade_date DATE, close_price NUMERIC, daily_return NUMERIC
)
LANGUAGE sql STABLE
AS $$
  WITH closes AS (SELECT * FROM public.quant_daily_closes(p_from, p_to, p_symbols))
  SELECT c.symbol, c.company_name, c.sector, c.market_cap, c.market_cap_rank::INT,
    c.trade_date, c.close_price,
    CASE WHEN LAG(c.close_price) OVER (PARTITION BY c.symbol ORDER BY c.trade_date) IS NOT NULL
              AND LAG(c.close_price) OVER (PARTITION BY c.symbol ORDER BY c.trade_date) > 0
              AND c.close_price > 0
    THEN LN(c.close_price / LAG(c.close_price) OVER (PARTITION BY c.symbol ORDER BY c.trade_date))
    ELSE NULL END AS daily_return
  FROM closes c;
$$;

-- =====================================================
-- STEP 2: Rebuild quant_symbol_stats with full metrics
-- =====================================================
CREATE FUNCTION public.quant_symbol_stats(p_from DATE, p_to DATE, p_symbols TEXT[] DEFAULT NULL)
RETURNS TABLE(
  symbol VARCHAR, company_name VARCHAR, sector VARCHAR,
  market_cap BIGINT, market_cap_rank INT,
  trading_days BIGINT, cum_return NUMERIC, ann_return NUMERIC,
  ann_vol NUMERIC, avg_daily_return NUMERIC,
  sharpe NUMERIC, sortino NUMERIC,
  var_95 NUMERIC, cvar_95 NUMERIC,
  skewness NUMERIC, kurtosis NUMERIC, max_drawdown NUMERIC
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH dr AS (
    SELECT d.symbol, d.company_name, d.sector, d.market_cap, d.market_cap_rank,
           d.trade_date, d.daily_return
    FROM public.quant_daily_returns(p_from, p_to, p_symbols) d
    WHERE d.daily_return IS NOT NULL
  ),
  base_stats AS (
    SELECT dr.symbol, dr.company_name, dr.sector, dr.market_cap, dr.market_cap_rank,
      COUNT(*)::BIGINT AS trading_days,
      EXP(SUM(dr.daily_return)) - 1 AS cum_return,
      AVG(dr.daily_return) AS avg_daily_return,
      STDDEV_SAMP(dr.daily_return) AS daily_vol,
      STDDEV_SAMP(CASE WHEN dr.daily_return < 0 THEN dr.daily_return END) AS downside_vol,
      PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY dr.daily_return ASC) AS var_95
    FROM dr GROUP BY dr.symbol, dr.company_name, dr.sector, dr.market_cap, dr.market_cap_rank
  ),
  cvar_calc AS (
    SELECT dr.symbol, AVG(dr.daily_return) AS cvar_95
    FROM dr JOIN base_stats s ON dr.symbol = s.symbol
    WHERE dr.daily_return <= s.var_95
    GROUP BY dr.symbol
  ),
  higher_moments AS (
    SELECT dr.symbol,
      CASE WHEN COUNT(*) > 2 AND STDDEV_SAMP(dr.daily_return) > 0 THEN
        (COUNT(*)::NUMERIC / ((COUNT(*) - 1) * (COUNT(*) - 2))) *
        SUM(POWER((dr.daily_return - agg.mean_r) / agg.std_r, 3))
      ELSE NULL END AS skewness,
      CASE WHEN COUNT(*) > 3 AND STDDEV_SAMP(dr.daily_return) > 0 THEN
        ((COUNT(*)::NUMERIC * (COUNT(*) + 1)) / ((COUNT(*) - 1) * (COUNT(*) - 2) * (COUNT(*) - 3))) *
        SUM(POWER((dr.daily_return - agg.mean_r) / agg.std_r, 4))
        - (3.0 * POWER(COUNT(*) - 1, 2)) / ((COUNT(*) - 2) * (COUNT(*) - 3))
      ELSE NULL END AS kurtosis
    FROM dr
    JOIN (
      SELECT dr2.symbol, AVG(dr2.daily_return) AS mean_r, STDDEV_SAMP(dr2.daily_return) AS std_r
      FROM dr dr2 GROUP BY dr2.symbol
    ) agg ON dr.symbol = agg.symbol
    WHERE agg.std_r > 0
    GROUP BY dr.symbol
  ),
  cum_series AS (
    SELECT dr.symbol, dr.trade_date,
      EXP(SUM(dr.daily_return) OVER (PARTITION BY dr.symbol ORDER BY dr.trade_date)) AS cum_val
    FROM dr
  ),
  peak_series AS (
    SELECT cs.symbol, cs.trade_date, cs.cum_val,
      MAX(cs.cum_val) OVER (PARTITION BY cs.symbol ORDER BY cs.trade_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS peak
    FROM cum_series cs
  ),
  drawdown_calc AS (
    SELECT ps.symbol, MIN((ps.cum_val / ps.peak) - 1) AS max_drawdown
    FROM peak_series ps
    WHERE ps.peak > 0
    GROUP BY ps.symbol
  )
  SELECT s.symbol, s.company_name, s.sector, s.market_cap, s.market_cap_rank,
    s.trading_days, s.cum_return,
    CASE WHEN s.trading_days > 1
      THEN EXP(s.avg_daily_return * 252) - 1
      ELSE NULL END AS ann_return,
    CASE WHEN s.daily_vol IS NOT NULL
      THEN s.daily_vol * SQRT(252.0)
      ELSE NULL END AS ann_vol,
    s.avg_daily_return,
    CASE WHEN s.daily_vol > 0 AND s.trading_days >= 5
      THEN (s.avg_daily_return * 252) / (s.daily_vol * SQRT(252.0))
      ELSE NULL END AS sharpe,
    CASE WHEN s.downside_vol > 0 AND s.trading_days >= 5
      THEN (s.avg_daily_return * 252) / (s.downside_vol * SQRT(252.0))
      ELSE NULL END AS sortino,
    s.var_95::NUMERIC,
    cv.cvar_95::NUMERIC,
    hm.skewness::NUMERIC,
    hm.kurtosis::NUMERIC,
    dd.max_drawdown::NUMERIC
  FROM base_stats s
  LEFT JOIN cvar_calc cv ON s.symbol = cv.symbol
  LEFT JOIN higher_moments hm ON s.symbol = hm.symbol
  LEFT JOIN drawdown_calc dd ON s.symbol = dd.symbol;
END;
$$;

-- =====================================================
-- STEP 3: Rebuild sector returns for log returns
-- =====================================================
CREATE FUNCTION public.quant_sector_returns(p_from DATE, p_to DATE)
RETURNS TABLE(sector VARCHAR, avg_cum_return NUMERIC, symbol_count BIGINT, total_market_cap NUMERIC)
LANGUAGE sql STABLE
AS $$
  WITH dr AS (
    SELECT d.symbol, d.sector, d.market_cap, d.daily_return
    FROM public.quant_daily_returns(p_from, p_to, NULL::TEXT[]) d WHERE d.daily_return IS NOT NULL
  ),
  cum AS (
    SELECT dr.symbol, dr.sector, dr.market_cap,
      EXP(SUM(dr.daily_return)) - 1 AS cum_return
    FROM dr GROUP BY dr.symbol, dr.sector, dr.market_cap
  )
  SELECT cum.sector, AVG(cum.cum_return)::NUMERIC AS avg_cum_return,
    COUNT(DISTINCT cum.symbol) AS symbol_count, SUM(cum.market_cap)::NUMERIC AS total_market_cap
  FROM cum WHERE cum.sector IS NOT NULL
  GROUP BY cum.sector ORDER BY avg_cum_return DESC;
$$;
