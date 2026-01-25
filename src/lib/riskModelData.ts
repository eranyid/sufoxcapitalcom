/**
 * Risk Model Dashboard - Data Utilities
 * Generates computed data for the Salesforce-style Risk Model Dashboard
 */

import { Transaction, MonthlyValuation } from '@/types/investment';
import { 
  calculateMonthlyReturns, 
  calculateCumulativeReturns,
  calculatePositions,
  getLatestValuations,
  calculateVolatility
} from './calculations';
import { format, parseISO, subMonths } from 'date-fns';

export type Frequency = 'monthly' | 'quarterly';

export interface RiskModelFilters {
  benchmark: 'SPY' | '60_40' | 'TA125' | 'none';
  dateRange: { start: string; end: string };
  frequency: Frequency;
}

export interface TimeSeriesPoint {
  month: string;
  label: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  activeReturn: number;
  riskFreeReturn: number;
  cumulativePortfolio: number;
  cumulativeBenchmark: number;
  cumulativeActive: number;
}

export interface AttributionData {
  category: string;
  exposure: number;
  benchmarkExposure: number;
  activeExposure: number;
  contribution: number;
  premium: number;
  children?: AttributionData[];
}

export interface RiskExposureData {
  factor: string;
  portfolio: number;
  benchmark: number;
  active: number;
  contribution: number;
}

// Generate mock benchmark returns (in production, use real data)
function generateBenchmarkReturns(months: string[], benchmark: string): Record<string, number> {
  const returns: Record<string, number> = {};
  const seed = benchmark === 'SPY' ? 1234 : benchmark === '60_40' ? 5678 : 9012;
  
  // Use deterministic pseudo-random based on month and benchmark
  months.forEach((month, i) => {
    const hash = (seed + i * 17) % 1000;
    const baseReturn = benchmark === 'SPY' ? 0.8 : benchmark === '60_40' ? 0.5 : 0.6;
    const volatility = benchmark === 'SPY' ? 4 : benchmark === '60_40' ? 2.5 : 3.5;
    
    // Deterministic "random" offset
    const offset = ((hash - 500) / 500) * volatility;
    returns[month] = baseReturn + offset;
  });
  
  return returns;
}

// Get risk-free rate (simplified - use 0.3% monthly ~ 3.6% annual)
function getRiskFreeReturn(): number {
  return 0.3;
}

export function calculateRiskModelTimeSeries(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  filters: RiskModelFilters
): TimeSeriesPoint[] {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  
  if (monthlyReturns.length === 0) {
    return [];
  }
  
  // Filter by date range
  let filteredReturns = monthlyReturns.filter(r => {
    return r.month >= filters.dateRange.start && r.month <= filters.dateRange.end;
  });
  
  // Aggregate to quarterly if needed
  if (filters.frequency === 'quarterly') {
    filteredReturns = aggregateToQuarterly(filteredReturns);
  }
  
  const months = filteredReturns.map(r => r.month);
  const benchmarkReturns = filters.benchmark !== 'none' 
    ? generateBenchmarkReturns(months, filters.benchmark)
    : {};
  const riskFreeReturn = getRiskFreeReturn();
  
  // Calculate cumulative returns
  let cumulativePortfolio = 1;
  let cumulativeBenchmark = 1;
  let cumulativeActive = 1;
  
  return filteredReturns.map(({ month, return: portfolioReturn }) => {
    const benchReturn = benchmarkReturns[month] ?? 0;
    const activeReturn = portfolioReturn - benchReturn;
    
    cumulativePortfolio *= (1 + portfolioReturn / 100);
    cumulativeBenchmark *= (1 + benchReturn / 100);
    cumulativeActive *= (1 + activeReturn / 100);
    
    return {
      month,
      label: formatMonthLabel(month, filters.frequency),
      portfolioReturn,
      benchmarkReturn: benchReturn,
      activeReturn,
      riskFreeReturn,
      cumulativePortfolio: (cumulativePortfolio - 1) * 100,
      cumulativeBenchmark: (cumulativeBenchmark - 1) * 100,
      cumulativeActive: (cumulativeActive - 1) * 100,
    };
  });
}

