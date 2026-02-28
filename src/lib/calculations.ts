/**
 * SUFOX Capital Terminal - Unified Calculation Engine
 * ===================================================
 * 
 * This is the SINGLE SOURCE OF TRUTH for all portfolio analytics.
 * All formulas comply with the SUFOX Capital Terminal Formula Specification.
 * 
 * RISK METRICS:
 * - Volatility: StdDev(Monthly Returns) × √12
 * - Sharpe Ratio: (Portfolio Return - Risk-Free Rate) / Standard Deviation
 * - Sortino Ratio: (Portfolio Return - Risk-Free Rate) / Downside Deviation
 * - VaR 95%: z(0.95) × StdDev (z=1.645)
 * - VaR 99%: z(0.99) × StdDev (z=2.326)
 * - Beta: Covariance(Portfolio, Benchmark) / Variance(Benchmark)
 * - Tracking Error: StdDev(Portfolio Return - Benchmark Return) × √12
 * - Max Drawdown: (Trough Value - Peak Value) / Peak Value
 * 
 * PERFORMANCE METRICS:
 * - Total Return: (Ending Value - Beginning Value + Dividends) / Beginning Value
 * - YTD Return: (Value at Current Date - Value on Jan 1st) / Value on Jan 1st
 * - Cumulative Return: (Current Value / Initial Value) - 1
 * - TWR: Π(1 + Period Return) - 1 (product-based)
 * - IRR: Numerical solve: Σ(CF/(1+IRR)^t) = 0
 * - Win/Loss Ratio: Number of Winning Trades / Number of Losing Trades
 * 
 * NAV METRICS:
 * - Fund NAV: Total Assets - Total Liabilities
 * - Monthly Return: (Ending - Beginning) / Beginning
 * - Annualized Return: (1 + Total Return)^(1/Years) - 1
 * 
 * IMPORTANT: All modules MUST use this engine. No local calculations allowed.
 */

