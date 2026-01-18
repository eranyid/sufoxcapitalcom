/**
 * Chart Builder Calculations
 * Uses the unified calculation engine from calculations.ts
 */

import { 
  ChartBuilderState, 
  ChartMetric, 
  DateRangePreset,
} from '@/types/chartBuilder';
import { Transaction, MonthlyValuation } from '@/types/investment';
import {
  calculateMonthlyReturns,
  calculateCumulativeReturns,
  calculateDrawdown,
  calculateVolatility,
  calculateBeta,
  calculateCorrelationMatrix,
  calculatePositions,
  getLatestValuations,
  calculateContributions,
  calculateAssetMonthlyReturns,
} from './calculations';
import { subMonths, subYears, parseISO, isAfter, isBefore, format } from 'date-fns';

export interface ChartDataPoint {
  date: string;
  month: string;
  [key: string]: string | number;
}

export interface CorrelationMatrixData {
  tickers: string[];
  matrix: number[][];
}

export interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  ticker: string;
}

export interface ContributionData {
  ticker: string;
  name: string;
  contribution: number;
  weight: number;
  plPercent: number;
}

export interface ChartResult {
  success: boolean;
  data: ChartDataPoint[] | CorrelationMatrixData | AllocationData[] | ContributionData[];
  dataType: 'timeseries' | 'matrix' | 'allocation' | 'contribution';
  error?: string;
  warnings?: string[];
  metadata?: {
    assets: string[];
    assetsWithData: string[];
    assetsMissingData: string[];
    dateRange: { start: string; end: string };
    metric: ChartMetric;
  };
}

// Filter data by date range
function getDateRangeBounds(preset: DateRangePreset, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end = now;

  switch (preset) {
    case '3M':
      start = subMonths(now, 3);
      break;
    case '6M':
      start = subMonths(now, 6);
      break;
    case '1Y':
      start = subYears(now, 1);
      break;
    case '3Y':
      start = subYears(now, 3);
      break;
    case 'ALL':
      start = new Date(2000, 0, 1); // Far past
      break;
    case 'custom':
      start = customStart ? parseISO(customStart) : subYears(now, 1);
      end = customEnd ? parseISO(customEnd) : now;
      break;
    default:
      start = subYears(now, 1);
  }

  return { start, end };
}

function filterValuationsByDateRange(
  valuations: MonthlyValuation[],
  dateRange: DateRangePreset,
  customStart?: string,
  customEnd?: string
): MonthlyValuation[] {
  const { start, end } = getDateRangeBounds(dateRange, customStart, customEnd);
  
  return valuations.filter(v => {
    const monthDate = parseISO(`${v.month}-01`);
    return !isBefore(monthDate, start) && !isAfter(monthDate, end);
  });
}

function filterTransactionsByDateRange(
  transactions: Transaction[],
  dateRange: DateRangePreset,
  customStart?: string,
  customEnd?: string
): Transaction[] {
  const { start, end } = getDateRangeBounds(dateRange, customStart, customEnd);
  
  return transactions.filter(tx => {
    const txDate = parseISO(tx.date);
    return !isBefore(txDate, start) && !isAfter(txDate, end);
  });
}

// Calculate price history
function calculatePriceData(
  valuations: MonthlyValuation[],
  assets: string[],
  normalize: boolean
): ChartDataPoint[] {
  const months = [...new Set(valuations.map(v => v.month))].sort();
  const assetFilter = assets.length > 0 ? assets : [...new Set(valuations.map(v => v.ticker))];
  
  const result: ChartDataPoint[] = [];
  const firstPrices: Record<string, number> = {};
  
  for (const month of months) {
    const point: ChartDataPoint = { date: month, month };
    
    for (const ticker of assetFilter) {
      const val = valuations.find(v => v.month === month && v.ticker === ticker);
      if (val) {
        if (normalize && !firstPrices[ticker]) {
          firstPrices[ticker] = val.pricePerUnit;
        }
        const price = normalize && firstPrices[ticker]
          ? (val.pricePerUnit / firstPrices[ticker]) * 100
          : val.pricePerUnit;
        point[ticker] = price;
      }
    }
    
    result.push(point);
  }
  
  return result;
}

