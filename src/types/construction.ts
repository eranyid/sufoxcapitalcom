// Types for Portfolio Construction Pipeline

export type ObjectiveType = 'absolute_return' | 'balanced' | 'growth' | 'aggressive';
export type HorizonType = 'short_term' | 'medium_term' | 'long_term';
export type RiskLevel = 'low' | 'medium' | 'high';
export type LiquidityRequirement = 'low' | 'medium' | 'high';
export type DimensionType = 'geography' | 'asset_class' | 'bucket';

export interface TargetConstraints {
  minEquities: number;
  minCash: number;
  minHedge: number;
  liquidityRequirement: LiquidityRequirement;
}

export interface GeographyAllocation {
  israel: number;
  usa: number;
  europe: number;
  other: number;
}

export interface AssetClassAllocation {
  equities: number;
  equityFunds: number;
  bonds: number;
  bondFunds: number;
  hedging: number;
  alternatives: number;
  cash: number;
}

export interface BucketConfig {
  key: string;
  label: string;
  targetWeight: number;
  implementation: 'etfs' | 'stocks' | 'mutual_funds' | 'options_overlay' | 'hedging';
  benchmark?: string;
}

export interface WizardData {
  // Step 1 - Objective & Constraints
  objective: ObjectiveType;
  horizon: HorizonType;
  riskLevel: RiskLevel;
  constraints: TargetConstraints;
  
  // Step 2 - Geography
  geography: GeographyAllocation;
  
  // Step 3 - Asset Classes
  assetClasses: AssetClassAllocation;
  
  // Step 4 - Implementation Buckets
  buckets: BucketConfig[];
}

export interface TargetAllocation {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  objective: string;
  horizon: string;
  risk_level: string;
  constraints_json: TargetConstraints;
  status: 'draft' | 'active';
  created_at: string;
  updated_at: string;
}

export interface TargetAllocationLine {
  id: string;
  target_id: string;
  dimension_type: DimensionType;
  key: string;
  parent_key: string | null;
  target_weight: number;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export const GEOGRAPHY_PRESETS = {
  israel_tilt: { israel: 40, usa: 35, europe: 15, other: 10 },
  global: { israel: 20, usa: 40, europe: 25, other: 15 },
  us_centric: { israel: 10, usa: 60, europe: 20, other: 10 },
  eu_centric: { israel: 15, usa: 25, europe: 45, other: 15 },
} as const;

export const OBJECTIVE_LABELS: Record<ObjectiveType, string> = {
  absolute_return: 'Absolute Return',
  balanced: 'Balanced',
  growth: 'Growth',
  aggressive: 'Aggressive',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const LIQUIDITY_LABELS: Record<LiquidityRequirement, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const DEFAULT_WIZARD_DATA: WizardData = {
  objective: 'balanced',
  horizon: 'long_term',
  riskLevel: 'medium',
  constraints: {
    minEquities: 70,
    minCash: 5,
    minHedge: 5,
    liquidityRequirement: 'medium',
  },
  geography: {
    israel: 25,
    usa: 45,
    europe: 20,
    other: 10,
  },
  assetClasses: {
    equities: 55,
    equityFunds: 10,
    bonds: 10,
    bondFunds: 5,
    hedging: 5,
    alternatives: 10,
    cash: 5,
  },
  buckets: [
    { key: 'core_equities', label: 'Core Equities', targetWeight: 50, implementation: 'stocks', benchmark: 'S&P 500' },
    { key: 'satellite', label: 'Satellite / Alpha', targetWeight: 25, implementation: 'stocks' },
    { key: 'fixed_income', label: 'Fixed Income', targetWeight: 10, implementation: 'etfs', benchmark: '60/40' },
    { key: 'hedge', label: 'Hedge / Short', targetWeight: 10, implementation: 'options_overlay' },
    { key: 'cash', label: 'Cash Buffer', targetWeight: 5, implementation: 'mutual_funds' },
  ],
};