import { Transaction, MonthlyValuation, PerformanceMetrics, RiskMetrics, Allocation, ContributionToReturn } from '@/types/investment';
// Helper function to group transactions by ticker
export function groupTransactionsByTicker(transactions: Transaction[]) {
  return transactions.reduce((acc, tx) => {
    if (!acc[tx.ticker]) acc[tx.ticker] = [];
    acc[tx.ticker].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

// Calculate position for each asset
export function calculatePositions(transactions: Transaction[]) {
  const grouped = groupTransactionsByTicker(transactions);
  const positions: Record<string, { quantity: number; avgCost: number; totalCost: number; realizedPL: number }> = {};

  for (const [ticker, txs] of Object.entries(grouped)) {
    let quantity = 0;
    let totalCost = 0;
    let realizedPL = 0;

    const sortedTxs = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const tx of sortedTxs) {
      if (tx.transactionType === 'buy') {
        totalCost += tx.quantity * tx.pricePerUnit + tx.fees;
        quantity += tx.quantity;
      } else {
        const avgCost = quantity > 0 ? totalCost / quantity : 0;
        const saleProceeds = tx.quantity * tx.pricePerUnit - tx.fees;
        const costBasis = tx.quantity * avgCost;
        realizedPL += saleProceeds - costBasis;
        totalCost -= costBasis;
        quantity -= tx.quantity;
      }
    }

    positions[ticker] = {
      quantity,
      avgCost: quantity > 0 ? totalCost / quantity : 0,
      totalCost,
      realizedPL
    };
  }

  return positions;
}

// Get latest valuation for each asset
export function getLatestValuations(valuations: MonthlyValuation[]) {
  const latest: Record<string, MonthlyValuation> = {};
  
  for (const val of valuations) {
    if (!latest[val.ticker] || val.month > latest[val.ticker].month) {
      latest[val.ticker] = val;
    }
  }

  return latest;
}

// Calculate portfolio value at a specific month
// Now supports optional cash balances for NAV-inclusive calculation
export function calculatePortfolioValue(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  month: string,
  cashBalances?: { USD: number; EUR: number; ILS: number; GBP?: number; CHF?: number; JPY?: number },
  baseCurrency?: 'USD' | 'ILS',
  fxRates?: FxRatesMap
) {
  const positions = calculatePositions(
    transactions.filter(tx => tx.date <= `${month}-31`)
  );
  
  const monthValuations = valuations.filter(v => v.month === month);
  const valMap = new Map(monthValuations.map(v => [v.ticker, v]));
  
  let holdingsValue = 0;
  
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    const valuation = valMap.get(ticker);
    if (valuation) {
      const fxRate = valuation.fxRate || 1;
      holdingsValue += pos.quantity * valuation.pricePerUnit * fxRate;
    } else {
      // Fallback: use avgCost with proper FX conversion
      const tx = transactions.find(t => t.ticker === ticker);
      if (tx) {
        let fallbackFx = 1;
        if (tx.currency !== (baseCurrency || 'USD') && fxRates) {
          const rate = fxRates[tx.currency];
          if (rate && rate > 0) {
            fallbackFx = (baseCurrency || 'USD') === 'USD' ? (1 / rate) : rate;
          }
        }
        holdingsValue += pos.quantity * pos.avgCost * fallbackFx;
      }
    }
  }
  
  // Add cash if provided
  const cashValue = cashBalances 
    ? calculateTotalCashInBaseCurrency(cashBalances, baseCurrency || 'USD', fxRates)
    : 0;
  
  return holdingsValue + cashValue;
}

// Calculate monthly returns
// Now supports cash-inclusive NAV for accurate risk metrics
export function calculateMonthlyReturns(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  cashBalances?: CashBalancesInput,
  baseCurrency?: 'USD' | 'ILS',
  fxRates?: FxRatesMap
): { month: string; return: number; value: number }[] {
  const months = [...new Set(valuations.map(v => v.month))].sort();
  const returns: { month: string; return: number; value: number }[] = [];
  
  let prevValue = 0;
  
  for (const month of months) {
    const value = calculatePortfolioValue(
      transactions, valuations, month,
      cashBalances, baseCurrency, fxRates
    );
    
    // Calculate cash flows for the month IN BASE CURRENCY
    const monthTxs = transactions.filter(tx => tx.date.startsWith(month));
    const cashFlow = monthTxs.reduce((sum, tx) => {
      const localAmount = tx.quantity * tx.pricePerUnit + tx.fees;
      // Convert to base currency using entry FX rate or current rates
      let amountBase: number;
      if (tx.currency === (baseCurrency || 'USD')) {
        amountBase = localAmount;
      } else if (tx.fxRateAtEntry) {
        amountBase = localAmount * tx.fxRateAtEntry;
      } else if (fxRates && fxRates[tx.currency] && fxRates[tx.currency] > 0) {
        amountBase = (baseCurrency || 'USD') === 'USD'
          ? localAmount / fxRates[tx.currency]
          : localAmount * fxRates[tx.currency];
      } else {
        amountBase = localAmount;
      }
      return sum + (tx.transactionType === 'buy' ? amountBase : -amountBase);
    }, 0);
    
    let monthReturn = 0;
    if (prevValue > 0) {
      // Time-weighted return calculation
      monthReturn = ((value - prevValue - cashFlow) / prevValue) * 100;
      // Cap individual monthly returns to prevent extreme outliers
      monthReturn = Math.max(-50, Math.min(50, monthReturn));
    } else if (value > 0) {
      monthReturn = 0; // First month
    }
    
    returns.push({ month, return: monthReturn, value });
    prevValue = value;
  }
  
  return returns;
}

/**
 * Calculate Cumulative Returns (SUFOX Formula Spec)
 * Formula: Cumulative Return = (Current Value / Initial Value) - 1
 * Uses geometric linking (product of period returns)
 */
export function calculateCumulativeReturns(monthlyReturns: { month: string; return: number }[]) {
  let cumulativeProduct = 1;
  
  return monthlyReturns.map(({ month, return: ret }) => {
    // Geometric linking: (1 + r1) × (1 + r2) × ... - 1
    cumulativeProduct *= (1 + ret / 100);
    return { month, return: (cumulativeProduct - 1) * 100 };
  });
}

/**
 * Calculate annualized volatility (SUFOX Formula Spec)
 * Formula: Volatility = StdDev(Monthly Returns) × √12
 * Uses sample standard deviation (n-1 denominator)
 */
export function calculateVolatility(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 0;
  
  const n = monthlyReturns.length;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / n;
  
  // Sample variance (n-1 denominator per spec)
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const monthlyStdDev = Math.sqrt(variance);
  
  // Annualize: Monthly × √12 (SUFOX spec)
  return monthlyStdDev * Math.sqrt(12);
}

/**
 * Calculate Sharpe Ratio (SUFOX Formula Spec)
 * Formula: Sharpe = (Portfolio Return - Risk-Free Rate) / Standard Deviation
 * Returns annualized Sharpe ratio
 */
export function calculateSharpeRatio(
  monthlyReturns: number[],
  riskFreeRate: number
): number {
  if (monthlyReturns.length < 2) return 0;
  
  // Annualized return from monthly returns
  const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const annualReturn = avgMonthlyReturn * 12;
  
  // Annualized volatility
  const volatility = calculateVolatility(monthlyReturns);
  
  if (volatility === 0) return 0;
  
  // Sharpe = (Return - Rf) / Vol (SUFOX spec)
  return (annualReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Sortino Ratio (SUFOX Formula Spec)
 * Formula: Sortino = (Portfolio Return - Risk-Free Rate) / Downside Deviation
 * Only uses negative returns for downside deviation calculation
 */
export function calculateSortinoRatio(
  monthlyReturns: number[],
  riskFreeRate: number
): number {
  if (monthlyReturns.length < 2) return 0;
  
  // Monthly risk-free rate for threshold
  const monthlyRf = riskFreeRate / 12;
  
  // Calculate downside returns (below risk-free rate)
  const downsideReturns = monthlyReturns
    .map(r => Math.min(0, r - monthlyRf))
    .filter(r => r < 0);
  
  if (downsideReturns.length === 0) {
    // No downside - return high positive value
    const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
    const annualReturn = avgMonthlyReturn * 12;
    return annualReturn > riskFreeRate ? 10 : 0; // Cap at 10
  }
  
  // Downside deviation: sqrt of mean of squared negative deviations
  const downsideVariance = downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length;
  const monthlyDownsideDev = Math.sqrt(downsideVariance);
  
  // Annualize downside deviation: Monthly × √12
  const annualDownsideDev = monthlyDownsideDev * Math.sqrt(12);
  
  // Annualized return
  const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const annualReturn = avgMonthlyReturn * 12;
  
  if (annualDownsideDev === 0) return 0;
  
  // Sortino = (Return - Rf) / Downside Dev (SUFOX spec)
  return (annualReturn - riskFreeRate) / annualDownsideDev;
}

/**
 * Calculate Maximum Drawdown (SUFOX Formula Spec)
 * Formula: Max Drawdown = (Trough Value - Peak Value) / Peak Value
 * Measures the largest peak-to-trough decline
 */
export function calculateDrawdown(cumulativeReturns: { month: string; return: number }[]) {
  let peak = 0;
  let maxDrawdown = 0;
  const drawdownSeries: { month: string; drawdown: number }[] = [];
  
  for (const { month, return: cumRet } of cumulativeReturns) {
    const value = 100 * (1 + cumRet / 100);
    peak = Math.max(peak, value);
    
    // Drawdown = (Trough - Peak) / Peak (SUFOX spec)
    // Note: Result is negative (or zero), maxDrawdown stores positive magnitude
    const drawdown = peak > 0 ? ((value - peak) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, Math.abs(drawdown));
    drawdownSeries.push({ month, drawdown });
  }
  
  return { maxDrawdown, drawdownSeries };
}

// Calculate rolling metrics
export function calculateRollingMetrics(
  monthlyReturns: { month: string; return: number }[],
  riskFreeRate: number,
  window: number = 12
) {
  const rollingVolatility: { month: string; volatility: number }[] = [];
  const rollingSharpe: { month: string; sharpe: number }[] = [];
  
  for (let i = window - 1; i < monthlyReturns.length; i++) {
    const windowReturns = monthlyReturns.slice(i - window + 1, i + 1).map(r => r.return);
    const vol = calculateVolatility(windowReturns);
    const sharpe = calculateSharpeRatio(windowReturns, riskFreeRate);
    
    rollingVolatility.push({ month: monthlyReturns[i].month, volatility: vol });
    rollingSharpe.push({ month: monthlyReturns[i].month, sharpe });
  }
  
  return { rollingVolatility, rollingSharpe };
}

/**
 * Calculate Value at Risk (SUFOX Formula Spec)
 * Formula: VaR = z(confidence) × StdDev × Portfolio Value
 * Returns VaR as a percentage of portfolio value
 * z(95%) = 1.645, z(99%) = 2.326
 */
export function calculateVaR(monthlyReturns: number[], confidence: number = 0.95): number {
  if (monthlyReturns.length < 2) return 0;
  
  const n = monthlyReturns.length;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / n;
  
  // Sample variance (n-1 denominator)
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  // Z-score for confidence level (SUFOX spec)
  const zScore = confidence === 0.99 ? 2.326 : 1.645;
  
  // VaR = z × StdDev (as percentage, SUFOX spec)
  // Returns positive value representing potential loss
  return zScore * stdDev;
}

/**
 * Calculate Beta (SUFOX Formula Spec)
 * Formula: Beta = Covariance(Portfolio, Benchmark) / Variance(Benchmark)
 * Measures portfolio sensitivity to benchmark movements
 */
export function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) return 1;
  
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const portRets = portfolioReturns.slice(-n);
  const benchRets = benchmarkReturns.slice(-n);
  
  const portMean = portRets.reduce((a, b) => a + b, 0) / n;
  const benchMean = benchRets.reduce((a, b) => a + b, 0) / n;
  
  // Covariance(Portfolio, Benchmark) - sample covariance
  let covariance = 0;
  let benchVariance = 0;
  
  for (let i = 0; i < n; i++) {
    covariance += (portRets[i] - portMean) * (benchRets[i] - benchMean);
    benchVariance += Math.pow(benchRets[i] - benchMean, 2);
  }
  
  // Use sample covariance/variance (n-1 denominator)
  covariance /= (n - 1);
  benchVariance /= (n - 1);
  
  // Beta = Cov(P,B) / Var(B) (SUFOX spec)
  return benchVariance !== 0 ? covariance / benchVariance : 1;
}

/**
 * Calculate Win/Loss Ratio (SUFOX Formula Spec)
 * Formula: Win/Loss Ratio = Number of Winning Trades / Number of Losing Trades
 * Count-based ratio, not dollar-weighted
 * 
 * NOTE: Returns 0 if no sell transactions exist (N/A state)
 * Returns winning count if no losing trades exist
 */
export function calculateWinLossRatio(transactions: Transaction[]): number {
  const sells = transactions.filter(tx => tx.transactionType === 'sell');
  if (sells.length === 0) return 0; // N/A - no completed trades
  
  // Calculate realized P/L for each closed position
  const positions = calculatePositions(transactions);
  let winningTrades = 0;
  let losingTrades = 0;
  
  for (const pos of Object.values(positions)) {
    if (pos.realizedPL > 0) winningTrades++;
    else if (pos.realizedPL < 0) losingTrades++;
  }
  
  // Win/Loss = Winning / Losing (count-based, SUFOX spec)
  // If no losing trades, return winning count (theoretically infinite ratio)
  if (losingTrades === 0) return winningTrades > 0 ? winningTrades : 0;
  return winningTrades / losingTrades;
}

// Calculate allocations
export function calculateAllocations(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  groupBy: 'assetType' | 'geography' | 'currency'
): Allocation[] {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  const allocations: Record<string, number> = {};
  let total = 0;
  
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;
    
    const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    const key = tx[groupBy];
    
    allocations[key] = (allocations[key] || 0) + value;
    total += value;
  }
  
  return Object.entries(allocations).map(([name, value]) => ({
    name: formatAllocationName(name),
    value,
    percentage: total > 0 ? (value / total) * 100 : 0
  }));
}

