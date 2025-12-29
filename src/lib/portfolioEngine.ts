/**
 * Portfolio Engine - Single Source of Truth
 * 
 * All portfolio metrics computed once here, consumed everywhere.
 * NO local calculations in pages/components.
 */

import { Transaction, MonthlyValuation, CashBalances, Allocation } from '@/types/investment';
import { 
  calculatePositions, 
  getLatestValuations, 
  calculateTotalCashInBaseCurrency,
  calculateAllocations,
  calculateAssetMonthlyReturns,
  calculateVolatility
} from './calculations';

// ============================================
// TYPES
// ============================================

export interface RiskReturnPoint {
  ticker: string;
  name: string;
  annualizedReturn: number;
  annualizedVolatility: number;
  weight: number;
  sharpeRatio?: number;
}

// ============================================
// TYPES
// ============================================

export interface PortfolioHolding {
  ticker: string;
  name: string;
  assetType: string;
  geography: string;
  currency: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  fxRate: number;
  currentValue: number;
  costBasis: number;
  unrealizedPL: number;
  plPercent: number;
  weight: number;
}

export interface RingSegment {
  id: string;
  name: string;
  value: number;
  weight: number;
  color: string;
  ticker?: string;
  plPercent?: number;
}

export interface RiskReturnData {
  holdings: RiskReturnPoint[];
  portfolio: {
    annualizedReturn: number;
    annualizedVolatility: number;
  };
  excludedCount: number; // Holdings with insufficient history
}

export interface ComputedPortfolioData {
  // Core values (FX-normalized to base currency)
  totalPortfolioValue: number;
  holdingsValue: number;
  cashValue: number;
  cashPercent: number;
  
  // Positions
  holdings: PortfolioHolding[];
  positionsCount: number;
  
  // Allocations
  assetTypeAllocation: Allocation[];
  geographyAllocation: Allocation[];
  currencyAllocation: Allocation[];
  
  // Ring data for charts
  assetClassRings: RingSegment[];
  geographyRings: RingSegment[];
  positionRings: RingSegment[];
  
  // Risk/Return scatter data
  riskReturnData: RiskReturnData;
  
  // Metadata
  lastUpdated: Date;
}

export interface ConsistencyCheckResult {
  isValid: boolean;
  checks: {
    name: string;
    passed: boolean;
    expected?: number;
    actual?: number;
    tolerance?: number;
  }[];
}

// ============================================
// COLOR PALETTES
// ============================================

const ASSET_CLASS_COLORS = ['#FF8C00', '#4A90D9', '#50C878', '#9370DB', '#FFD700', '#FF6B6B', '#20B2AA', '#DDA0DD'];
const GEOGRAPHY_COLORS = ['#20B2AA', '#DDA0DD', '#87CEEB', '#F0E68C', '#DEB887', '#98FB98'];
const POSITION_COLORS = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD', '#87CEEB', '#F0E68C', '#DEB887', '#98FB98', '#FFA07A', '#B0C4DE', '#FFDAB9', '#E6E6FA', '#F5DEB3', '#D8BFD8', '#FFFACD', '#E0FFFF'];

// ============================================
// MAIN COMPUTATION ENGINE
// ============================================

/**
 * Compute all portfolio data from raw inputs
 * This is THE SINGLE SOURCE OF TRUTH for all portfolio metrics
 */
export function computePortfolioData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  cashBalances: CashBalances,
  baseCurrency: 'USD' | 'ILS' = 'USD'
): ComputedPortfolioData {
  const hasData = transactions.length > 0 && valuations.length > 0;
  
  if (!hasData) {
    return createEmptyPortfolioData();
  }
  
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  // Calculate holdings with proper FX conversion
  const holdings: PortfolioHolding[] = [];
  let holdingsValue = 0;
  
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;
    
    const fxRate = val.fxRate || 1;
    const currentPrice = val.pricePerUnit;
    const currentValue = pos.quantity * currentPrice * fxRate;
    const costBasis = pos.totalCost;
    const unrealizedPL = currentValue - costBasis;
    const plPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
    
    holdingsValue += currentValue;
    
    holdings.push({
      ticker,
      name: tx.assetName,
      assetType: tx.assetType,
      geography: tx.geography,
      currency: tx.currency,
      quantity: pos.quantity,
      avgCost: pos.avgCost,
      currentPrice,
      fxRate,
      currentValue,
      costBasis,
      unrealizedPL,
      plPercent,
      weight: 0 // Will be calculated after total is known
    });
  }
  
  // Calculate cash value using centralized FX conversion
  const cashValue = calculateTotalCashInBaseCurrency(cashBalances, baseCurrency);
  
  // Total portfolio value = Holdings + Cash (NAV)
  const totalPortfolioValue = holdingsValue + cashValue;
  
  // Calculate weights
  holdings.forEach(h => {
    h.weight = totalPortfolioValue > 0 ? (h.currentValue / totalPortfolioValue) * 100 : 0;
  });
  
  // Sort holdings by weight
  holdings.sort((a, b) => b.weight - a.weight);
  
  // Cash percentage
  const cashPercent = totalPortfolioValue > 0 ? (cashValue / totalPortfolioValue) * 100 : 0;
  
  // Calculate allocations using the centralized function
  const assetTypeAllocation = calculateAllocations(transactions, valuations, 'assetType');
  const geographyAllocation = calculateAllocations(transactions, valuations, 'geography');
  const currencyAllocation = calculateAllocations(transactions, valuations, 'currency');
  
  // Build ring data for charts
  const { assetClassRings, geographyRings, positionRings } = buildRingData(
    holdings,
    cashValue,
    totalPortfolioValue
  );
  
  // Build risk/return data for scatter chart
  const riskReturnData = buildRiskReturnData(holdings, transactions, valuations);
  
  return {
    totalPortfolioValue,
    holdingsValue,
    cashValue,
    cashPercent,
    holdings,
    positionsCount: holdings.length,
    assetTypeAllocation,
    geographyAllocation,
    currencyAllocation,
    assetClassRings,
    geographyRings,
    positionRings,
    riskReturnData,
    lastUpdated: new Date()
  };
}