// Calculate return percentage data
function calculateReturnData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  assets: string[]
): ChartDataPoint[] {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const assetFilter = assets.length > 0 ? assets : Object.keys(assetReturns);
  
  const allMonths = new Set<string>();
  for (const ticker of assetFilter) {
    if (assetReturns[ticker]) {
      assetReturns[ticker].forEach(r => allMonths.add(r.month));
    }
  }
  
  const sortedMonths = [...allMonths].sort();
  const result: ChartDataPoint[] = [];
  
  for (const month of sortedMonths) {
    const point: ChartDataPoint = { date: month, month };
    
    for (const ticker of assetFilter) {
      const returns = assetReturns[ticker];
      if (returns) {
        const ret = returns.find(r => r.month === month);
        if (ret) {
          point[ticker] = ret.return;
        }
      }
    }
    
    result.push(point);
  }
  
  return result;
}

// Calculate cumulative return data
function calculateCumulativeReturnData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  assets: string[]
): ChartDataPoint[] {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const assetFilter = assets.length > 0 ? assets : Object.keys(assetReturns);
  
  const allMonths = new Set<string>();
  for (const ticker of assetFilter) {
    if (assetReturns[ticker]) {
      assetReturns[ticker].forEach(r => allMonths.add(r.month));
    }
  }
  
  const sortedMonths = [...allMonths].sort();
  const result: ChartDataPoint[] = [];
  
  // Calculate cumulative for each asset
  const cumulatives: Record<string, Record<string, number>> = {};
  for (const ticker of assetFilter) {
    const returns = assetReturns[ticker];
    if (returns) {
      const cumRets = calculateCumulativeReturns(returns);
      cumulatives[ticker] = {};
      cumRets.forEach(c => {
        cumulatives[ticker][c.month] = c.return;
      });
    }
  }
  
  for (const month of sortedMonths) {
    const point: ChartDataPoint = { date: month, month };
    
    for (const ticker of assetFilter) {
      if (cumulatives[ticker] && cumulatives[ticker][month] !== undefined) {
        point[ticker] = cumulatives[ticker][month];
      }
    }
    
    result.push(point);
  }
  
  return result;
}

// Calculate drawdown data
function calculateDrawdownData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  assets: string[]
): ChartDataPoint[] {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const assetFilter = assets.length > 0 ? assets : Object.keys(assetReturns);
  
  const allMonths = new Set<string>();
  const drawdowns: Record<string, Record<string, number>> = {};
  
  for (const ticker of assetFilter) {
    const returns = assetReturns[ticker];
    if (returns && returns.length > 0) {
      const cumRets = calculateCumulativeReturns(returns);
      const { drawdownSeries } = calculateDrawdown(cumRets);
      
      drawdowns[ticker] = {};
      drawdownSeries.forEach(d => {
        drawdowns[ticker][d.month] = d.drawdown;
        allMonths.add(d.month);
      });
    }
  }
  
  const sortedMonths = [...allMonths].sort();
  const result: ChartDataPoint[] = [];
  
  for (const month of sortedMonths) {
    const point: ChartDataPoint = { date: month, month };
    
    for (const ticker of assetFilter) {
      if (drawdowns[ticker] && drawdowns[ticker][month] !== undefined) {
        point[ticker] = drawdowns[ticker][month];
      }
    }
    
    result.push(point);
  }
  
  return result;
}

// Calculate rolling volatility
function calculateRollingVolatilityData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  assets: string[],
  window: number = 12
): ChartDataPoint[] {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const assetFilter = assets.length > 0 ? assets : Object.keys(assetReturns);
  
  const allMonths = new Set<string>();
  const rollingVols: Record<string, Record<string, number>> = {};
  
  for (const ticker of assetFilter) {
    const returns = assetReturns[ticker];
    if (returns && returns.length >= window) {
      rollingVols[ticker] = {};
      
      for (let i = window - 1; i < returns.length; i++) {
        const windowReturns = returns.slice(i - window + 1, i + 1).map(r => r.return);
        const vol = calculateVolatility(windowReturns);
        rollingVols[ticker][returns[i].month] = vol;
        allMonths.add(returns[i].month);
      }
    }
  }
  
  const sortedMonths = [...allMonths].sort();
  const result: ChartDataPoint[] = [];
  
  for (const month of sortedMonths) {
    const point: ChartDataPoint = { date: month, month };
    
    for (const ticker of assetFilter) {
      if (rollingVols[ticker] && rollingVols[ticker][month] !== undefined) {
        point[ticker] = rollingVols[ticker][month];
      }
    }
    
    result.push(point);
  }
  
  return result;
}