function formatAllocationName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Calculate contribution to returns
export function calculateContributions(
  transactions: Transaction[],
  monthlyReturns: { month: string; return: number; value: number }[],
  valuations?: MonthlyValuation[]
): ContributionToReturn[] {
  if (monthlyReturns.length < 2) return [];
  
  const positions = calculatePositions(transactions);
  const contributions: ContributionToReturn[] = [];
  
  const totalValue = monthlyReturns[monthlyReturns.length - 1]?.value || 0;
  const latestVals = valuations ? getLatestValuations(valuations) : {};
  
  for (const [ticker, pos] of Object.entries(positions)) {
    const tx = transactions.find(t => t.ticker === ticker);
    if (!tx || pos.quantity <= 0) continue;
    
    // Calculate current value using latest valuation
    const val = latestVals[ticker];
    let currentValue = 0;
    let plPercent = 0;
    
    if (val) {
      const fxRate = val.fxRate || 1;
      currentValue = pos.quantity * val.pricePerUnit * fxRate;
      
      // Cost basis in base currency
      const entryFx = tx.fxRateAtEntry || 1;
      const costBasis = pos.totalCost * entryFx;
      
      if (costBasis > 0) {
        plPercent = ((currentValue - costBasis) / costBasis) * 100;
      }
    }
    
    const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    
    // Contribution = weight × asset P/L%
    const contribution = currentValue > 0 && val ? (currentValue - pos.totalCost * (tx.fxRateAtEntry || 1)) : 0;
    
    contributions.push({
      ticker,
      name: tx.assetName,
      contribution,
      weight,
      plPercent
    });
  }
  
  return contributions.sort((a, b) => b.contribution - a.contribution);
}

