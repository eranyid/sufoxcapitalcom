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
export function calculatePortfolioValue(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  month: string
) {
  const positions = calculatePositions(
    transactions.filter(tx => tx.date <= `${month}-31`)
  );
  
  const monthValuations = valuations.filter(v => v.month === month);
  const valMap = new Map(monthValuations.map(v => [v.ticker, v]));
  
  let totalValue = 0;
  
  for (const [ticker, pos] of Object.entries(positions)) {
    const valuation = valMap.get(ticker);
    if (valuation && pos.quantity > 0) {
      const fxRate = valuation.fxRate || 1;
      totalValue += pos.quantity * valuation.pricePerUnit * fxRate;
    }
  }
  
  return totalValue;
}

// Calculate monthly returns
export function calculateMonthlyReturns(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): { month: string; return: number; value: number }[] {
  const months = [...new Set(valuations.map(v => v.month))].sort();
  const returns: { month: string; return: number; value: number }[] = [];
  
  let prevValue = 0;
  
  for (const month of months) {
    const value = calculatePortfolioValue(transactions, valuations, month);
    
    // Calculate cash flows for the month
    const monthTxs = transactions.filter(tx => tx.date.startsWith(month));
    const cashFlow = monthTxs.reduce((sum, tx) => {
      const amount = tx.quantity * tx.pricePerUnit + tx.fees;
      return sum + (tx.transactionType === 'buy' ? amount : -amount);
    }, 0);
    
    let monthReturn = 0;
    if (prevValue > 0) {
      // Time-weighted return calculation
      monthReturn = ((value - prevValue - cashFlow) / prevValue) * 100;
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
 */
export function calculateWinLossRatio(transactions: Transaction[]): number {
  const sells = transactions.filter(tx => tx.transactionType === 'sell');
  if (sells.length === 0) return 0;
  
  // Calculate realized P/L for each closed position
  const positions = calculatePositions(transactions);
  let winningTrades = 0;
  let losingTrades = 0;
  
  for (const pos of Object.values(positions)) {
    if (pos.realizedPL > 0) winningTrades++;
    else if (pos.realizedPL < 0) losingTrades++;
  }
  
  // Win/Loss = Winning / Losing (count-based, SUFOX spec)
  return losingTrades > 0 ? winningTrades / losingTrades : winningTrades;
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
    
    const weight = totalValue > 0 ? (pos.totalCost / totalValue) : 0;
    
    // Simplified contribution calculation
    const contribution = pos.realizedPL + (pos.quantity > 0 ? pos.quantity * pos.avgCost * 0.1 : 0);
    
    // Calculate P/L% from cost basis
    const val = latestVals[ticker];
    let plPercent = 0;
    if (val && pos.avgCost > 0) {
      const currentPrice = val.pricePerUnit * (val.fxRate || 1);
      plPercent = ((currentPrice - pos.avgCost) / pos.avgCost) * 100;
    }
    
    contributions.push({
      ticker,
      name: tx.assetName,
      contribution,
      weight: weight * 100,
      plPercent
    });
  }
  
  return contributions.sort((a, b) => b.contribution - a.contribution);
}

/**
 * Calculate IRR - Internal Rate of Return (SUFOX Formula Spec)
 * Formula: IRR solves 0 = Σ(Net Cash Flow_t / (1 + IRR)^t) for all periods t
 * Uses Newton-Raphson numerical method
 */
export function calculateIRR(cashFlows: { date: string; amount: number }[]): number {
  if (cashFlows.length < 2) return 0;
  
  const sortedFlows = [...cashFlows].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const baseDate = new Date(sortedFlows[0].date).getTime();
  
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
    
    // Bound the rate to reasonable values
    if (newRate < -0.99) {
      rate = -0.99;
    } else if (newRate > 10) {
      rate = 10;
    } else {
      rate = newRate;
    }
    
    if (Math.abs(currentNpv) < tolerance) break;
  }
  
  // Return as percentage
  return rate * 100;
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
    
    if (val && pos.quantity > 0 && tx) {
      const currentFxRate = val.fxRate || 1;
      
      // Use stored entry FX rate if available
      let entryFxRate: number;
      if (tx.currency === baseCurrency) {
        entryFxRate = 1;
      } else if (tx.fxRateAtEntry !== undefined) {
        entryFxRate = tx.fxRateAtEntry;
      } else {
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
          entryFxRate = totalCostLocal > 0 ? weightedFxSum / totalCostLocal : currentFxRate;
        } else {
          entryFxRate = currentFxRate; // Fallback approximation
        }
      }
      
      const currentPriceLocal = val.pricePerUnit;
      
      // Current value in base currency
      const currentValue = pos.quantity * currentPriceLocal * currentFxRate;
      holdingsValue += currentValue;
      
      // Calculate separated P/L components with accurate entry FX
      // Market P/L: what would be the P/L if FX stayed the same (use entry FX)
      const valueAtEntryFx = pos.quantity * currentPriceLocal * entryFxRate;
      const posMarketPL = valueAtEntryFx - pos.totalCost;
      
      // FX P/L: difference from FX rate change
      const posFxPL = pos.quantity * currentPriceLocal * (currentFxRate - entryFxRate);
      
      marketPL += posMarketPL;
      fxPL += posFxPL;
    }
    totalCost += pos.totalCost;
    realizedPL += pos.realizedPL;
  }
  
  // Calculate cash in base currency using dynamic FX rates
  const cashValue = cashBalances 
    ? calculateTotalCashInBaseCurrency(cashBalances, baseCurrency, fxRates)
    : 0;
  
  // NAV = Holdings + Cash (unified Total Portfolio Value)
  const totalValue = holdingsValue + cashValue;
  
  const unrealizedPL = holdingsValue - totalCost;
  const totalPL = realizedPL + unrealizedPL;
  const totalReturn = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const cumulativeReturns = calculateCumulativeReturns(monthlyReturns);
  const returns = monthlyReturns.map(r => r.return);
  
  const volatility = calculateVolatility(returns);
  const sharpeRatio = calculateSharpeRatio(returns, riskFreeRate);
  const { maxDrawdown, drawdownSeries } = calculateDrawdown(cumulativeReturns);
  const winLossRatio = calculateWinLossRatio(transactions);
  
  // Cash flows for IRR (based on holdings only)
  const cashFlows = transactions.map(tx => ({
    date: tx.date,
    amount: tx.transactionType === 'buy' 
      ? tx.quantity * tx.pricePerUnit + tx.fees 
      : -(tx.quantity * tx.pricePerUnit - tx.fees)
  }));
  
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
 * Calculate YTD Return (SUFOX Formula Spec)
 * Formula: YTD Return = (Current P/L - Jan 1st P/L) / Jan 1st Portfolio Value
 * Where P/L = Realized P/L + Unrealized P/L
 * 
 * This measures the actual gain/loss performance since the start of the year
 * as a percentage of the portfolio value at year start.
 */