// Calculate rolling correlation between two assets
function calculateRollingCorrelationData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  asset1: string,
  asset2: string,
  window: number = 12
): ChartDataPoint[] {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const returns1 = assetReturns[asset1];
  const returns2 = assetReturns[asset2];
  
  if (!returns1 || !returns2) {
    return [];
  }
  
  // Align returns by month
  const months1 = new Set(returns1.map(r => r.month));
  const months2 = new Set(returns2.map(r => r.month));
  const commonMonths = [...months1].filter(m => months2.has(m)).sort();
  
  if (commonMonths.length < window) {
    return [];
  }
  
  const result: ChartDataPoint[] = [];
  
  for (let i = window - 1; i < commonMonths.length; i++) {
    const windowMonths = commonMonths.slice(i - window + 1, i + 1);
    
    const windowRets1: number[] = [];
    const windowRets2: number[] = [];
    
    for (const month of windowMonths) {
      const r1 = returns1.find(r => r.month === month);
      const r2 = returns2.find(r => r.month === month);
      if (r1 && r2) {
        windowRets1.push(r1.return);
        windowRets2.push(r2.return);
      }
    }
    
    if (windowRets1.length >= 2) {
      const corr = calculateCorrelationSingle(windowRets1, windowRets2);
      result.push({
        date: commonMonths[i],
        month: commonMonths[i],
        correlation: corr,
      });
    }
  }
  
  return result;
}

function calculateCorrelationSingle(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }
  
  const denom = Math.sqrt(sumX2 * sumY2);
  return denom === 0 ? 0 : sumXY / denom;
}

// Calculate allocation data
function calculateAllocationData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  assets: string[]
): AllocationData[] {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  const result: AllocationData[] = [];
  let totalValue = 0;
  
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    if (assets.length > 0 && !assets.includes(ticker)) continue;
    
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;
    
    const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    totalValue += value;
    
    result.push({
      name: tx.assetName,
      value,
      percentage: 0,
      ticker,
    });
  }
  
  // Calculate percentages
  result.forEach(r => {
    r.percentage = totalValue > 0 ? (r.value / totalValue) * 100 : 0;
  });
  
  return result.sort((a, b) => b.value - a.value);
}

// Calculate contribution data
function calculateContributionData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  assets: string[]
): ContributionData[] {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const contributions = calculateContributions(transactions, monthlyReturns, valuations);
  
  if (assets.length > 0) {
    return contributions.filter(c => assets.includes(c.ticker));
  }
  
  return contributions;
}

// Calculate beta data
function calculateBetaData(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  asset: string,
  benchmarkReturns: number[],
  window: number = 12
): ChartDataPoint[] {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const returns = assetReturns[asset];
  
  if (!returns || returns.length < window || benchmarkReturns.length < window) {
    return [];
  }
  
  const result: ChartDataPoint[] = [];
  
  // Align lengths
  const minLen = Math.min(returns.length, benchmarkReturns.length);
  const alignedAssetReturns = returns.slice(-minLen);
  const alignedBenchReturns = benchmarkReturns.slice(-minLen);
  
  for (let i = window - 1; i < minLen; i++) {
    const windowAssetRets = alignedAssetReturns.slice(i - window + 1, i + 1).map(r => r.return);
    const windowBenchRets = alignedBenchReturns.slice(i - window + 1, i + 1);
    
    const beta = calculateBeta(windowAssetRets, windowBenchRets);
    
    result.push({
      date: alignedAssetReturns[i].month,
      month: alignedAssetReturns[i].month,
      beta,
    });
  }
  
  return result;
}

