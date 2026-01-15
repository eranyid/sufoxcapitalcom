export type AssetType = 'equity' | 'bond' | 'commodity' | 'crypto' | 'real_estate' | 'cash' | 'alternative' | 'etf' | 'mutual_fund' | 'private_equity' | 'private_debt' | 'hedge_fund';
export type TransactionType = 'buy' | 'sell';
export type Geography = 'north_america' | 'europe' | 'israel' | 'emerging_markets' | 'global' | 'other';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'ZAR' | 'ILS' | 'OTHER';

export type CashCurrency = 'USD' | 'EUR' | 'ILS' | 'GBP' | 'CHF' | 'JPY';

export interface CashBalances {
  USD: number;
  EUR: number;
  ILS: number;
  GBP: number;
  CHF: number;
  JPY: number;
}

export interface Transaction {
  id: string;
  assetName: string;
  ticker: string;
  assetType: AssetType;
  transactionType: TransactionType;
  date: string;
  quantity: number;
  pricePerUnit: number;
  fees: number;
  currency: Currency;
  geography: Geography;
  inceptionYear?: number; // Year the asset was first listed/launched
  // FX tracking for accurate P/L calculation
  fxRateAtEntry?: number; // FX rate at time of transaction
  costLocal?: number;     // Total cost in asset currency
  costBase?: number;      // Total cost in base currency
}

export interface MonthlyValuation {
  id: string;
  assetId: string;
  ticker: string;
  assetName: string;
  month: string; // YYYY-MM format
  pricePerUnit: number;
  fxRate?: number;
  linkedCompanyId?: string; // Link to CRM company analysis
  // Bond/Debt specific fields
  yieldToMaturity?: number; // YTM percentage
  couponRate?: number; // Annual coupon rate percentage
  duration?: number; // Modified duration in years
  accruedInterest?: number; // Accrued interest amount
  maturityDate?: string; // Bond maturity date (YYYY-MM-DD)
}

export interface PortfolioHoldingPL {
  unrealizedPL: number;        // Total P/L = Market + FX
  marketPL: number;            // P/L from price changes only
  fxPL: number;                // P/L from currency changes only
  plPercent: number;           // Total P/L percentage
  marketPLPercent: number;     // Market P/L percentage
  fxPLPercent: number;         // FX P/L percentage
}

export interface Asset {
  id: string;
  name: string;
  ticker: string;
  type: AssetType;
  geography: Geography;
  currency: Currency;
}

export interface PortfolioSettings {
  riskFreeRate: number;
  benchmarkReturns: number[];
  baseCurrency: Currency;
}

export interface PerformanceMetrics {
  totalValue: number;        // NAV = Holdings + Cash (unified metric)
  holdingsValue: number;     // Market value of holdings only (secondary metric)
  cashValue: number;         // Total cash balance (for reference)
  totalCost: number;
  realizedPL: number;
  unrealizedPL: number;
  // NEW: Separated P/L components
  marketPL: number;          // P/L from market price changes
  fxPL: number;              // P/L from FX rate changes
  totalPL: number;
  totalReturn: number;
  monthlyReturns: { month: string; return: number }[];
  cumulativeReturns: { month: string; return: number }[];
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  drawdownSeries: { month: string; drawdown: number }[];
  irr: number;
  twr: number;
  winLossRatio: number;
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  var95: number;
  var99: number;
  maxDrawdown: number;
  beta: number;
  trackingError: number;
  rollingVolatility: { month: string; volatility: number }[];
  rollingSharpe: { month: string; sharpe: number }[];
}

export interface Allocation {
  name: string;
  value: number;
  percentage: number;
}

export interface ContributionToReturn {
  ticker: string;
  name: string;
  contribution: number;
  weight: number;
  plPercent: number;
}

// Factor Model Types - defined here to avoid circular dependency
export interface FactorExposure {
  factor: string;
  factorLabel: string;
  factorType: 'style' | 'macro';
  beta: number;
  tStat: number;
  r2: number;
  pValue: number;
}

export interface FactorRiskBreakdown {
  factor: string;
  factorLabel: string;
  contributionPct: number;
  contributionAbs: number;
}

export interface FactorModelResults {
  exposures: FactorExposure[];
  risk: FactorRiskBreakdown[];
  systematicPct: number;
  specificPct: number;
  factorCovariance: number[][];
  factorCorrelation: number[][];
  totalVariance: number;
  systematicVariance: number;
  specificVariance: number;
  residualVolatility: number;
}
