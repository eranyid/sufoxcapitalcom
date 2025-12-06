import { Transaction, MonthlyValuation } from '@/types/investment';
import { calculatePositions, getLatestValuations, calculateAssetMonthlyReturns, calculateVolatility } from './calculations';

export interface PortfolioPoint {
  return: number;      // Expected annual return (%)
  volatility: number;  // Annual volatility (%)
  sharpe: number;      // Sharpe ratio
  weights: Record<string, number>;
  numAssets: number;
}

export interface EfficientFrontierResult {
  frontier: PortfolioPoint[];
  currentPortfolio: PortfolioPoint | null;
  minVariancePortfolio: PortfolioPoint | null;
  maxSharpePortfolio: PortfolioPoint | null;
  assets: { ticker: string; expectedReturn: number; volatility: number; weight: number }[];
  correlationMatrix: { tickers: string[]; matrix: number[][] };
  validationErrors: string[];
}

export interface FrontierOptions {
  riskFreeRate: number;
  numPortfolios: number;
  allowLeverage: boolean;
  allowShortSelling: boolean;
}

// Calculate correlation between two arrays
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

// Generate random portfolio weights
function generateRandomWeights(n: number, allowShort: boolean, allowLeverage: boolean): number[] {
  const weights: number[] = [];
  
  if (allowShort && allowLeverage) {
    // Allow negative weights and sum != 1
    let sum = 0;
    for (let i = 0; i < n; i++) {
      weights[i] = (Math.random() - 0.5) * 2; // -1 to 1
      sum += weights[i];
    }
    // Normalize to sum to 1 but allow leverage
    const leverageFactor = 1 + Math.random(); // 1 to 2
    for (let i = 0; i < n; i++) {
      weights[i] = (weights[i] / Math.abs(sum)) * leverageFactor;
    }
  } else if (allowShort) {
    // Allow shorts but sum to 1
    let sum = 0;
    for (let i = 0; i < n; i++) {
      weights[i] = Math.random() - 0.3; // -0.3 to 0.7
      sum += weights[i];
    }
    for (let i = 0; i < n; i++) {
      weights[i] /= sum;
    }
  } else if (allowLeverage) {
    // Long only with leverage
    let sum = 0;
    for (let i = 0; i < n; i++) {
      weights[i] = Math.random();
      sum += weights[i];
    }
    const leverageFactor = 1 + Math.random() * 0.5; // 1 to 1.5
    for (let i = 0; i < n; i++) {
      weights[i] = (weights[i] / sum) * leverageFactor;
    }
  } else {
    // Long only, sum to 1
    let sum = 0;
    for (let i = 0; i < n; i++) {
      weights[i] = Math.random();
      sum += weights[i];
    }
    for (let i = 0; i < n; i++) {
      weights[i] /= sum;
    }
  }
  
  return weights;
}

// Calculate portfolio return and volatility using mean-variance optimization
function calculatePortfolioStats(
  weights: number[],
  expectedReturns: number[],
  covMatrix: number[][],
  riskFreeRate: number
): { return: number; volatility: number; sharpe: number } {
  const n = weights.length;
  
  // Portfolio return: sum of weight * expected return
  let portfolioReturn = 0;
  for (let i = 0; i < n; i++) {
    portfolioReturn += weights[i] * expectedReturns[i];
  }
  
  // Portfolio variance: w' * Cov * w
  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  
  const portfolioVolatility = Math.sqrt(Math.max(0, portfolioVariance));
  const sharpe = portfolioVolatility > 0 
    ? (portfolioReturn - riskFreeRate) / portfolioVolatility 
    : 0;
  
  return {
    return: portfolioReturn,
    volatility: portfolioVolatility,
    sharpe
  };
}

// Build covariance matrix from correlation and volatilities
function buildCovarianceMatrix(
  correlationMatrix: number[][],
  volatilities: number[]
): number[][] {
  const n = volatilities.length;
  const covMatrix: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    covMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      // Cov(i,j) = Corr(i,j) * Vol(i) * Vol(j)
      covMatrix[i][j] = correlationMatrix[i][j] * volatilities[i] * volatilities[j];
    }
  }
  
  return covMatrix;
}

