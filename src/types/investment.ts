export type AssetType = 'equity' | 'bond' | 'commodity' | 'crypto' | 'real_estate' | 'cash' | 'alternative' | 'etf' | 'mutual_fund';
export type TransactionType = 'buy' | 'sell';
export type Geography = 'north_america' | 'europe' | 'asia_pacific' | 'emerging_markets' | 'global' | 'other';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'ZAR' | 'OTHER';

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
}

export interface MonthlyValuation {
  id: string;
  assetId: string;
  ticker: string;
  assetName: string;
  month: string; // YYYY-MM format
  pricePerUnit: number;
  fxRate?: number;
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
  totalValue: number;
  totalCost: number;
  realizedPL: number;
  unrealizedPL: number;
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
}