function aggregateToQuarterly(
  monthlyReturns: { month: string; return: number; value: number }[]
): { month: string; return: number; value: number }[] {
  const quarters: Record<string, { returns: number[]; lastValue: number; month: string }> = {};
  
  monthlyReturns.forEach(({ month, return: ret, value }) => {
    const [year, m] = month.split('-');
    const q = Math.ceil(parseInt(m) / 3);
    const quarterKey = `${year}-Q${q}`;
    
    if (!quarters[quarterKey]) {
      quarters[quarterKey] = { returns: [], lastValue: 0, month };
    }
    quarters[quarterKey].returns.push(ret);
    quarters[quarterKey].lastValue = value;
    quarters[quarterKey].month = month;
  });
  
  return Object.entries(quarters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { returns, lastValue, month }]) => {
      // Geometric linking for quarterly return
      const quarterlyReturn = returns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1;
      return {
        month: key,
        return: quarterlyReturn * 100,
        value: lastValue,
      };
    });
}

function formatMonthLabel(month: string, frequency: Frequency): string {
  if (frequency === 'quarterly') {
    return month; // Already Q format
  }
  try {
    const date = parseISO(`${month}-01`);
    return format(date, 'MMM yyyy');
  } catch {
    return month;
  }
}

export function calculateAttributionByCategory(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  groupBy: 'assetType' | 'geography' | 'currency' | 'sector'
): AttributionData[] {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  
  // Calculate total portfolio value
  let totalValue = 0;
  const holdingsByCategory: Record<string, {
    value: number;
    contribution: number;
    tickers: string[];
  }> = {};
  
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;
    
    const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    totalValue += value;
    
    // Get category based on groupBy
    let category: string;
    switch (groupBy) {
      case 'assetType':
        category = tx.assetType || 'Other';
        break;
      case 'geography':
        category = tx.geography || 'Unknown';
        break;
      case 'currency':
        category = tx.currency || 'USD';
        break;
      case 'sector':
        category = 'Equity'; // Simplified - would need sector data
        break;
      default:
        category = 'Other';
    }
    
    if (!holdingsByCategory[category]) {
      holdingsByCategory[category] = { value: 0, contribution: 0, tickers: [] };
    }
    holdingsByCategory[category].value += value;
    holdingsByCategory[category].tickers.push(ticker);
  }
  
  // Calculate attribution
  const result: AttributionData[] = [];
  
  for (const [category, data] of Object.entries(holdingsByCategory)) {
    const exposure = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    
    // Mock benchmark exposure (in production, use real benchmark weights)
    const benchmarkExposure = exposure * 0.8 + Math.random() * 10;
    const activeExposure = exposure - benchmarkExposure;
    
    // Calculate contribution (simplified: weight * overall return)
    const totalReturn = monthlyReturns.length > 0 
      ? monthlyReturns[monthlyReturns.length - 1].return 
      : 0;
    const contribution = (exposure / 100) * totalReturn;
    
    result.push({
      category,
      exposure,
      benchmarkExposure: Math.max(0, benchmarkExposure),
      activeExposure,
      contribution,
      premium: activeExposure * 0.1, // Simplified premium calculation
    });
  }
  
  return result.sort((a, b) => b.exposure - a.exposure);
}

export function calculateRiskExposures(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): RiskExposureData[] {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const returns = monthlyReturns.map(r => r.return);
  const vol = calculateVolatility(returns);
  
  // Simplified factor exposures (in production, use real factor model)
  const factors = [
    { factor: 'Market', portfolio: 1.05, benchmark: 1.0 },
    { factor: 'Size', portfolio: 0.15, benchmark: 0.0 },
    { factor: 'Value', portfolio: -0.08, benchmark: 0.0 },
    { factor: 'Momentum', portfolio: 0.22, benchmark: 0.0 },
    { factor: 'Quality', portfolio: 0.18, benchmark: 0.0 },
    { factor: 'Volatility', portfolio: -0.12, benchmark: 0.0 },
  ];
  
  return factors.map(f => ({
    factor: f.factor,
    portfolio: f.portfolio * (vol / 15), // Scale by actual vol
    benchmark: f.benchmark,
    active: (f.portfolio - f.benchmark) * (vol / 15),
    contribution: f.portfolio * (vol / 15) * 0.1, // Simplified
  }));
}

