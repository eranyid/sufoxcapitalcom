-- =============================================
-- CLIENT PORTFOLIO MANUFACTURING PLATFORM
-- Full Database Schema for 8-Stage Pipeline
-- =============================================

-- STAGE I: Client Workspaces (main container)
CREATE TABLE public.client_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'approved')),
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workspaces"
ON public.client_workspaces FOR ALL
USING (auth.uid() = user_id);

-- STAGE I: Client Constraints
CREATE TABLE public.workspace_constraints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Target metrics
  target_return_nominal NUMERIC,
  target_return_real NUMERIC,
  max_drawdown NUMERIC,
  investment_horizon_years INTEGER,
  
  -- Concentration limits
  max_single_asset_pct NUMERIC DEFAULT 20,
  max_single_geography_pct NUMERIC DEFAULT 40,
  max_single_strategy_pct NUMERIC DEFAULT 30,
  
  -- Liquidity requirements
  liquidity_t0_min_pct NUMERIC DEFAULT 5,
  liquidity_t30_min_pct NUMERIC DEFAULT 15,
  liquidity_t90_min_pct NUMERIC DEFAULT 30,
  
  -- Currency constraints
  base_currency TEXT DEFAULT 'USD',
  allowed_currencies TEXT[] DEFAULT ARRAY['USD', 'EUR', 'GBP', 'ILS'],
  max_fx_exposure_pct NUMERIC DEFAULT 30,
  
  -- Regulatory / ESG
  regulatory_constraints JSONB DEFAULT '[]'::jsonb,
  esg_exclusions TEXT[] DEFAULT ARRAY[]::text[],
  special_constraints TEXT,
  
  -- Hard vs Soft
  hard_constraints JSONB DEFAULT '[]'::jsonb,
  soft_constraints JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own constraints"
ON public.workspace_constraints FOR ALL
USING (auth.uid() = user_id);

-- STAGE II: Assumptions (Expected Returns Layer)
CREATE TABLE public.workspace_assumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Asset identification
  asset_class TEXT NOT NULL,
  strategy TEXT,
  sub_strategy TEXT,
  
  -- Return assumptions
  expected_return NUMERIC NOT NULL,
  expected_volatility NUMERIC NOT NULL,
  confidence_level NUMERIC DEFAULT 50 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  
  -- Source tracking
  source_tag TEXT DEFAULT 'analyst_view' CHECK (source_tag IN ('market_implied', 'analyst_view', 'client_view', 'hybrid')),
  source_notes TEXT,
  
  -- Correlation group
  correlation_group TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own assumptions"
ON public.workspace_assumptions FOR ALL
USING (auth.uid() = user_id);

-- STAGE II: Correlation Matrix (separate for flexibility)
CREATE TABLE public.workspace_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  asset_class_1 TEXT NOT NULL,
  asset_class_2 TEXT NOT NULL,
  correlation NUMERIC NOT NULL CHECK (correlation >= -1 AND correlation <= 1),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own correlations"
ON public.workspace_correlations FOR ALL
USING (auth.uid() = user_id);