/**
 * Calculate IRR - Internal Rate of Return (SUFOX Formula Spec)
 * Formula: IRR solves 0 = Σ(Net Cash Flow_t / (1 + IRR)^t) for all periods t
 * Uses Newton-Raphson numerical method
 * 
 * IMPORTANT: IRR is capped at ±100% to avoid unrealistic values for short periods
 */
export function calculateIRR(cashFlows: { date: string; amount: number }[]): number {
  if (cashFlows.length < 2) return 0;
  
  const sortedFlows = [...cashFlows].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const baseDate = new Date(sortedFlows[0].date).getTime();
  const lastDate = new Date(sortedFlows[sortedFlows.length - 1].date).getTime();
  
  // Calculate time span in years
  const totalYears = (lastDate - baseDate) / (365.25 * 24 * 60 * 60 * 1000);
  
  // If time span is too short (less than 30 days), return 0 to avoid extreme annualization
  if (totalYears < 0.08) return 0;
  
  // Convert cash flows to time-adjusted format
  const flows = sortedFlows.map(cf => ({
    amount: cf.amount,
    years: (new Date(cf.date).getTime() - baseDate) / (365.25 * 24 * 60 * 60 * 1000)
  }));
  
  // NPV function: Σ(CF_t / (1 + r)^t)
  const npv = (rate: number): number => {
    return flows.reduce((sum, cf) => {
      return sum + cf.amount / Math.pow(1 + rate, cf.years);
    }, 0);
  };
  
  // NPV derivative for Newton-Raphson
  const npvDerivative = (rate: number): number => {
    return flows.reduce((sum, cf) => {
      if (cf.years === 0) return sum;
      return sum - cf.years * cf.amount / Math.pow(1 + rate, cf.years + 1);
    }, 0);
  };
  
  // Newton-Raphson iteration (SUFOX spec: numerical solve)
  let rate = 0.1; // Initial guess: 10%
  const maxIterations = 100;
  const tolerance = 1e-8;
  
  for (let i = 0; i < maxIterations; i++) {
    const currentNpv = npv(rate);
    const derivative = npvDerivative(rate);
    
    if (Math.abs(derivative) < 1e-12) break;
    
    const newRate = rate - currentNpv / derivative;
    
    // Bound the rate to reasonable annualized values (max ±100%)
    if (newRate < -0.99) {
      rate = -0.99;
    } else if (newRate > 1.0) {
      rate = 1.0;
    } else {
      rate = newRate;
    }
    
    if (Math.abs(currentNpv) < tolerance) break;
  }
  
  // Return as percentage, capped at ±100% for realistic display
  const resultPercent = rate * 100;
  return Math.max(-100, Math.min(100, resultPercent));
}

// Support interface for extended cash balances (all 6 currencies)
interface CashBalancesInput {
  USD: number;
  EUR: number;
  ILS: number;
  GBP?: number;
  CHF?: number;
  JPY?: number;
}

// FX rates type for dynamic rate support
// IMPORTANT: User-entered rates are stored as USD/{Currency} format
// e.g., ILS=3.6 means 1 USD = 3.6 ILS
// To convert FROM currency TO USD, we DIVIDE by the rate
export type FxRatesMap = Record<string, number>;

// Default FX rates in USD/{Currency} format (how many units of currency per 1 USD)
// e.g., ILS: 3.7 means 1 USD = 3.7 ILS
const DEFAULT_FX_RATES_USD_BASE: FxRatesMap = {
  USD: 1,
  EUR: 0.92,   // 1 USD = 0.92 EUR
  ILS: 3.7,    // 1 USD = 3.7 ILS
  GBP: 0.79,   // 1 USD = 0.79 GBP
  CHF: 0.88,   // 1 USD = 0.88 CHF
  JPY: 149.5   // 1 USD = 149.5 JPY
};

/**
 * Convert cash to base currency (USD by default)
 * FX rates are in USD/{Currency} format: rate = how many units of currency per 1 USD
 * To convert FROM currency TO USD: amount / rate
 */
export function calculateTotalCashInBaseCurrency(
  cashBalances: CashBalancesInput,
  baseCurrency: 'USD' | 'ILS' = 'USD',
  fxRates?: FxRatesMap
): number {
  // Use provided rates or defaults
  const rates = fxRates || DEFAULT_FX_RATES_USD_BASE;
  
  // Helper to convert to USD
  // Rate format: 1 USD = X {Currency}
  // So to get USD from currency: amount / rate
  const toUSD = (currency: string, amount: number): number => {
    if (currency === 'USD') return amount;
    const rate = rates[currency] ?? DEFAULT_FX_RATES_USD_BASE[currency] ?? 1;
    if (rate <= 0) return 0;
    return amount / rate;
  };
  
  // Convert all currencies to USD first
  const totalUSD = 
    toUSD('USD', cashBalances.USD) +
    toUSD('EUR', cashBalances.EUR) +
    toUSD('ILS', cashBalances.ILS) +
    toUSD('GBP', cashBalances.GBP ?? 0) +
    toUSD('CHF', cashBalances.CHF ?? 0) +
    toUSD('JPY', cashBalances.JPY ?? 0);
  
  if (baseCurrency === 'USD') {
    return totalUSD;
  } else {
    // Convert USD to ILS: totalUSD * ILS rate
    const ilsRate = rates['ILS'] ?? DEFAULT_FX_RATES_USD_BASE['ILS'] ?? 3.7;
    return totalUSD * ilsRate;
  }
}