export function calculateYTDReturn(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  cashBalances?: CashBalancesInput,
  baseCurrency: 'USD' | 'ILS' = 'USD',
  fxRates?: FxRatesMap
): { ytdReturn: number; ytdPL: number; janValue: number } {
  const currentYear = new Date().getFullYear();
  const janMonth = `${currentYear}-01`;
  const decPrevYear = `${currentYear - 1}-12`;
  
  // Get transactions up to end of previous year (for Jan 1st snapshot)
  const txBeforeYear = transactions.filter(tx => tx.date < `${currentYear}-01-01`);
  
  // Calculate Jan 1st portfolio value (using Dec previous year valuations)
  const decValuations = valuations.filter(v => v.month === decPrevYear);
  const janValue = calculatePortfolioValueAtMonth(txBeforeYear, decValuations, decPrevYear, cashBalances, baseCurrency, fxRates);
  
  // Get current total P/L
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  let currentUnrealizedPL = 0;
  let currentRealizedPL = 0;
  
  for (const [ticker, pos] of Object.entries(positions)) {
    const val = latestVals[ticker];
    if (val && pos.quantity > 0) {
      const fxRate = val.fxRate || 1;
      const currentValue = pos.quantity * val.pricePerUnit * fxRate;
      currentUnrealizedPL += currentValue - pos.totalCost;
    }
    currentRealizedPL += pos.realizedPL;
  }
  
  // Get Jan 1st P/L state (realized + unrealized at Dec 31 previous year)
  const positionsAtJan = calculatePositions(txBeforeYear);
  let janUnrealizedPL = 0;
  let janRealizedPL = 0;
  
  for (const [ticker, pos] of Object.entries(positionsAtJan)) {
    const val = decValuations.find(v => v.ticker === ticker);
    if (val && pos.quantity > 0) {
      const fxRate = val.fxRate || 1;
      const janValue = pos.quantity * val.pricePerUnit * fxRate;
      janUnrealizedPL += janValue - pos.totalCost;
    }
    janRealizedPL += pos.realizedPL;
  }
  
  // YTD P/L = Current Total P/L - Jan 1st Total P/L
  const currentTotalPL = currentRealizedPL + currentUnrealizedPL;
  const janTotalPL = janRealizedPL + janUnrealizedPL;
  const ytdPL = currentTotalPL - janTotalPL;
  
  // YTD Return % = YTD P/L / Jan 1st Portfolio Value
  const ytdReturn = janValue > 0 ? (ytdPL / janValue) * 100 : 0;
  
  return { ytdReturn, ytdPL, janValue };
}