-- STAGE III: Hierarchical Portfolio Construction
CREATE TABLE public.workspace_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Hierarchy
  parent_id UUID REFERENCES public.workspace_allocations(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0, -- 0=asset_class, 1=strategy, 2=geography, 3=vehicle, 4=instrument
  level_type TEXT NOT NULL CHECK (level_type IN ('asset_class', 'strategy', 'geography', 'vehicle', 'instrument')),
  
  -- Node data
  name TEXT NOT NULL,
  ticker TEXT,
  weight NUMERIC NOT NULL DEFAULT 0,
  
  -- Derived metrics (calculated)
  risk_contribution NUMERIC,
  return_contribution NUMERIC,
  
  -- Liquidity classification
  liquidity_bucket TEXT DEFAULT 't30' CHECK (liquidity_bucket IN ('t0', 't30', 't90', 'locked')),
  liquidity_score NUMERIC,
  
  -- Cash flow
  expected_yield NUMERIC,
  distribution_frequency TEXT,
  
  -- Metadata
  metadata_json JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own allocations"
ON public.workspace_allocations FOR ALL
USING (auth.uid() = user_id);

-- STAGE V: Optimization Results
CREATE TABLE public.workspace_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Optimization parameters
  tau NUMERIC DEFAULT 0.05,
  risk_aversion NUMERIC DEFAULT 2.5,
  risk_free_rate NUMERIC DEFAULT 0.04,
  
  -- Input snapshot
  input_weights JSONB NOT NULL,
  input_assumptions JSONB NOT NULL,
  
  -- Output
  optimized_weights JSONB NOT NULL,
  posterior_returns JSONB,
  
  -- Metrics
  expected_return_before NUMERIC,
  expected_return_after NUMERIC,
  expected_volatility_before NUMERIC,
  expected_volatility_after NUMERIC,
  sharpe_before NUMERIC,
  sharpe_after NUMERIC,
  
  -- Efficient frontier data
  efficient_frontier_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own optimizations"
ON public.workspace_optimizations FOR ALL
USING (auth.uid() = user_id);

-- STAGE VI: Scenario Results
CREATE TABLE public.workspace_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('regime', 'monte_carlo', 'stress', 'historical')),
  scenario_name TEXT NOT NULL,
  
  -- Scenario parameters
  parameters JSONB NOT NULL,
  
  -- Results
  results JSONB NOT NULL,
  
  -- Interpretation
  interpretation TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scenarios"
ON public.workspace_scenarios FOR ALL
USING (auth.uid() = user_id);

-- STAGE VII: Narrative / Proposal
CREATE TABLE public.workspace_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Content sections
  executive_summary TEXT,
  allocation_rationale TEXT,
  risk_explanation TEXT,
  expected_outcomes TEXT,
  governance_rules TEXT,
  
  -- Generated charts/tables references
  embedded_charts JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'sent')),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own narratives"
ON public.workspace_narratives FOR ALL
USING (auth.uid() = user_id);

-- STAGE VIII: Version History & Audit Trail
CREATE TABLE public.workspace_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  
  -- Snapshot of entire workspace state
  constraints_snapshot JSONB,
  assumptions_snapshot JSONB,
  allocations_snapshot JSONB,
  optimization_snapshot JSONB,
  
  -- Metadata
  change_summary TEXT,
  created_by TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own versions"
ON public.workspace_versions FOR ALL
USING (auth.uid() = user_id);

-- Audit trail for detailed changes
CREATE TABLE public.workspace_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.client_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'rebalance'
  stage TEXT NOT NULL, -- 'constraints', 'assumptions', 'allocations', 'optimization', 'scenario', 'narrative'
  entity_id UUID,
  
  old_value JSONB,
  new_value JSONB,
  
  change_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON public.workspace_audit_log FOR ALL
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_workspace_constraints_workspace ON public.workspace_constraints(workspace_id);
CREATE INDEX idx_workspace_assumptions_workspace ON public.workspace_assumptions(workspace_id);
CREATE INDEX idx_workspace_allocations_workspace ON public.workspace_allocations(workspace_id);
CREATE INDEX idx_workspace_allocations_parent ON public.workspace_allocations(parent_id);
CREATE INDEX idx_workspace_optimizations_workspace ON public.workspace_optimizations(workspace_id);
CREATE INDEX idx_workspace_scenarios_workspace ON public.workspace_scenarios(workspace_id);
CREATE INDEX idx_workspace_versions_workspace ON public.workspace_versions(workspace_id);
CREATE INDEX idx_workspace_audit_workspace ON public.workspace_audit_log(workspace_id);

-- Trigger for updated_at
CREATE TRIGGER update_client_workspaces_updated_at
BEFORE UPDATE ON public.client_workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_constraints_updated_at
BEFORE UPDATE ON public.workspace_constraints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_assumptions_updated_at
BEFORE UPDATE ON public.workspace_assumptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_allocations_updated_at
BEFORE UPDATE ON public.workspace_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_narratives_updated_at
BEFORE UPDATE ON public.workspace_narratives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();