// Full performance metrics calculation
// Now includes cash balance in totalValue (NAV = Holdings + Cash)
export function calculatePerformanceMetrics(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  riskFreeRate: number,
  cashBalances?: CashBalancesInput,
  baseCurrency: 'USD' | 'ILS' = 'USD',
  fxRates?: FxRatesMap
): PerformanceMetrics {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  let holdingsValue = 0;
  let totalCost = 0;
  let realizedPL = 0;
  let marketPL = 0;  // P/L from price changes only
  let fxPL = 0;      // P/L from FX rate changes only
  
  for (const [ticker, pos] of Object.entries(positions)) {
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    
    // Calculate entryFxRate for this ticker (needed for both active and closed positions)
    let entryFxRate = 1;
    if (tx && tx.currency !== baseCurrency) {
      // Weighted average from all buy transactions for this ticker
      const tickerBuys = transactions.filter(t => 
        t.ticker === ticker && 
        t.transactionType === 'buy' &&
        t.fxRateAtEntry !== undefined
      );
      if (tickerBuys.length > 0) {
        const totalCostLocal = tickerBuys.reduce((sum, t) => sum + (t.costLocal || t.quantity * t.pricePerUnit + t.fees), 0);
        const weightedFxSum = tickerBuys.reduce((sum, t) => {
          const costLocal = t.costLocal || (t.quantity * t.pricePerUnit + t.fees);
          return sum + (t.fxRateAtEntry! * costLocal);
        }, 0);
        entryFxRate = totalCostLocal > 0 ? weightedFxSum / totalCostLocal : (tx.fxRateAtEntry || 1);
      } else {
        entryFxRate = tx.fxRateAtEntry || 1;
      }
    }
    
    if (pos.quantity > 0 && tx) {
      const hasValuation = !!val;
      const currentPriceLocal = hasValuation ? val.pricePerUnit : pos.avgCost;
      
      // Derive FX rate: from valuation, or from fxRates context, or entry rate
      let currentFxRate: number;
      if (hasValuation && val.fxRate) {
        currentFxRate = val.fxRate;
      } else if (tx.currency === baseCurrency) {
        currentFxRate = 1;
      } else if (fxRates && fxRates[tx.currency] && fxRates[tx.currency] > 0) {
        currentFxRate = baseCurrency === 'USD' ? (1 / fxRates[tx.currency]) : fxRates[tx.currency];
      } else {
        currentFxRate = tx.fxRateAtEntry || 1;
      }
      
      // Current value in base currency
      const currentValue = pos.quantity * currentPriceLocal * currentFxRate;
      holdingsValue += currentValue;
      
      // Convert cost basis to base currency
      const totalCostBase = pos.totalCost * entryFxRate;
      
      if (hasValuation) {
        // Calculate separated P/L components with accurate entry FX
        const valueAtEntryFx = pos.quantity * currentPriceLocal * entryFxRate;
        const posMarketPL = valueAtEntryFx - totalCostBase;
        const posFxPL = pos.quantity * currentPriceLocal * (currentFxRate - entryFxRate);
        
        marketPL += posMarketPL;
        fxPL += posFxPL;
      }
    }
    // Convert cost and realized P/L to base currency using consistent weighted entryFxRate
    const costFxRate = tx ? (tx.currency === baseCurrency ? 1 : entryFxRate) : 1;
    totalCost += pos.totalCost * costFxRate;
    realizedPL += pos.realizedPL * costFxRate;
  }
  
  // Calculate cash in base currency using dynamic FX rates
  const cashValue = cashBalances 
    ? calculateTotalCashInBaseCurrency(cashBalances, baseCurrency, fxRates)
    : 0;
  
  // NAV = Holdings + Cash (unified Total Portfolio Value)
  const totalValue = holdingsValue + cashValue;
  
  const unrealizedPL = holdingsValue - totalCost;
  const totalPL = realizedPL + unrealizedPL;
  
  // Calculate total return with sanity bounds (cap at ±500% for display)
  // Extreme returns typically indicate data issues or very short holding periods
  const rawTotalReturn = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const totalReturn = Math.max(-500, Math.min(500, rawTotalReturn));
  
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations, cashBalances, baseCurrency, fxRates);
  const cumulativeReturns = calculateCumulativeReturns(monthlyReturns);
  const returns = monthlyReturns.map(r => r.return);
  
  // Apply sanity bounds to risk metrics
  // With very few data points or bad data, these can be extreme
  const rawVolatility = calculateVolatility(returns);
  const volatility = returns.length < 3 ? 0 : Math.min(rawVolatility, 200); // Cap at 200%
  
  const rawSharpe = calculateSharpeRatio(returns, riskFreeRate);
  const sharpeRatio = returns.length < 3 ? 0 : Math.max(-10, Math.min(10, rawSharpe));
  
  const { maxDrawdown: rawMaxDrawdown, drawdownSeries } = calculateDrawdown(cumulativeReturns);
  const maxDrawdown = Math.min(rawMaxDrawdown, 100); // Cap at 100% (can't lose more than everything)
  const winLossRatio = calculateWinLossRatio(transactions);
  
  // Cash flows for IRR — MUST be in base currency
  const cashFlows = transactions.map(tx => {
    const localAmount = tx.quantity * tx.pricePerUnit + tx.fees;
    let amountBase: number;
    if (tx.currency === baseCurrency) {
      amountBase = localAmount;
    } else if (tx.fxRateAtEntry) {
      amountBase = localAmount * tx.fxRateAtEntry;
    } else if (fxRates && fxRates[tx.currency] && fxRates[tx.currency] > 0) {
      amountBase = baseCurrency === 'USD' ? localAmount / fxRates[tx.currency] : localAmount * fxRates[tx.currency];
    } else {
      amountBase = localAmount;
    }
    return {
      date: tx.date,
      amount: tx.transactionType === 'buy' ? amountBase : -amountBase
    };
  });
  
  if (holdingsValue > 0) {
    cashFlows.push({ date: new Date().toISOString().slice(0, 10), amount: -holdingsValue });
  }
  
  const irr = calculateIRR(cashFlows);
  
  /**
   * Time-Weighted Return (SUFOX Formula Spec)
   * Formula: TWR = Π(1 + Period Return) - 1 for each sub-period
   * Product-based calculation, not average
   */
  const twr = calculateTWR(monthlyReturns);
  
  return {
    totalValue,       // NAV = Holdings + Cash
    holdingsValue,    // Market value of holdings only
    cashValue,        // Cash portion
    totalCost,
    realizedPL,
    unrealizedPL,
    marketPL,         // P/L from market price changes
    fxPL,             // P/L from FX rate changes
    totalPL,
    totalReturn,
    monthlyReturns,
    cumulativeReturns,
    volatility,
    sharpeRatio,
    maxDrawdown,
    drawdownSeries,
    irr,
    twr,
    winLossRatio
  };
}