/**
 * Build ring chart data from holdings
 */
function buildRingData(
  holdings: PortfolioHolding[],
  cashValue: number,
  totalPortfolioValue: number
): {
  assetClassRings: RingSegment[];
  geographyRings: RingSegment[];
  positionRings: RingSegment[];
} {
  // Asset class rings
  const assetTypeMap = new Map<string, { value: number; items: PortfolioHolding[] }>();
  for (const holding of holdings) {
    const assetType = holding.assetType || 'Other';
    if (!assetTypeMap.has(assetType)) {
      assetTypeMap.set(assetType, { value: 0, items: [] });
    }
    const group = assetTypeMap.get(assetType)!;
    group.value += holding.currentValue;
    group.items.push(holding);
  }
  
  if (cashValue > 0) {
    assetTypeMap.set('Cash', { value: cashValue, items: [] });
  }
  
  const assetClassRings: RingSegment[] = Array.from(assetTypeMap.entries()).map(([name, data], idx) => ({
    id: `asset-${name}`,
    name: formatAllocationName(name),
    value: data.value,
    weight: totalPortfolioValue > 0 ? (data.value / totalPortfolioValue) * 100 : 0,
    color: ASSET_CLASS_COLORS[idx % ASSET_CLASS_COLORS.length]
  }));
  
  // Geography rings
  const geoMap = new Map<string, number>();
  for (const holding of holdings) {
    const geo = holding.geography || 'Other';
    geoMap.set(geo, (geoMap.get(geo) || 0) + holding.currentValue);
  }
  
  const geographyRings: RingSegment[] = Array.from(geoMap.entries()).map(([name, value], idx) => ({
    id: `geo-${name}`,
    name: formatAllocationName(name),
    value,
    weight: totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0,
    color: GEOGRAPHY_COLORS[idx % GEOGRAPHY_COLORS.length]
  }));
  
  // Position rings
  const positionRings: RingSegment[] = holdings.map((h, idx) => ({
    id: h.ticker,
    name: h.name,
    ticker: h.ticker,
    value: h.currentValue,
    weight: h.weight,
    plPercent: h.plPercent,
    color: POSITION_COLORS[idx % POSITION_COLORS.length]
  }));
  
  return { assetClassRings, geographyRings, positionRings };
}

/**
 * Build risk/return scatter data for each holding
 * Returns annualized return and volatility for scatter plot
 */
function buildRiskReturnData(
  holdings: PortfolioHolding[],
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): RiskReturnData {
  const MIN_PERIODS = 3; // Minimum months of data needed
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  
  const riskReturnPoints: RiskReturnPoint[] = [];
  let excludedCount = 0;
  
  for (const holding of holdings) {
    const returns = assetReturns[holding.ticker];
    
    // Skip if insufficient history
    if (!returns || returns.length < MIN_PERIODS) {
      excludedCount++;
      continue;
    }
    
    const monthlyReturns = returns.map(r => r.return);
    
    // Calculate annualized return (geometric mean)
    const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
    const annualizedReturn = avgMonthlyReturn * 12; // Simple annualization
    
    // Calculate annualized volatility
    const annualizedVolatility = calculateVolatility(monthlyReturns);
    
    // Calculate Sharpe-like ratio (assuming 4.5% risk-free rate)
    const riskFreeRate = 4.5;
    const sharpeRatio = annualizedVolatility > 0 
      ? (annualizedReturn - riskFreeRate) / annualizedVolatility 
      : 0;
    
    riskReturnPoints.push({
      ticker: holding.ticker,
      name: holding.name,
      annualizedReturn,
      annualizedVolatility,
      weight: holding.weight,
      sharpeRatio
    });
  }
  
  // Calculate portfolio-weighted average
  const totalWeight = riskReturnPoints.reduce((sum, p) => sum + p.weight, 0);
  
  let portfolioReturn = 0;
  let portfolioVol = 0;
  
  if (totalWeight > 0) {
    for (const point of riskReturnPoints) {
      const normalizedWeight = point.weight / totalWeight;
      portfolioReturn += normalizedWeight * point.annualizedReturn;
      portfolioVol += normalizedWeight * point.annualizedVolatility;
    }
  }
  
  return {
    holdings: riskReturnPoints,
    portfolio: {
      annualizedReturn: portfolioReturn,
      annualizedVolatility: portfolioVol
    },
    excludedCount
  };
}

