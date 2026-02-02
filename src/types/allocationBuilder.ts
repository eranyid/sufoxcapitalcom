// Types for Allocation-Only Portfolio Builder

export type AssetType = 
  | 'equity' 
  | 'fixed_income' 
  | 'real_estate' 
  | 'commodities' 
  | 'alternatives' 
  | 'cash' 
  | 'crypto';

export type Region = 
  | 'north_america' 
  | 'europe' 
  | 'asia_pacific' 
  | 'middle_east' 
  | 'latin_america' 
  | 'africa' 
  | 'global';

export type LiquidityBucket = 
  | 'highly_liquid'    // T+0 to T+3
  | 'liquid'           // T+3 to T+30
  | 'semi_liquid'      // 30-90 days
  | 'illiquid'         // 90+ days
  | 'locked';          // Multi-year lockup

export type StyleTag = 
  | 'growth' 
  | 'value' 
  | 'income' 
  | 'defensive' 
  | 'cyclical' 
  | 'speculative'
  | 'esg'
  | 'thematic';

export interface Position {
  id: string;
  name: string;
  assetType: AssetType;
  allocation: number; // Percentage 0-100
  region: Region;
  country: string;
  sector: string;
  industry: string;
  currency: string;
  liquidityBucket: LiquidityBucket;
  styleTags: StyleTag[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationGroup {
  key: string;
  label: string;
  allocation: number;
  count: number;
  positions: Position[];
}

export interface ConcentrationMetrics {
  herfindahlIndex: number;          // 0-10000, lower = more diversified
  top3Concentration: number;         // % in top 3 positions
  top5Concentration: number;         // % in top 5 positions
  largestPosition: number;           // % of largest single position
  effectivePositions: number;        // 1/HHI normalized
}

export interface DiversificationScore {
  overall: number;                   // 0-100
  assetTypeDiversity: number;        // 0-100
  geographicDiversity: number;       // 0-100
  sectorDiversity: number;           // 0-100
  currencyDiversity: number;         // 0-100
}

export interface LiquidityExposure {
  highlyLiquid: number;
  liquid: number;
  semiLiquid: number;
  illiquid: number;
  locked: number;
  weightedLiquidityScore: number;    // 0-100, higher = more liquid
}

export interface CurrencyExposure {
  currency: string;
  allocation: number;
  positionCount: number;
}

export interface StructuralInsights {
  concentration: ConcentrationMetrics;
  diversification: DiversificationScore;
  liquidity: LiquidityExposure;
  currencies: CurrencyExposure[];
  imbalances: string[];              // Warning messages
}

export interface AllocationTarget {
  dimension: 'assetType' | 'region' | 'sector' | 'currency' | 'liquidityBucket';
  key: string;
  label: string;
  targetAllocation: number;
  actualAllocation: number;
  deviation: number;
}

export interface SankeyNode {
  id: string;
  label: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Labels for display
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  equity: 'Equity',
  fixed_income: 'Fixed Income',
  real_estate: 'Real Estate',
  commodities: 'Commodities',
  alternatives: 'Alternatives',
  cash: 'Cash',
  crypto: 'Crypto',
};

export const REGION_LABELS: Record<Region, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  middle_east: 'Middle East',
  latin_america: 'Latin America',
  africa: 'Africa',
  global: 'Global',
};

export const LIQUIDITY_LABELS: Record<LiquidityBucket, string> = {
  highly_liquid: 'Highly Liquid (T+0-3)',
  liquid: 'Liquid (T+3-30)',
  semi_liquid: 'Semi-Liquid (30-90d)',
  illiquid: 'Illiquid (90d+)',
  locked: 'Locked (Multi-year)',
};

export const STYLE_TAG_LABELS: Record<StyleTag, string> = {
  growth: 'Growth',
  value: 'Value',
  income: 'Income',
  defensive: 'Defensive',
  cyclical: 'Cyclical',
  speculative: 'Speculative',
  esg: 'ESG',
  thematic: 'Thematic',
};

// Colors for charts
export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  equity: 'hsl(var(--primary))',
  fixed_income: 'hsl(210, 80%, 55%)',
  real_estate: 'hsl(45, 90%, 50%)',
  commodities: 'hsl(30, 80%, 50%)',
  alternatives: 'hsl(280, 60%, 50%)',
  cash: 'hsl(0, 0%, 60%)',
  crypto: 'hsl(200, 80%, 50%)',
};

export const REGION_COLORS: Record<Region, string> = {
  north_america: 'hsl(210, 80%, 55%)',
  europe: 'hsl(45, 90%, 50%)',
  asia_pacific: 'hsl(0, 70%, 50%)',
  middle_east: 'hsl(30, 80%, 50%)',
  latin_america: 'hsl(120, 50%, 45%)',
  africa: 'hsl(280, 60%, 50%)',
  global: 'hsl(var(--primary))',
};

export const LIQUIDITY_COLORS: Record<LiquidityBucket, string> = {
  highly_liquid: 'hsl(160, 70%, 45%)',
  liquid: 'hsl(120, 50%, 50%)',
  semi_liquid: 'hsl(45, 90%, 50%)',
  illiquid: 'hsl(30, 80%, 50%)',
  locked: 'hsl(0, 70%, 50%)',
};

// Common sectors
export const COMMON_SECTORS = [
  'Technology',
  'Healthcare',
  'Financials',
  'Consumer Discretionary',
  'Consumer Staples',
  'Industrials',
  'Energy',
  'Materials',
  'Utilities',
  'Real Estate',
  'Communication Services',
  'Government',
  'Multi-Sector',
];

// Common currencies
export const COMMON_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'ILS',
  'CNY',
  'AUD',
  'CAD',
  'HKD',
];

// Common countries by region
export const COUNTRIES_BY_REGION: Record<Region, string[]> = {
  north_america: ['United States', 'Canada', 'Mexico'],
  europe: ['United Kingdom', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Italy', 'Spain', 'Sweden'],
  asia_pacific: ['Japan', 'China', 'South Korea', 'Australia', 'Singapore', 'Hong Kong', 'Taiwan', 'India'],
  middle_east: ['Israel', 'UAE', 'Saudi Arabia', 'Qatar'],
  latin_america: ['Brazil', 'Chile', 'Argentina', 'Colombia'],
  africa: ['South Africa', 'Egypt', 'Nigeria', 'Kenya'],
  global: ['Global/Multi-Country'],
};