// Main calculation dispatcher
export function calculateChartData(
  state: ChartBuilderState,
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  benchmarkReturns?: number[]
): ChartResult {
  try {
    // Filter by date range
    const filteredValuations = filterValuationsByDateRange(
      valuations,
      state.dateRange,
      state.customDateStart,
      state.customDateEnd
    );
    
    const filteredTransactions = filterTransactionsByDateRange(
      transactions,
      state.dateRange,
      state.customDateStart,
      state.customDateEnd
    );
    
    const { start, end } = getDateRangeBounds(state.dateRange, state.customDateStart, state.customDateEnd);
    
    // Check which assets have valuation data
    const assetsToCheck = state.assets.length > 0 ? state.assets : [...new Set(transactions.map(t => t.ticker))];
    const assetsWithData = assetsToCheck.filter(ticker => 
      filteredValuations.some(v => v.ticker === ticker)
    );
    const assetsMissingData = assetsToCheck.filter(ticker => 
      !filteredValuations.some(v => v.ticker === ticker)
    );
    
    const metadata = {
      assets: state.assets,
      assetsWithData,
      assetsMissingData,
      dateRange: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      metric: state.metric,
    };
    
    // Generate warnings for missing data
    const warnings: string[] = [];
    if (assetsMissingData.length > 0) {
      warnings.push(`No valuation data for: ${assetsMissingData.join(', ')}`);
    }
    
    switch (state.metric) {
      case 'price':
        return {
          success: true,
          data: calculatePriceData(filteredValuations, state.assets, state.normalize),
          dataType: 'timeseries',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'return_pct':
        // Use ALL transactions for ticker discovery, but filtered valuations for data
        return {
          success: true,
          data: calculateReturnData(transactions, filteredValuations, state.assets),
          dataType: 'timeseries',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'cumulative_return':
        // Use ALL transactions for ticker discovery, but filtered valuations for data
        return {
          success: true,
          data: calculateCumulativeReturnData(transactions, filteredValuations, state.assets),
          dataType: 'timeseries',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'drawdown':
        // Use ALL transactions for ticker discovery, but filtered valuations for data
        return {
          success: true,
          data: calculateDrawdownData(transactions, filteredValuations, state.assets),
          dataType: 'timeseries',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'rolling_volatility':
        // Use ALL transactions for ticker discovery, but filtered valuations for data
        return {
          success: true,
          data: calculateRollingVolatilityData(
            transactions, 
            filteredValuations, 
            state.assets, 
            state.rollingWindow
          ),
          dataType: 'timeseries',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'correlation_matrix':
        // For correlation matrix, use ALL transactions and valuations (not filtered)
        // because we need enough history for meaningful correlations
        const { tickers, matrix } = calculateCorrelationMatrix(transactions, valuations);
        
        // Filter tickers based on selected assets
        const filteredTickers = state.assets.length > 0 
          ? tickers.filter(t => state.assets.includes(t))
          : tickers;
        
        // If not enough assets after filtering, return error
        if (filteredTickers.length < 2) {
          return {
            success: false,
            data: { tickers: [], matrix: [] },
            dataType: 'matrix',
            error: 'Need at least 2 assets with overlapping data for correlation matrix',
          };
        }
        
        // Filter matrix to match selected assets
        const tickerIndices = filteredTickers.map(t => tickers.indexOf(t)).filter(i => i >= 0);
        const filteredMatrix = tickerIndices.map(i => 
          tickerIndices.map(j => matrix[i][j])
        );
        
        // Check for assets that didn't make it into the matrix
        const matrixMissingAssets = state.assets.filter(a => !filteredTickers.includes(a));
        const matrixWarnings = matrixMissingAssets.length > 0 
          ? [`Excluded from matrix (insufficient data): ${matrixMissingAssets.join(', ')}`]
          : warnings.length > 0 ? warnings : undefined;
        
        return {
          success: true,
          data: { tickers: filteredTickers, matrix: filteredMatrix },
          dataType: 'matrix',
          warnings: matrixWarnings,
          metadata,
        };
        
      case 'rolling_correlation':
        const asset1 = state.asset1 || state.assets[0];
        const asset2 = state.asset2 || state.assets[1];
        
        if (!asset1 || !asset2) {
          return {
            success: false,
            data: [],
            dataType: 'timeseries',
            error: 'Select exactly 2 assets for rolling correlation',
          };
        }
        
        return {
          success: true,
          data: calculateRollingCorrelationData(
            transactions,
            filteredValuations,
            asset1,
            asset2,
            state.rollingWindow
          ),
          dataType: 'timeseries',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'beta_vs_benchmark':
        const betaAsset = state.assets[0];
        if (!betaAsset) {
          return {
            success: false,
            data: [],
            dataType: 'timeseries',
            error: 'Select an asset for beta calculation',
          };
        }
        
        if (!benchmarkReturns || benchmarkReturns.length === 0) {
          return {
            success: false,
            data: [],
            dataType: 'timeseries',
            error: 'Benchmark data not available',
          };
        }
        
        return {
          success: true,
          data: calculateBetaData(
            transactions,
            filteredValuations,
            betaAsset,
            benchmarkReturns,
            state.rollingWindow
          ),
          dataType: 'timeseries',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'allocation':
        return {
          success: true,
          data: calculateAllocationData(transactions, valuations, state.assets),
          dataType: 'allocation',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      case 'contribution':
        // Use ALL transactions for ticker discovery
        return {
          success: true,
          data: calculateContributionData(transactions, filteredValuations, state.assets),
          dataType: 'contribution',
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata,
        };
        
      default:
        return {
          success: false,
          data: [],
          dataType: 'timeseries',
          error: `Unknown metric: ${state.metric}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      dataType: 'timeseries',
      error: error instanceof Error ? error.message : 'Calculation error',
    };
  }
}