/**
 * Calculate YTD (Year-to-Date) Return — Broker-Grade
 * 
 * Uses cashflow-adjusted NAV return:
 * YTD% = (NAV_today - NAV_jan1 - netExternalFlows) / NAV_jan1
 * 
 * External flows = DEPOSIT − WITHDRAWAL (from capital ledger).
 * Trades (BUY/SELL) are internal and do NOT count as flows.
 * 
 * If NAV_jan1 is 0 or unavailable (new account started this year),
 * falls back to cost-basis return for the period.
 */

export interface LedgerEntryForYTD {
  entry_type: string;
  currency: string;
  amount: number;
  amount_base: number | null;
  fx_rate_used: number | null;
  created_at: string;
}

export function calculateYTDReturn(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  cashBalances?: CashBalancesInput,
  baseCurrency: 'USD' | 'ILS' = 'USD',
  fxRates?: FxRatesMap,
  previousMonthFxRates?: FxRatesMap,
  ledgerEntries?: LedgerEntryForYTD[]
): { ytdReturn: number; ytdPL: number; ytdFxPL: number; janValue: number; cashFxPL: number; navToday: number; netExternalFlows: number } {
  const currentYear = new Date().getFullYear();
  const decPrevYear = `${currentYear - 1}-12`;
  
  // ──────────────────────────────────────────────
  // 1. NAV at Jan 1 (= Dec 31 previous year snapshot)
  // ──────────────────────────────────────────────
  const txBeforeYear = transactions.filter(tx => tx.date < `${currentYear}-01-01`);
  const decValuations = valuations.filter(v => v.month === decPrevYear);
  const janValue = calculatePortfolioValueAtMonth(txBeforeYear, decValuations, decPrevYear, cashBalances, baseCurrency, fxRates);
  
  // ──────────────────────────────────────────────
  // 2. NAV today (recomputed from raw data for auditability)
  // ──────────────────────────────────────────────
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  let holdingsMV = 0;
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    const val = latestVals[ticker];
    if (val) {
      holdingsMV += pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    } else {
      // Fallback to cost for assets without valuation
      const tx = transactions.find(t => t.ticker === ticker);
      if (tx) {
        let fallbackFx = 1;
        if (tx.currency !== baseCurrency && fxRates) {
          const rate = fxRates[tx.currency];
          if (rate && rate > 0) {
            fallbackFx = baseCurrency === 'USD' ? (1 / rate) : rate;
          }
        }
        holdingsMV += pos.quantity * pos.avgCost * fallbackFx;
      }
    }
  }
  
  const cashBase = cashBalances
    ? calculateTotalCashInBaseCurrency(cashBalances, baseCurrency, fxRates)
    : 0;
  const navToday = holdingsMV + cashBase;
  
  // ──────────────────────────────────────────────
  // 3. Net external flows since Jan 1 (DEPOSIT + WITHDRAWAL, converted to base)
  //    BUY/SELL/FX_CONVERSION are internal — excluded.
  // ──────────────────────────────────────────────
  let netExternalFlows = 0;
  if (ledgerEntries) {
    const externalTypes = ['DEPOSIT', 'WITHDRAWAL'];
    const ytdEntries = ledgerEntries.filter(e => 
      externalTypes.includes(e.entry_type) &&
      e.created_at >= `${currentYear}-01-01`
    );
    
    for (const entry of ytdEntries) {
      let amountBase: number;
      if (entry.amount_base != null) {
        amountBase = entry.amount_base;
      } else if (entry.currency.toUpperCase() === baseCurrency) {
        amountBase = entry.amount;
      } else {
        // Convert using FX rate at entry time or current rates
        const rate = entry.fx_rate_used || (fxRates ? fxRates[entry.currency.toUpperCase()] : null) || 1;
        amountBase = baseCurrency === 'USD' ? entry.amount / rate : entry.amount * rate;
      }
      // DEPOSIT amount > 0 (inflow), WITHDRAWAL amount < 0 (outflow)
      netExternalFlows += amountBase;
    }
  }
  
  // ──────────────────────────────────────────────
  // 4. YTD Return = (NAV_today - NAV_jan1 - netExternalFlows) / NAV_jan1
  // ──────────────────────────────────────────────
  let ytdReturn: number;
  let ytdPL: number;
  
  if (janValue > 0) {
    ytdPL = navToday - janValue - netExternalFlows;
    ytdReturn = (ytdPL / janValue) * 100;
  } else {
    // New account started this year — no Jan 1 NAV.
    // Since all positions were opened this year and there are no sells,
    // YTD = Unrealized % = (MV - CostBasis) / CostBasis.
    // CostBasis here must match the portfolioEngine exactly:
    //   - USD assets: totalCost is already in USD (pricePerUnit is USD)
    //   - Foreign assets: totalCost is in local currency, convert with entryFx
    // calculatePositions stores totalCost in LOCAL currency (qty * localPrice + fees).
    // For USD assets entryFx=1 so totalCost is already USD.
    // For ILS assets entryFx=ILS/USD (e.g. 0.3225), so totalCost(ILS) * entryFx = USD.
    let totalCostBase = 0;
    for (const [ticker, pos] of Object.entries(positions)) {
      if (pos.quantity <= 0) continue;
      // Find the FIRST buy transaction to get the currency
      const buyTxs = transactions.filter(t => t.ticker === ticker && t.transactionType === 'buy');
      if (buyTxs.length === 0) continue;
      const currency = buyTxs[0].currency;
      if (currency === baseCurrency || currency === 'USD') {
        // totalCost is already in base currency
        totalCostBase += pos.totalCost;
      } else {
        // totalCost is in local currency — convert using weighted avg entry FX
        // Calculate weighted average entry FX for this ticker
        let totalQty = 0;
        let weightedFxSum = 0;
        for (const tx of buyTxs) {
          const fx = tx.fxRateAtEntry || 1;
          weightedFxSum += tx.quantity * fx;
          totalQty += tx.quantity;
        }
        const avgEntryFx = totalQty > 0 ? weightedFxSum / totalQty : 1;
        totalCostBase += pos.totalCost * avgEntryFx;
      }
    }
    const unrealizedPL = holdingsMV - totalCostBase;
    ytdPL = unrealizedPL;
    ytdReturn = totalCostBase > 0 ? (unrealizedPL / totalCostBase) * 100 : 0;
    
    console.log("[YTD Fallback] No Jan1 NAV — using Unrealized %", {
      holdingsMV: holdingsMV.toFixed(2),
      totalCostBase: totalCostBase.toFixed(2),
      unrealizedPL: unrealizedPL.toFixed(2),
      ytdReturn: ytdReturn.toFixed(2) + '%',
    });
  }
  
  // ──────────────────────────────────────────────
  // 5. Cash FX P/L (unchanged logic)
  // ──────────────────────────────────────────────
  let cashFxPL = 0;
  if (cashBalances && fxRates && previousMonthFxRates) {
    const foreignCurrencies = ['EUR', 'ILS', 'GBP', 'CHF', 'JPY'] as const;
    for (const currency of foreignCurrencies) {
      const balance = cashBalances[currency.toLowerCase() as keyof CashBalancesInput] || 0;
      if (balance > 0) {
        const currentRate = fxRates[currency] || 1;
        const previousRate = previousMonthFxRates[currency] || currentRate;
        cashFxPL += (balance / currentRate) - (balance / previousRate);
      }
    }
  }
  
  const ytdFxPL = cashFxPL;
  
  return { ytdReturn, ytdPL, ytdFxPL, janValue, cashFxPL, navToday, netExternalFlows };
}