export function getDefaultDateRange(valuations: MonthlyValuation[]): { start: string; end: string } {
  if (valuations.length === 0) {
    const now = new Date();
    const start = subMonths(now, 24);
    return {
      start: format(start, 'yyyy-MM'),
      end: format(now, 'yyyy-MM'),
    };
  }
  
  const months = valuations.map(v => v.month).sort();
  const endMonth = months[months.length - 1];
  
  // Default to last 24 months or all available
  const startDate = subMonths(parseISO(`${endMonth}-01`), 23);
  const startMonth = format(startDate, 'yyyy-MM');
  
  return {
    start: months[0] > startMonth ? months[0] : startMonth,
    end: endMonth,
  };
}

export function calculateScenarioImpact(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  scenario: 'recession' | 'inflation' | 'rates_up' | 'rates_down' | 'custom'
): { factor: string; impact: number; description: string }[] {
  const scenarios: Record<string, { factor: string; impact: number; description: string }[]> = {
    recession: [
      { factor: 'Equity', impact: -25, description: 'Market selloff' },
      { factor: 'Credit', impact: -10, description: 'Spread widening' },
      { factor: 'Duration', impact: 8, description: 'Flight to quality' },
      { factor: 'Volatility', impact: 15, description: 'VIX spike' },
    ],
    inflation: [
      { factor: 'Equity', impact: -8, description: 'Multiple compression' },
      { factor: 'Duration', impact: -12, description: 'Rate repricing' },
      { factor: 'Commodities', impact: 20, description: 'Real asset rally' },
      { factor: 'Real Rates', impact: -5, description: 'Negative real yields' },
    ],
    rates_up: [
      { factor: 'Duration', impact: -15, description: 'Bond losses' },
      { factor: 'Equity', impact: -5, description: 'Discount rate effect' },
      { factor: 'Financials', impact: 8, description: 'NIM expansion' },
      { factor: 'Growth', impact: -12, description: 'Long duration equities' },
    ],
    rates_down: [
      { factor: 'Duration', impact: 10, description: 'Bond gains' },
      { factor: 'Equity', impact: 5, description: 'Multiple expansion' },
      { factor: 'Growth', impact: 12, description: 'Long duration benefits' },
      { factor: 'Financials', impact: -5, description: 'NIM compression' },
    ],
    custom: [
      { factor: 'Portfolio', impact: 0, description: 'Define custom shocks' },
    ],
  };
  
  return scenarios[scenario] || scenarios.custom;
}

export function calculateRiskForecast(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  horizon: 3 | 6 | 12
): { month: string; expectedVol: number; varLower: number; varUpper: number }[] {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const returns = monthlyReturns.map(r => r.return);
  const currentVol = calculateVolatility(returns) || 15;
  
  const result: { month: string; expectedVol: number; varLower: number; varUpper: number }[] = [];
  const now = new Date();
  
  for (let i = 1; i <= horizon; i++) {
    const futureDate = subMonths(now, -i);
    const month = format(futureDate, 'yyyy-MM');
    
    // Simple mean reversion model for vol forecast
    const longTermVol = 15; // Long-term average
    const meanReversion = 0.15; // Monthly reversion speed
    const expectedVol = currentVol + (longTermVol - currentVol) * (1 - Math.pow(1 - meanReversion, i));
    
    // Confidence interval (grows with horizon)
    const uncertainty = currentVol * 0.3 * Math.sqrt(i / 12);
    
    result.push({
      month,
      expectedVol,
      varLower: Math.max(5, expectedVol - uncertainty),
      varUpper: expectedVol + uncertainty,
    });
  }
  
  return result;
}

export function calculateRiskPremium(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): { period: string; equityPremium: number; termPremium: number; creditPremium: number; totalPremium: number }[] {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  
  if (monthlyReturns.length < 12) {
    return [];
  }
  
  // Calculate rolling 12-month premiums
  const result: { period: string; equityPremium: number; termPremium: number; creditPremium: number; totalPremium: number }[] = [];
  
  for (let i = 11; i < monthlyReturns.length; i++) {
    const window = monthlyReturns.slice(i - 11, i + 1);
    const avgReturn = window.reduce((sum, r) => sum + r.return, 0) / 12;
    const annualizedReturn = avgReturn * 12;
    const riskFree = 3.6; // Annualized risk-free
    
    // Decompose premium (simplified)
    const totalPremium = annualizedReturn - riskFree;
    const equityPremium = totalPremium * 0.6;
    const termPremium = totalPremium * 0.25;
    const creditPremium = totalPremium * 0.15;
    
    result.push({
      period: window[11].month,
      equityPremium,
      termPremium,
      creditPremium,
      totalPremium,
    });
  }
  
  return result;
}