export function calculateEfficientFrontier(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  options: FrontierOptions
): EfficientFrontierResult {
  const validationErrors: string[] = [];
  
  // Get current positions and weights
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  
  // Filter assets with sufficient data (at least 6 months of returns)
  const tickers = Object.keys(assetReturns).filter(t => {
    const returns = assetReturns[t];
    if (!returns || returns.length < 6) {
      validationErrors.push(`${t}: Insufficient price history (need at least 6 months)`);
      return false;
    }
    return true;
  });
  
  if (tickers.length < 2) {
    validationErrors.push('Need at least 2 assets with sufficient price history');
    return {
      frontier: [],
      currentPortfolio: null,
      minVariancePortfolio: null,
      maxSharpePortfolio: null,
      assets: [],
      correlationMatrix: { tickers: [], matrix: [] },
      validationErrors
    };
  }
  
  // Align returns to common months
  const allMonths = new Set<string>();
  tickers.forEach(t => assetReturns[t].forEach(r => allMonths.add(r.month)));
  const commonMonths = [...allMonths].filter(month => 
    tickers.every(t => assetReturns[t].some(r => r.month === month))
  ).sort();
  
  if (commonMonths.length < 6) {
    validationErrors.push('Insufficient overlapping price history between assets');
    return {
      frontier: [],
      currentPortfolio: null,
      minVariancePortfolio: null,
      maxSharpePortfolio: null,
      assets: [],
      correlationMatrix: { tickers: [], matrix: [] },
      validationErrors
    };
  }
  
  // Get aligned returns
  const alignedReturns: Record<string, number[]> = {};
  tickers.forEach(t => {
    alignedReturns[t] = commonMonths.map(month => {
      const ret = assetReturns[t].find(r => r.month === month);
      return ret ? ret.return : 0;
    });
  });
  
  // Calculate expected returns and volatilities (annualized)
  const expectedReturns: number[] = [];
  const volatilities: number[] = [];
  
  for (const ticker of tickers) {
    const returns = alignedReturns[ticker];
    const meanMonthly = returns.reduce((a, b) => a + b, 0) / returns.length;
    expectedReturns.push(meanMonthly * 12); // Annualize
    volatilities.push(calculateVolatility(returns));
  }
  
  // Calculate correlation matrix
  const correlationMatrix: number[][] = [];
  for (let i = 0; i < tickers.length; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < tickers.length; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1;
      } else {
        correlationMatrix[i][j] = calculateCorrelation(
          alignedReturns[tickers[i]], 
          alignedReturns[tickers[j]]
        );
      }
    }
  }
  
  // Build covariance matrix
  const covMatrix = buildCovarianceMatrix(correlationMatrix, volatilities);
  
  // Calculate current portfolio weights
  let totalValue = 0;
  const currentWeights: Record<string, number> = {};
  
  for (const ticker of tickers) {
    const pos = positions[ticker];
    const val = latestVals[ticker];
    if (pos && val && pos.quantity > 0) {
      const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
      currentWeights[ticker] = value;
      totalValue += value;
    } else {
      currentWeights[ticker] = 0;
    }
  }
  
  // Normalize weights
  const currentWeightsArray: number[] = [];
  for (const ticker of tickers) {
    const weight = totalValue > 0 ? currentWeights[ticker] / totalValue : 0;
    currentWeights[ticker] = weight;
    currentWeightsArray.push(weight);
  }
  
  // Calculate current portfolio stats
  let currentPortfolio: PortfolioPoint | null = null;
  if (totalValue > 0) {
    const stats = calculatePortfolioStats(currentWeightsArray, expectedReturns, covMatrix, options.riskFreeRate);
    currentPortfolio = {
      ...stats,
      weights: currentWeights,
      numAssets: Object.values(currentWeights).filter(w => w > 0.001).length
    };
  }
  
  // Generate random portfolios for the frontier
  const portfolios: PortfolioPoint[] = [];
  
  for (let i = 0; i < options.numPortfolios; i++) {
    const weights = generateRandomWeights(
      tickers.length, 
      options.allowShortSelling, 
      options.allowLeverage
    );
    
    const stats = calculatePortfolioStats(weights, expectedReturns, covMatrix, options.riskFreeRate);
    
    // Skip invalid portfolios
    if (isNaN(stats.volatility) || isNaN(stats.return)) continue;
    
    const weightsMap: Record<string, number> = {};
    tickers.forEach((t, idx) => weightsMap[t] = weights[idx]);
    
    portfolios.push({
      ...stats,
      weights: weightsMap,
      numAssets: weights.filter(w => Math.abs(w) > 0.001).length
    });
  }
  
  // Find efficient frontier (portfolios with highest return for each volatility level)
  portfolios.sort((a, b) => a.volatility - b.volatility);
  
  const frontier: PortfolioPoint[] = [];
  let maxReturn = -Infinity;
  
  for (const p of portfolios) {
    if (p.return >= maxReturn) {
      frontier.push(p);
      maxReturn = p.return;
    }
  }
  
  // Find minimum variance portfolio
  const minVariancePortfolio = portfolios.length > 0 
    ? portfolios.reduce((min, p) => p.volatility < min.volatility ? p : min)
    : null;
  
  // Find maximum Sharpe portfolio
  const maxSharpePortfolio = portfolios.length > 0
    ? portfolios.reduce((max, p) => p.sharpe > max.sharpe ? p : max)
    : null;
  
  // Build asset summary
  const assets = tickers.map((ticker, idx) => ({
    ticker,
    expectedReturn: expectedReturns[idx],
    volatility: volatilities[idx],
    weight: currentWeights[ticker] * 100
  }));
  
  return {
    frontier,
    currentPortfolio,
    minVariancePortfolio,
    maxSharpePortfolio,
    assets,
    correlationMatrix: { tickers, matrix: correlationMatrix },
    validationErrors
  };
}