/**
 * Helper: Calculate weighted average entry FX rate per ticker
 */
function calculateEntryFxRates(transactions: Transaction[]): Record<string, number> {
  const entryRates: Record<string, { totalCost: number; weightedFx: number }> = {};
  
  for (const tx of transactions) {
    if (tx.transactionType === 'buy') {
      const cost = tx.quantity * tx.pricePerUnit;
      const fxRate = tx.fxRateAtEntry || 1;
      
      if (!entryRates[tx.ticker]) {
        entryRates[tx.ticker] = { totalCost: 0, weightedFx: 0 };
      }
      entryRates[tx.ticker].totalCost += cost;
      entryRates[tx.ticker].weightedFx += cost * fxRate;
    }
  }
  
  const result: Record<string, number> = {};
  for (const [ticker, data] of Object.entries(entryRates)) {
    result[ticker] = data.totalCost > 0 ? data.weightedFx / data.totalCost : 1;
  }
  
  return result;
}

/**
 * Helper: Calculate portfolio value at a specific month including cash
 */
function calculatePortfolioValueAtMonth(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  month: string,
  _cashBalances?: CashBalancesInput,
  _baseCurrency: 'USD' | 'ILS' = 'USD',
  _fxRates?: FxRatesMap
): number {
  // IMPORTANT: Only use holdings valued at the target month.
  // We do NOT add current cash balances here — that would incorrectly
  // attribute today's cash (post-deposits) to a historical date.
  // Historical cash snapshots are not available, so Jan 1 NAV = holdings only.
  const positions = calculatePositions(transactions);
  const valMap = new Map(valuations.map(v => [v.ticker, v]));
  
  let holdingsValue = 0;
  for (const [ticker, pos] of Object.entries(positions)) {
    const val = valMap.get(ticker);
    if (val && pos.quantity > 0) {
      const fxRate = val.fxRate || 1;
      holdingsValue += pos.quantity * val.pricePerUnit * fxRate;
    }
  }
  
  return holdingsValue;
}

// Calculate asset-level monthly returns for correlation
export function calculateAssetMonthlyReturns(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): Record<string, { month: string; return: number }[]> {
  const tickers = [...new Set(transactions.map(t => t.ticker))];
  const assetReturns: Record<string, { month: string; return: number }[]> = {};
  
  for (const ticker of tickers) {
    const tickerValuations = valuations.filter(v => v.ticker === ticker).sort((a, b) => a.month.localeCompare(b.month));
    const returns: { month: string; return: number }[] = [];
    
    for (let i = 1; i < tickerValuations.length; i++) {
      const prevPrice = tickerValuations[i - 1].pricePerUnit;
      const currPrice = tickerValuations[i].pricePerUnit;
      if (prevPrice > 0) {
        returns.push({
          month: tickerValuations[i].month,
          return: ((currPrice - prevPrice) / prevPrice) * 100
        });
      }
    }
    
    if (returns.length > 0) {
      assetReturns[ticker] = returns;
    }
  }
  
  return assetReturns;
}

// Calculate correlation matrix between assets
export function calculateCorrelationMatrix(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): { tickers: string[]; matrix: number[][] } {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const tickers = Object.keys(assetReturns).filter(t => assetReturns[t].length >= 3);
  
  if (tickers.length < 2) return { tickers: [], matrix: [] };
  
  // Align returns to common months
  const allMonths = new Set<string>();
  tickers.forEach(t => assetReturns[t].forEach(r => allMonths.add(r.month)));
  const commonMonths = [...allMonths].filter(month => 
    tickers.every(t => assetReturns[t].some(r => r.month === month))
  ).sort();
  
  if (commonMonths.length < 3) return { tickers: [], matrix: [] };
  
  const alignedReturns: Record<string, number[]> = {};
  tickers.forEach(t => {
    alignedReturns[t] = commonMonths.map(month => {
      const ret = assetReturns[t].find(r => r.month === month);
      return ret ? ret.return : 0;
    });
  });
  
  // Calculate correlation matrix
  const matrix: number[][] = [];
  
  for (let i = 0; i < tickers.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < tickers.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = calculateCorrelation(alignedReturns[tickers[i]], alignedReturns[tickers[j]]);
      }
    }
  }
  
  return { tickers, matrix };
}