/**
 * Format allocation names for display
 */
function formatAllocationName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Create empty portfolio data structure
 */
function createEmptyPortfolioData(): ComputedPortfolioData {
  return {
    totalPortfolioValue: 0,
    holdingsValue: 0,
    cashValue: 0,
    cashPercent: 0,
    holdings: [],
    positionsCount: 0,
    assetTypeAllocation: [],
    geographyAllocation: [],
    currencyAllocation: [],
    assetClassRings: [],
    geographyRings: [],
    positionRings: [],
    riskReturnData: {
      holdings: [],
      portfolio: { annualizedReturn: 0, annualizedVolatility: 0 },
      excludedCount: 0
    },
    lastUpdated: new Date()
  };
}

// ============================================
// CONSISTENCY CHECKS
// ============================================

/**
 * Validate portfolio data consistency
 * Run these checks to detect calculation mismatches
 */
export function runConsistencyChecks(
  computedData: ComputedPortfolioData,
  performanceMetrics: { totalValue: number; holdingsValue: number; cashValue: number } | null
): ConsistencyCheckResult {
  const checks: ConsistencyCheckResult['checks'] = [];
  const TOLERANCE = 0.01; // $0.01 tolerance for rounding errors
  
  // Check 1: NAV = Holdings + Cash
  const expectedNav = computedData.holdingsValue + computedData.cashValue;
  const navCheck = Math.abs(computedData.totalPortfolioValue - expectedNav) <= TOLERANCE;
  checks.push({
    name: 'NAV equals Holdings + Cash',
    passed: navCheck,
    expected: expectedNav,
    actual: computedData.totalPortfolioValue,
    tolerance: TOLERANCE
  });
  
  // Check 2: Sum of weights should equal ~100% (excluding cash)
  const holdingsWeightSum = computedData.holdings.reduce((sum, h) => sum + h.weight, 0);
  const expectedWeightSum = 100 - computedData.cashPercent;
  const weightCheck = Math.abs(holdingsWeightSum - expectedWeightSum) <= 0.1; // 0.1% tolerance
  checks.push({
    name: 'Holdings weights sum correctly',
    passed: weightCheck,
    expected: expectedWeightSum,
    actual: holdingsWeightSum,
    tolerance: 0.1
  });
  
  // Check 3: Compare with performanceMetrics if available
  if (performanceMetrics) {
    const perfTotalCheck = Math.abs(computedData.totalPortfolioValue - performanceMetrics.totalValue) <= TOLERANCE;
    checks.push({
      name: 'Total value matches performanceMetrics',
      passed: perfTotalCheck,
      expected: performanceMetrics.totalValue,
      actual: computedData.totalPortfolioValue,
      tolerance: TOLERANCE
    });
    
    const perfCashCheck = Math.abs(computedData.cashValue - performanceMetrics.cashValue) <= TOLERANCE;
    checks.push({
      name: 'Cash value matches performanceMetrics',
      passed: perfCashCheck,
      expected: performanceMetrics.cashValue,
      actual: computedData.cashValue,
      tolerance: TOLERANCE
    });
  }
  
  // Check 4: Cash percent calculation
  const expectedCashPct = computedData.totalPortfolioValue > 0 
    ? (computedData.cashValue / computedData.totalPortfolioValue) * 100 
    : 0;
  const cashPctCheck = Math.abs(computedData.cashPercent - expectedCashPct) <= 0.01;
  checks.push({
    name: 'Cash percent calculated correctly',
    passed: cashPctCheck,
    expected: expectedCashPct,
    actual: computedData.cashPercent,
    tolerance: 0.01
  });
  
  const isValid = checks.every(c => c.passed);
  
  // Log warnings for failed checks in development
  if (!isValid && process.env.NODE_ENV === 'development') {
    const failedChecks = checks.filter(c => !c.passed);
    console.warn('[Portfolio Consistency Warning]', {
      failedChecks: failedChecks.map(c => ({
        name: c.name,
        expected: c.expected,
        actual: c.actual,
        diff: c.actual !== undefined && c.expected !== undefined 
          ? Math.abs(c.actual - c.expected) 
          : 'N/A'
      }))
    });
  }
  
  return { isValid, checks };
}

/**
 * Cross-module assertion - call this when displaying values
 * If values don't match, log warning and return the canonical value
 */
export function assertValueMatch(
  contextName: string,
  canonicalValue: number,
  localValue: number,
  valueName: string,
  tolerance: number = 0.01
): number {
  if (Math.abs(canonicalValue - localValue) > tolerance) {
    console.warn(
      `[Data Mismatch] ${contextName}.${valueName}: ` +
      `expected ${canonicalValue.toFixed(2)}, got ${localValue.toFixed(2)}. ` +
      `Using canonical value.`
    );
    return canonicalValue;
  }
  return localValue;
}
