-- Create investment_policies table to store user investment strategy and policy
CREATE TABLE public.investment_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Free-text strategy
  strategy_philosophy TEXT,
  
  -- Structured policy inputs
  equity_min_pct NUMERIC DEFAULT 0,
  equity_max_pct NUMERIC DEFAULT 100,
  fixed_income_min_pct NUMERIC DEFAULT 0,
  fixed_income_max_pct NUMERIC DEFAULT 100,
  alternatives_min_pct NUMERIC DEFAULT 0,
  alternatives_max_pct NUMERIC DEFAULT 100,
  cash_min_pct NUMERIC DEFAULT 0,
  max_single_position_pct NUMERIC DEFAULT 100,
  max_sector_allocation_pct NUMERIC DEFAULT 100,
  
  -- Geographic limits as JSONB: { "north_america": { "min": 0, "max": 100 }, ... }
  geographic_limits JSONB DEFAULT '{}',
  
  -- Risk and horizon
  risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  investment_horizon_years INTEGER DEFAULT 10,
  
  -- Leverage
  leverage_allowed BOOLEAN DEFAULT false,
  max_leverage_ratio NUMERIC DEFAULT 1.0,
  
  -- Liquidity
  min_liquid_assets_pct NUMERIC DEFAULT 0,
  
  -- Special constraints
  special_constraints TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own policy"
ON public.investment_policies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own policy"
ON public.investment_policies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy"
ON public.investment_policies
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_investment_policies_updated_at
BEFORE UPDATE ON public.investment_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();