function calculateCorrelation(x: number[], y: number[]): number {
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

// Calculate risk contribution per asset
export function calculateRiskContribution(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  baseCurrency?: 'USD' | 'ILS',
  fxRates?: FxRatesMap
): { ticker: string; name: string; weight: number; marginalRisk: number; riskContribution: number; riskPct: number }[] {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  
  // Calculate weights with proper FX conversion
  let totalValue = 0;
  const holdings: { ticker: string; name: string; value: number; weight: number }[] = [];
  
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;
    
    // FX rate: from valuation, or from fxRates map, or 1
    let fxRate = val.fxRate || 1;
    if (!val.fxRate && tx.currency !== (baseCurrency || 'USD') && fxRates && fxRates[tx.currency] > 0) {
      fxRate = (baseCurrency || 'USD') === 'USD' ? (1 / fxRates[tx.currency]) : fxRates[tx.currency];
    }
    
    const value = pos.quantity * val.pricePerUnit * fxRate;
    totalValue += value;
    holdings.push({ ticker, name: tx.assetName, value, weight: 0 });
  }
  
  holdings.forEach(h => h.weight = totalValue > 0 ? h.value / totalValue : 0);
  
  // Calculate asset volatilities
  const assetVols: Record<string, number> = {};
  for (const ticker of holdings.map(h => h.ticker)) {
    const returns = assetReturns[ticker]?.map(r => r.return) || [];
    assetVols[ticker] = calculateVolatility(returns);
  }
  
  // Calculate portfolio volatility
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations, undefined, baseCurrency, fxRates);
  const portfolioVol = calculateVolatility(monthlyReturns.map(r => r.return));
  
  // Risk contribution = weight * asset_vol * correlation_with_portfolio
  // Simplified: marginal contribution to volatility
  const results: { ticker: string; name: string; weight: number; marginalRisk: number; riskContribution: number; riskPct: number }[] = [];
  let totalRisk = 0;
  
  for (const h of holdings) {
    const assetVol = assetVols[h.ticker] || 0;
    const marginalRisk = assetVol * h.weight;
    totalRisk += marginalRisk;
    
    results.push({
      ticker: h.ticker,
      name: h.name,
      weight: h.weight * 100,
      marginalRisk: assetVol,
      riskContribution: marginalRisk,
      riskPct: 0
    });
  }
  
  // Calculate percentage contribution
  results.forEach(r => r.riskPct = totalRisk > 0 ? (r.riskContribution / totalRisk) * 100 : 0);
  
  return results.sort((a, b) => b.riskPct - a.riskPct);
}

/**
 * Calculate Tracking Error (SUFOX Formula Spec)
 * Formula: Tracking Error = StdDev(Portfolio Return - Benchmark Return)
 * Annualized using √12
 */
export function calculateTrackingError(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) return 0;
  
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const portRets = portfolioReturns.slice(-n);
  const benchRets = benchmarkReturns.slice(-n);
  
  // Active returns (Portfolio - Benchmark)
  const activeReturns = portRets.map((r, i) => r - benchRets[i]);
  
  // Tracking Error = StdDev of active returns (SUFOX spec)
  const mean = activeReturns.reduce((a, b) => a + b, 0) / n;
  const variance = activeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  
  // Annualize: Monthly × √12
  return Math.sqrt(variance) * Math.sqrt(12);
}

/**
 * Calculate Time-Weighted Return (SUFOX Formula Spec)
 * Formula: TWR = Π(1 + Period Return) - 1 for each sub-period
 * Uses geometric linking (product), not average
 * 
 * Result is capped at ±500% for sanity (extreme values indicate data issues)
 */
export function calculateTWR(monthlyReturns: { month: string; return: number }[]): number {
  if (monthlyReturns.length === 0) return 0;
  
  // TWR = Product of (1 + each period return) - 1 (SUFOX spec)
  let cumulativeProduct = 1;
  
  for (const { return: periodReturn } of monthlyReturns) {
    // Cap individual monthly returns at ±50% to prevent extreme compounding
    const cappedReturn = Math.max(-50, Math.min(50, periodReturn));
    cumulativeProduct *= (1 + cappedReturn / 100);
  }
  
  const rawTWR = (cumulativeProduct - 1) * 100;
  
  // Cap final result at ±500% for display sanity
  return Math.max(-500, Math.min(500, rawTWR));
}

// Full risk metrics calculation
// Now accepts cash/FX for NAV-inclusive risk calculations
export function calculateRiskMetrics(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  riskFreeRate: number,
  benchmarkReturns: number[],
  cashBalances?: CashBalancesInput,
  baseCurrency?: 'USD' | 'ILS',
  fxRates?: FxRatesMap
): RiskMetrics {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations, cashBalances, baseCurrency, fxRates);
  const returns = monthlyReturns.map(r => r.return);
  
  // Apply sanity bounds
  const rawVol = calculateVolatility(returns);
  const volatility = returns.length < 3 ? 0 : Math.min(rawVol, 200);
  
  const rawSharpe = calculateSharpeRatio(returns, riskFreeRate);
  const sharpeRatio = returns.length < 3 ? 0 : Math.max(-10, Math.min(10, rawSharpe));
  
  const sortinoRatio = returns.length < 3 ? 0 : Math.max(-10, Math.min(10, calculateSortinoRatio(returns, riskFreeRate)));
  const var95 = calculateVaR(returns, 0.95);
  const var99 = calculateVaR(returns, 0.99);
  
  const cumulativeReturns = calculateCumulativeReturns(monthlyReturns);
  const { maxDrawdown: rawMaxDD } = calculateDrawdown(cumulativeReturns);
  const maxDrawdown = Math.min(rawMaxDD, 100);
  
  const beta = calculateBeta(returns, benchmarkReturns);
  const trackingError = calculateTrackingError(returns, benchmarkReturns);
  const { rollingVolatility, rollingSharpe } = calculateRollingMetrics(monthlyReturns, riskFreeRate);
  
  return {
    volatility,
    sharpeRatio,
    sortinoRatio,
    var95,
    var99,
    maxDrawdown,
    beta,
    trackingError,
    rollingVolatility,
    rollingSharpe
  };
}