/**
 * Helper: Calculate portfolio value at a specific month including cash
 */
function calculatePortfolioValueAtMonth(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  month: string,
  cashBalances?: CashBalancesInput,
  baseCurrency: 'USD' | 'ILS' = 'USD',
  fxRates?: FxRatesMap
): number {
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
  
  // Add cash (assuming constant cash for simplicity, or use historical if available)
  const cashValue = cashBalances 
    ? calculateTotalCashInBaseCurrency(cashBalances, baseCurrency, fxRates)
    : 0;
  
  return holdingsValue + cashValue;
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
  valuations: MonthlyValuation[]
): { ticker: string; name: string; weight: number; marginalRisk: number; riskContribution: number; riskPct: number }[] {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  
  // Calculate weights
  let totalValue = 0;
  const holdings: { ticker: string; name: string; value: number; weight: number }[] = [];
  
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;
    
    const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    totalValue += value;
    holdings.push({ ticker, name: tx.assetName, value, weight: 0 });
  }
  
  holdings.forEach(h => h.weight = h.value / totalValue);
  
  // Calculate asset volatilities
  const assetVols: Record<string, number> = {};
  for (const ticker of holdings.map(h => h.ticker)) {
    const returns = assetReturns[ticker]?.map(r => r.return) || [];
    assetVols[ticker] = calculateVolatility(returns);
  }
  
  // Calculate portfolio volatility
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
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
 */
export function calculateTWR(monthlyReturns: { month: string; return: number }[]): number {
  if (monthlyReturns.length === 0) return 0;
  
  // TWR = Product of (1 + each period return) - 1 (SUFOX spec)
  let cumulativeProduct = 1;
  
  for (const { return: periodReturn } of monthlyReturns) {
    cumulativeProduct *= (1 + periodReturn / 100);
  }
  
  return (cumulativeProduct - 1) * 100;
}

// Full risk metrics calculation
export function calculateRiskMetrics(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  riskFreeRate: number,
  benchmarkReturns: number[]
): RiskMetrics {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const returns = monthlyReturns.map(r => r.return);
  
  const volatility = calculateVolatility(returns);
  const sharpeRatio = calculateSharpeRatio(returns, riskFreeRate);
  const sortinoRatio = calculateSortinoRatio(returns, riskFreeRate);
  const var95 = calculateVaR(returns, 0.95);
  const var99 = calculateVaR(returns, 0.99);
  
  const cumulativeReturns = calculateCumulativeReturns(monthlyReturns);
  const { maxDrawdown } = calculateDrawdown(cumulativeReturns);
  
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
