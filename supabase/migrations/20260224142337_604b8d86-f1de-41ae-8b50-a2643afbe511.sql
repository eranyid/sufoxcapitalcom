-- 1. Quant Universe Table
CREATE TABLE IF NOT EXISTS public.quant_universe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  market_cap BIGINT,
  market_cap_rank INTEGER,
  market_timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  exchange VARCHAR(50),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_metadata_refresh TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qu_market_cap_rank ON public.quant_universe(market_cap_rank ASC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_qu_is_active ON public.quant_universe(is_active);
CREATE INDEX IF NOT EXISTS idx_qu_sector ON public.quant_universe(sector) WHERE is_active = TRUE;

-- 2. Quant Quotes Table
CREATE TABLE IF NOT EXISTS public.quant_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  timestamp_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  timestamp_minute TIMESTAMP WITH TIME ZONE NOT NULL,
  price NUMERIC(18,6) NOT NULL,
  sector VARCHAR(100),
  market_cap BIGINT,
  market_cap_rank INTEGER,
  market_timezone VARCHAR(50),
  ingestion_latency_ms INTEGER,
  api_response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, timestamp_minute)
);

CREATE INDEX IF NOT EXISTS idx_qq_symbol ON public.quant_quotes(symbol);
CREATE INDEX IF NOT EXISTS idx_qq_timestamp_minute ON public.quant_quotes(timestamp_minute DESC);
CREATE INDEX IF NOT EXISTS idx_qq_symbol_ts ON public.quant_quotes(symbol, timestamp_minute DESC);
CREATE INDEX IF NOT EXISTS idx_qq_sector_ts ON public.quant_quotes(sector, timestamp_minute DESC);
CREATE INDEX IF NOT EXISTS idx_qq_market_cap_rank ON public.quant_quotes(market_cap_rank ASC, timestamp_minute DESC);

-- 3. Quant Ingestion Sessions Table
CREATE TABLE IF NOT EXISTS public.quant_ingestion_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL UNIQUE,
  is_trading_day BOOLEAN NOT NULL,
  market_close_utc TIMESTAMP WITH TIME ZONE,
  window_start_utc TIMESTAMP WITH TIME ZONE,
  window_end_utc TIMESTAMP WITH TIME ZONE,
  early_close BOOLEAN NOT NULL DEFAULT FALSE,
  early_close_note TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  quotes_collected INTEGER NOT NULL DEFAULT 0,
  quotes_target INTEGER NOT NULL DEFAULT 900,
  cursor_position INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_rate_pct NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qis_session_date ON public.quant_ingestion_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_qis_status ON public.quant_ingestion_sessions(status);

-- 4. Quant Ingestion Logs Table
CREATE TABLE IF NOT EXISTS public.quant_ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.quant_ingestion_sessions(id) ON DELETE CASCADE,
  minute_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  symbols_attempted VARCHAR(20)[] NOT NULL,
  symbols_succeeded VARCHAR(20)[],
  symbols_failed VARCHAR(20)[],
  retry_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50),
  error_details JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qil_session_id ON public.quant_ingestion_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_qil_minute_utc ON public.quant_ingestion_logs(minute_utc DESC);
CREATE INDEX IF NOT EXISTS idx_qil_status ON public.quant_ingestion_logs(status);

-- 5. Quant Metadata Refresh Log Table
CREATE TABLE IF NOT EXISTS public.quant_metadata_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refresh_date DATE NOT NULL,
  symbols_total INTEGER,
  symbols_added INTEGER,
  symbols_updated INTEGER,
  symbols_deactivated INTEGER,
  status VARCHAR(50),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quant_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_ingestion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_metadata_refresh_log ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Admin access primarily)
-- Quant Universe
CREATE POLICY "Admins can manage quant universe" ON public.quant_universe
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view quant universe" ON public.quant_universe
  FOR SELECT USING (auth.role() = 'authenticated');

-- Quant Quotes
CREATE POLICY "Admins can manage quant quotes" ON public.quant_quotes
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view quant quotes" ON public.quant_quotes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Quant Ingestion Sessions
CREATE POLICY "Admins can manage ingestion sessions" ON public.quant_ingestion_sessions
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view ingestion sessions" ON public.quant_ingestion_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Quant Ingestion Logs
CREATE POLICY "Admins can manage ingestion logs" ON public.quant_ingestion_logs
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view ingestion logs" ON public.quant_ingestion_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Quant Metadata Refresh Log
CREATE POLICY "Admins can manage metadata logs" ON public.quant_metadata_refresh_log
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view metadata logs" ON public.quant_metadata_refresh_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quant_ingestion_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quant_ingestion_logs;
