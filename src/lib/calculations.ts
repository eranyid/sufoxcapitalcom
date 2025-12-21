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

// Calculate cumulative returns
export function calculateCumulativeReturns(monthlyReturns: { month: string; return: number }[]) {
  let cumulative = 0;
  return monthlyReturns.map(({ month, return: ret }) => {
    cumulative = (1 + cumulative / 100) * (1 + ret / 100) - 1;
    return { month, return: cumulative * 100 };
  });
}

// Calculate volatility (annualized)
export function calculateVolatility(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 0;
  
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (monthlyReturns.length - 1);
  const monthlyVol = Math.sqrt(variance);
  
  return monthlyVol * Math.sqrt(12); // Annualize
}

// Calculate Sharpe ratio
export function calculateSharpeRatio(
  monthlyReturns: number[],
  riskFreeRate: number
): number {
  if (monthlyReturns.length < 2) return 0;
  
  const annualReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length * 12;
  const volatility = calculateVolatility(monthlyReturns);
  
  if (volatility === 0) return 0;
  return (annualReturn - riskFreeRate) / volatility;
}

// Calculate Sortino ratio (uses downside deviation instead of total volatility)
export function calculateSortinoRatio(
  monthlyReturns: number[],
  riskFreeRate: number
): number {
  if (monthlyReturns.length < 2) return 0;
  
  const monthlyRf = riskFreeRate / 12;
  const excessReturns = monthlyReturns.map(r => r - monthlyRf);
  const negativeReturns = excessReturns.filter(r => r < 0);
  
  if (negativeReturns.length === 0) return 0;
  
  // Downside deviation
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(12); // Annualize
  
  const annualReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length * 12;
  
  if (downsideDeviation === 0) return 0;
  return (annualReturn - riskFreeRate) / downsideDeviation;
}

// Calculate maximum drawdown
export function calculateDrawdown(cumulativeReturns: { month: string; return: number }[]) {
  let peak = 0;
  let maxDrawdown = 0;
  const drawdownSeries: { month: string; drawdown: number }[] = [];
  
  for (const { month, return: cumRet } of cumulativeReturns) {
    const value = 100 * (1 + cumRet / 100);
    peak = Math.max(peak, value);
    const drawdown = peak > 0 ? ((peak - value) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    drawdownSeries.push({ month, drawdown: -drawdown });
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

// Calculate VaR (Variance-Covariance method)
export function calculateVaR(monthlyReturns: number[], confidence: number = 0.95): number {
  if (monthlyReturns.length < 2) return 0;
  
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (monthlyReturns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Z-score for confidence level
  const zScore = confidence === 0.99 ? 2.326 : 1.645;
  
  return -(mean - zScore * stdDev);
}

// Calculate Beta
export function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) return 1;
  
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const portRets = portfolioReturns.slice(-n);
  const benchRets = benchmarkReturns.slice(-n);
  
  const portMean = portRets.reduce((a, b) => a + b, 0) / n;
  const benchMean = benchRets.reduce((a, b) => a + b, 0) / n;
  
  let covariance = 0;
  let benchVariance = 0;
  
  for (let i = 0; i < n; i++) {
    covariance += (portRets[i] - portMean) * (benchRets[i] - benchMean);
    benchVariance += Math.pow(benchRets[i] - benchMean, 2);
  }
  
  covariance /= (n - 1);
  benchVariance /= (n - 1);
  
  return benchVariance !== 0 ? covariance / benchVariance : 1;
}

// Calculate win/loss ratio
export function calculateWinLossRatio(transactions: Transaction[]): number {
  const sells = transactions.filter(tx => tx.transactionType === 'sell');
  if (sells.length === 0) return 0;
  
  // Simplified: count profitable sells vs losing sells
  const positions = calculatePositions(transactions);
  let wins = 0;
  let losses = 0;
  
  for (const pos of Object.values(positions)) {
    if (pos.realizedPL > 0) wins++;
    else if (pos.realizedPL < 0) losses++;
  }
  
  return losses > 0 ? wins / losses : wins;
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

// Calculate IRR (simplified Newton-Raphson)
export function calculateIRR(cashFlows: { date: string; amount: number }[]): number {
  if (cashFlows.length < 2) return 0;
  
  const sortedFlows = [...cashFlows].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Simple approximation
  const totalInvested = sortedFlows
    .filter(cf => cf.amount > 0)
    .reduce((sum, cf) => sum + cf.amount, 0);
  
  const totalReturned = sortedFlows
    .filter(cf => cf.amount < 0)
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);
  
  const years = (new Date(sortedFlows[sortedFlows.length - 1].date).getTime() - 
                 new Date(sortedFlows[0].date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (years <= 0 || totalInvested <= 0) return 0;
  
  return (Math.pow(totalReturned / totalInvested, 1 / years) - 1) * 100;
}

// Cash balance type for calculations
interface CashBalancesInput {
  USD: number;
  EUR: number;
  ILS: number;
}

// Convert cash to base currency (USD by default)
export function calculateTotalCashInBaseCurrency(
  cashBalances: CashBalancesInput,
  baseCurrency: 'USD' | 'ILS' = 'USD'
): number {
  // Approximate FX rates for conversion
  const EUR_TO_USD = 1.08;
  const ILS_TO_USD = 1 / 3.6;
  const USD_TO_ILS = 3.6;
  const EUR_TO_ILS = 3.9;
  
  if (baseCurrency === 'USD') {
    return cashBalances.USD + (cashBalances.EUR * EUR_TO_USD) + (cashBalances.ILS * ILS_TO_USD);
  } else {
    return cashBalances.ILS + (cashBalances.USD * USD_TO_ILS) + (cashBalances.EUR * EUR_TO_ILS);
  }
}

// Full performance metrics calculation
// Now includes cash balance in totalValue (NAV = Holdings + Cash)
export function calculatePerformanceMetrics(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  riskFreeRate: number,
  cashBalances?: CashBalancesInput,
  baseCurrency: 'USD' | 'ILS' = 'USD'
): PerformanceMetrics {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  let holdingsValue = 0;
  let totalCost = 0;
  let realizedPL = 0;
  
  for (const [ticker, pos] of Object.entries(positions)) {
    const val = latestVals[ticker];
    if (val && pos.quantity > 0) {
      const currentValue = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
      holdingsValue += currentValue;
    }
    totalCost += pos.totalCost;
    realizedPL += pos.realizedPL;
  }
  
  // Calculate cash in base currency
  const cashValue = cashBalances 
    ? calculateTotalCashInBaseCurrency(cashBalances, baseCurrency)
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
  
  // TWR is approximately the cumulative return
  const twr = cumulativeReturns.length > 0 
    ? cumulativeReturns[cumulativeReturns.length - 1].return 
    : 0;
  
  return {
    totalValue,       // NAV = Holdings + Cash
    holdingsValue,    // Market value of holdings only
    cashValue,        // Cash portion
    totalCost,
    realizedPL,
    unrealizedPL,
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

// Calculate tracking error
export function calculateTrackingError(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): number {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) return 0;
  
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const portRets = portfolioReturns.slice(-n);
  const benchRets = benchmarkReturns.slice(-n);
  
  // Active returns (difference)
  const activeReturns = portRets.map((r, i) => r - benchRets[i]);
  
  // Tracking error = std dev of active returns, annualized
  const mean = activeReturns.reduce((a, b) => a + b, 0) / n;
  const variance = activeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  
  return Math.sqrt(variance) * Math.sqrt(12); // Annualize
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
