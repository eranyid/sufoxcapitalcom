// Types for Portfolio Construction Pipeline

export type ObjectiveType = 'absolute_return' | 'balanced' | 'growth' | 'aggressive';
export type HorizonType = 'short_term' | 'medium_term' | 'long_term';
export type RiskLevel = 'low' | 'medium' | 'high';
export type LiquidityRequirement = 'low' | 'medium' | 'high';
export type DimensionType = 'geography' | 'asset_class' | 'alternatives' | 'bucket';

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
  bonds: number;
  hedging: number;
  alternatives: number;
  cash: number;
}

// Alternative Investment Classes based on J.P. Morgan Guide to Alternatives
export interface AlternativesAllocation {
  privateEquity: number;
  ventureCapital: number;
  realEstate: number;
  infrastructure: number;
  privateCredit: number;
  hedgeFunds: number;
}

export interface AlternativeConfig {
  key: keyof AlternativesAllocation;
  label: string;
  targetWeight: number;
  strategy: AlternativeStrategy;
  geography: 'global' | 'us' | 'europe' | 'asia' | 'israel';
  vintage?: string; // For PE/VC funds
  lockupYears?: number;
}

export type AlternativeStrategy = 
  // Private Equity
  | 'buyout' | 'growth_equity' | 'distressed' | 'secondaries'
  // Venture Capital  
  | 'early_stage' | 'late_stage' | 'sector_focused'
  // Real Estate
  | 'core' | 'core_plus' | 'value_add' | 'opportunistic'
  // Infrastructure
  | 'core_infra' | 'transport' | 'digital_infra' | 'energy_transition'
  // Private Credit
  | 'direct_lending' | 'mezzanine' | 'distressed_credit' | 'specialty_finance'
  // Hedge Funds
  | 'long_short' | 'relative_value' | 'macro' | 'multi_strategy' | 'event_driven';

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
  
  // Step 4 - Alternatives (NEW)
  alternatives: AlternativesAllocation;
  alternativeConfigs: AlternativeConfig[];
  
  // Step 5 - Implementation Buckets
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

export const ALTERNATIVE_LABELS: Record<keyof AlternativesAllocation, string> = {
  privateEquity: 'Private Equity',
  ventureCapital: 'Venture Capital',
  realEstate: 'Real Estate',
  infrastructure: 'Infrastructure',
  privateCredit: 'Private Credit',
  hedgeFunds: 'Hedge Funds',
};

export const ALTERNATIVE_STRATEGIES: Record<keyof AlternativesAllocation, { value: AlternativeStrategy; label: string }[]> = {
  privateEquity: [
    { value: 'buyout', label: 'Buyout' },
    { value: 'growth_equity', label: 'Growth Equity' },
    { value: 'distressed', label: 'Distressed' },
    { value: 'secondaries', label: 'Secondaries' },
  ],
  ventureCapital: [
    { value: 'early_stage', label: 'Early Stage' },
    { value: 'late_stage', label: 'Late Stage' },
    { value: 'sector_focused', label: 'Sector Focused' },
  ],
  realEstate: [
    { value: 'core', label: 'Core' },
    { value: 'core_plus', label: 'Core Plus' },
    { value: 'value_add', label: 'Value Add' },
    { value: 'opportunistic', label: 'Opportunistic' },
  ],
  infrastructure: [
    { value: 'core_infra', label: 'Core Infrastructure' },
    { value: 'transport', label: 'Transport' },
    { value: 'digital_infra', label: 'Digital Infrastructure' },
    { value: 'energy_transition', label: 'Energy Transition' },
  ],
  privateCredit: [
    { value: 'direct_lending', label: 'Direct Lending' },
    { value: 'mezzanine', label: 'Mezzanine' },
    { value: 'distressed_credit', label: 'Distressed Credit' },
    { value: 'specialty_finance', label: 'Specialty Finance' },
  ],
  hedgeFunds: [
    { value: 'long_short', label: 'Equity Long/Short' },
    { value: 'relative_value', label: 'Relative Value' },
    { value: 'macro', label: 'Global Macro' },
    { value: 'multi_strategy', label: 'Multi-Strategy' },
    { value: 'event_driven', label: 'Event Driven' },
  ],
};

export const DEFAULT_ALTERNATIVES: AlternativesAllocation = {
  privateEquity: 25,
  ventureCapital: 10,
  realEstate: 25,
  infrastructure: 15,
  privateCredit: 15,
  hedgeFunds: 10,
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
    equities: 65,
    bonds: 15,
    hedging: 5,
    alternatives: 10,
    cash: 5,
  },
  alternatives: DEFAULT_ALTERNATIVES,
  alternativeConfigs: [
    { key: 'privateEquity', label: 'Private Equity', targetWeight: 25, strategy: 'buyout', geography: 'global' },
    { key: 'realEstate', label: 'Real Estate', targetWeight: 25, strategy: 'core', geography: 'us' },
    { key: 'infrastructure', label: 'Infrastructure', targetWeight: 15, strategy: 'core_infra', geography: 'global' },
    { key: 'privateCredit', label: 'Private Credit', targetWeight: 15, strategy: 'direct_lending', geography: 'us' },
    { key: 'ventureCapital', label: 'Venture Capital', targetWeight: 10, strategy: 'late_stage', geography: 'us' },
    { key: 'hedgeFunds', label: 'Hedge Funds', targetWeight: 10, strategy: 'multi_strategy', geography: 'global' },
  ],
  buckets: [
    { key: 'core_equities', label: 'Core Equities', targetWeight: 50, implementation: 'stocks', benchmark: 'S&P 500' },
    { key: 'satellite', label: 'Satellite / Alpha', targetWeight: 25, implementation: 'stocks' },
    { key: 'fixed_income', label: 'Fixed Income', targetWeight: 10, implementation: 'etfs', benchmark: '60/40' },
    { key: 'hedge', label: 'Hedge / Short', targetWeight: 10, implementation: 'options_overlay' },
    { key: 'cash', label: 'Cash Buffer', targetWeight: 5, implementation: 'mutual_funds' },
  ],
};
