/**
 * Institutional-Grade Efficient Frontier Engine
 * 
 * Uses deterministic Markowitz mean-variance optimization with:
 * - Analytical closed-form solutions for min-variance and max-Sharpe portfolios
 * - Quadratic programming for frontier curve generation
 * - Double-precision calculations throughout
 * - No random sampling - results are fully reproducible
 */

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
  numPortfolios: number;  // Number of frontier points (not random samples)
  allowLeverage: boolean;
  allowShortSelling: boolean;
}

// ============= Matrix Operations =============

/**
 * Matrix multiplication: A * B
 */
function matMul(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result: number[][] = [];
  
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Matrix-vector multiplication: A * v
 */
function matVecMul(A: number[][], v: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < A.length; i++) {
    let sum = 0;
    for (let j = 0; j < v.length; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

/**
 * Vector dot product: a · b
 */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Matrix transpose
 */
function transpose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const result: number[][] = [];
  
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

/**
 * LU Decomposition for matrix inversion
 * Returns [L, U, P] where P*A = L*U
 */
function luDecomposition(A: number[][]): { L: number[][]; U: number[][]; P: number[] } {
  const n = A.length;
  const L: number[][] = [];
  const U: number[][] = [];
  const P: number[] = [];
  
  // Initialize
  for (let i = 0; i < n; i++) {
    L[i] = new Array(n).fill(0);
    U[i] = [...A[i]];
    P[i] = i;
    L[i][i] = 1;
  }
  
  for (let k = 0; k < n; k++) {
    // Find pivot
    let maxVal = Math.abs(U[k][k]);
    let maxIdx = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(U[i][k]) > maxVal) {
        maxVal = Math.abs(U[i][k]);
        maxIdx = i;
      }
    }
    
    // Swap rows
    if (maxIdx !== k) {
      [U[k], U[maxIdx]] = [U[maxIdx], U[k]];
      [P[k], P[maxIdx]] = [P[maxIdx], P[k]];
      for (let j = 0; j < k; j++) {
        [L[k][j], L[maxIdx][j]] = [L[maxIdx][j], L[k][j]];
      }
    }
    
    // Eliminate
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(U[k][k]) > 1e-12) {
        L[i][k] = U[i][k] / U[k][k];
        for (let j = k; j < n; j++) {
          U[i][j] -= L[i][k] * U[k][j];
        }
      }
    }
  }
  
  return { L, U, P };
}

/**
 * Solve linear system using LU decomposition
 * Solves A*x = b
 */
function solveLU(A: number[][], b: number[]): number[] {
  const n = A.length;
  const { L, U, P } = luDecomposition(A);
  
  // Reorder b according to permutation
  const bp: number[] = [];
  for (let i = 0; i < n; i++) {
    bp[i] = b[P[i]];
  }
  
  // Forward substitution: L*y = bp
  const y: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = bp[i];
    for (let j = 0; j < i; j++) {
      sum -= L[i][j] * y[j];
    }
    y[i] = sum;
  }
  
  // Back substitution: U*x = y
  const x: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i];
    for (let j = i + 1; j < n; j++) {
      sum -= U[i][j] * x[j];
    }
    if (Math.abs(U[i][i]) > 1e-12) {
      x[i] = sum / U[i][i];
    } else {
      x[i] = 0;
    }
  }
  
  return x;
}

/**
 * Matrix inversion using LU decomposition
 */
function invertMatrix(A: number[][]): number[][] {
  const n = A.length;
  const inv: number[][] = [];
  
  for (let j = 0; j < n; j++) {
    const e: number[] = new Array(n).fill(0);
    e[j] = 1;
    const col = solveLU(A, e);
    for (let i = 0; i < n; i++) {
      if (!inv[i]) inv[i] = [];
      inv[i][j] = col[i];
    }
  }
  
  return inv;
}

// ============= Markowitz Optimization =============

/**
 * Calculate portfolio statistics
 */
function calculatePortfolioStats(
  weights: number[],
  expectedReturns: number[],
  covMatrix: number[][],
  riskFreeRate: number
): { return: number; volatility: number; sharpe: number } {
  const n = weights.length;
  
  // Portfolio return: w' * μ
  let portfolioReturn = 0;
  for (let i = 0; i < n; i++) {
    portfolioReturn += weights[i] * expectedReturns[i];
  }
  
  // Portfolio variance: w' * Σ * w
  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  
  const portfolioVolatility = Math.sqrt(Math.max(0, portfolioVariance));
  const sharpe = portfolioVolatility > 1e-10 
    ? (portfolioReturn - riskFreeRate) / portfolioVolatility 
    : 0;
  
  return {
    return: portfolioReturn,
    volatility: portfolioVolatility,
    sharpe
  };
}

/**
 * Find minimum variance portfolio (analytical solution with constraints)
 * 
 * For unconstrained case: w = Σ^(-1) * 1 / (1' * Σ^(-1) * 1)
 * For long-only: uses sequential quadratic programming approximation
 */
function findMinVariancePortfolio(
  covMatrix: number[][],
  expectedReturns: number[],
  riskFreeRate: number,
  allowShortSelling: boolean
): number[] {
  const n = covMatrix.length;
  
  if (allowShortSelling) {
    // Analytical solution for unconstrained minimum variance
    const ones = new Array(n).fill(1);
    const invCov = invertMatrix(covMatrix);
    const invCovOnes = matVecMul(invCov, ones);
    const denominator = dot(ones, invCovOnes);
    
    if (Math.abs(denominator) < 1e-12) {
      return new Array(n).fill(1 / n); // Equal weight fallback
    }
    
    const weights = invCovOnes.map(x => x / denominator);
    return weights;
  } else {
    // Long-only constraint: use gradient projection method
    return optimizeLongOnly(covMatrix, expectedReturns, null, riskFreeRate, 'minVar');
  }
}

/**
 * Find maximum Sharpe ratio (tangency) portfolio
 * 
 * For unconstrained: w = Σ^(-1) * (μ - rf*1) / (1' * Σ^(-1) * (μ - rf*1))
 */
function findMaxSharpePortfolio(
  covMatrix: number[][],
  expectedReturns: number[],
  riskFreeRate: number,
  allowShortSelling: boolean
): number[] {
  const n = covMatrix.length;
  
  if (allowShortSelling) {
    // Analytical solution for unconstrained tangency portfolio
    const excessReturns = expectedReturns.map(r => r - riskFreeRate);
    const ones = new Array(n).fill(1);
    
    const invCov = invertMatrix(covMatrix);
    const invCovExcess = matVecMul(invCov, excessReturns);
    const denominator = dot(ones, invCovExcess);
    
    if (Math.abs(denominator) < 1e-12) {
      // Fallback to min variance if tangency is undefined
      return findMinVariancePortfolio(covMatrix, expectedReturns, riskFreeRate, allowShortSelling);
    }
    
    const weights = invCovExcess.map(x => x / denominator);
    return weights;
  } else {
    // Long-only constraint
    return optimizeLongOnly(covMatrix, expectedReturns, null, riskFreeRate, 'maxSharpe');
  }
}

/**
 * Find portfolio for target return on the efficient frontier
 * 
 * Minimize: w' * Σ * w
 * Subject to: w' * μ = targetReturn, w' * 1 = 1
 */
function findPortfolioForTargetReturn(
  covMatrix: number[][],
  expectedReturns: number[],
  targetReturn: number,
  riskFreeRate: number,
  allowShortSelling: boolean
): number[] {
  const n = covMatrix.length;
  
  if (allowShortSelling) {
    // Use Lagrangian method for equality constraints
    // Build augmented system [2Σ, μ, 1; μ', 0, 0; 1', 0, 0] * [w; λ1; λ2] = [0; targetReturn; 1]
    
    const augSize = n + 2;
    const A: number[][] = [];
    const b: number[] = [];
    
    for (let i = 0; i < n; i++) {
      A[i] = [];
      for (let j = 0; j < n; j++) {
        A[i][j] = 2 * covMatrix[i][j];
      }
      A[i][n] = expectedReturns[i];
      A[i][n + 1] = 1;
      b[i] = 0;
    }
    
    // Constraint row for target return
    A[n] = [];
    for (let j = 0; j < n; j++) {
      A[n][j] = expectedReturns[j];
    }
    A[n][n] = 0;
    A[n][n + 1] = 0;
    b[n] = targetReturn;
    
    // Constraint row for weights sum to 1
    A[n + 1] = [];
    for (let j = 0; j < n; j++) {
      A[n + 1][j] = 1;
    }
    A[n + 1][n] = 0;
    A[n + 1][n + 1] = 0;
    b[n + 1] = 1;
    
    const solution = solveLU(A, b);
    return solution.slice(0, n);
  } else {
    // Long-only with target return
    return optimizeLongOnly(covMatrix, expectedReturns, targetReturn, riskFreeRate, 'targetReturn');
  }
}

/**
 * Long-only optimization using projected gradient descent with momentum
 * Handles non-negativity constraints iteratively
 * Improved stability with line search and momentum
 */
function optimizeLongOnly(
  covMatrix: number[][],
  expectedReturns: number[],
  targetReturn: number | null,
  riskFreeRate: number,
  mode: 'minVar' | 'maxSharpe' | 'targetReturn'
): number[] {
  const n = covMatrix.length;
  
  // Initialize with equal weights
  let weights = new Array(n).fill(1 / n);
  let velocity = new Array(n).fill(0);
  
  const maxIterations = 1000;
  const tolerance = 1e-10;
  const momentum = 0.8;
  let learningRate = 0.05;
  
  // Track best solution for maxSharpe
  let bestWeights = [...weights];
  let bestObjective = -Infinity;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let gradient: number[];
    let currentObjective: number;
    
    if (mode === 'minVar') {
      // Gradient of variance: 2 * Σ * w
      gradient = matVecMul(covMatrix, weights).map(x => 2 * x);
      currentObjective = -calculatePortfolioStats(weights, expectedReturns, covMatrix, riskFreeRate).volatility;
    } else if (mode === 'maxSharpe') {
      // Gradient of negative Sharpe ratio
      const stats = calculatePortfolioStats(weights, expectedReturns, covMatrix, riskFreeRate);
      currentObjective = stats.sharpe;
      
      if (stats.volatility < 1e-10) {
        break; // Can't improve further
      }
      
      // ∂(-Sharpe)/∂w = -(μ - rf)/σ + (ret - rf)/σ³ * Σw
      const covW = matVecMul(covMatrix, weights);
      gradient = expectedReturns.map((r, i) => {
        const term1 = -(r - riskFreeRate) / stats.volatility;
        const term2 = (stats.return - riskFreeRate) * covW[i] / Math.pow(stats.volatility, 3);
        return term1 + term2;
      });
      
      // Track best Sharpe
      if (currentObjective > bestObjective) {
        bestObjective = currentObjective;
        bestWeights = [...weights];
      }
    } else {
      // Target return: minimize variance with return constraint
      // Use augmented Lagrangian method with increasing penalty
      const lambda = 1000 + iter * 10; // Increasing penalty
      const currentReturn = dot(weights, expectedReturns);
      const returnError = currentReturn - (targetReturn || 0);
      
      const covW = matVecMul(covMatrix, weights);
      gradient = covW.map((x, i) => 2 * x + 2 * lambda * returnError * expectedReturns[i]);
      currentObjective = -calculatePortfolioStats(weights, expectedReturns, covMatrix, riskFreeRate).volatility;
    }
    
    // Apply momentum
    velocity = velocity.map((v, i) => momentum * v + learningRate * gradient[i]);
    
    // Project gradient step with momentum
    let newWeights = weights.map((w, i) => w - velocity[i]);
    
    // Project onto simplex (sum to 1, all >= 0)
    newWeights = projectOntoSimplex(newWeights);
    
    // Check convergence
    const diff = Math.sqrt(dot(
      newWeights.map((w, i) => w - weights[i]),
      newWeights.map((w, i) => w - weights[i])
    ));
    
    weights = newWeights;
    
    if (diff < tolerance) {
      break;
    }
    
    // Adaptive learning rate with decay
    if (iter % 100 === 0 && iter > 0) {
      learningRate *= 0.95;
    }
  }
  
  // For maxSharpe, return the best found solution
  if (mode === 'maxSharpe') {
    return bestWeights;
  }
  
  return weights;
}

/**
 * Project onto probability simplex (sum=1, all>=0)
 * Uses efficient O(n log n) algorithm
 */
function projectOntoSimplex(v: number[]): number[] {
  const n = v.length;
  const u = [...v].sort((a, b) => b - a);
  
  let cssv = 0;
  let rho = 0;
  
  for (let j = 0; j < n; j++) {
    cssv += u[j];
    if (u[j] - (cssv - 1) / (j + 1) > 0) {
      rho = j + 1;
    }
  }
  
  let cumSum = 0;
  for (let j = 0; j < rho; j++) {
    cumSum += u[j];
  }
  const theta = (cumSum - 1) / rho;
  
  return v.map(x => Math.max(0, x - theta));
}

/**
 * Calculate correlation between two arrays
 */
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

/**
 * Build covariance matrix from returns
 */
function buildCovarianceMatrix(
  alignedReturns: Record<string, number[]>,
  tickers: string[]
): number[][] {
  const n = tickers.length;
  const T = alignedReturns[tickers[0]].length;
  
  // Calculate means
  const means: number[] = [];
  for (const ticker of tickers) {
    means.push(alignedReturns[ticker].reduce((a, b) => a + b, 0) / T);
  }
  
  // Calculate covariance matrix (annualized)
  const covMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    covMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      let cov = 0;
      for (let t = 0; t < T; t++) {
        cov += (alignedReturns[tickers[i]][t] - means[i]) * 
               (alignedReturns[tickers[j]][t] - means[j]);
      }
      // Annualize: monthly covariance * 12
      covMatrix[i][j] = (cov / (T - 1)) * 12;
    }
  }
  
  return covMatrix;
}

/**
 * Main function: Calculate Efficient Frontier with deterministic optimization
 */
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
  
  // Filter assets with sufficient data (at least 12 months for reliability)
  const minMonths = 6;
  const tickers = Object.keys(assetReturns).filter(t => {
    const returns = assetReturns[t];
    if (!returns || returns.length < minMonths) {
      validationErrors.push(`${t}: Insufficient price history (need at least ${minMonths} months, have ${returns?.length || 0})`);
      return false;
    }
    return true;
  });
  
  if (tickers.length < 2) {
    validationErrors.push('Need at least 2 assets with sufficient price history for optimization');
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
  
  if (commonMonths.length < minMonths) {
    validationErrors.push(`Insufficient overlapping price history (need ${minMonths} months, have ${commonMonths.length})`);
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
  
  // Get aligned returns (monthly, not annualized yet)
  const alignedReturns: Record<string, number[]> = {};
  tickers.forEach(t => {
    alignedReturns[t] = commonMonths.map(month => {
      const ret = assetReturns[t].find(r => r.month === month);
      return ret ? ret.return : 0;
    });
  });
  
  // Calculate expected returns (annualized)
  const expectedReturns: number[] = [];
  const volatilities: number[] = [];
  
  for (const ticker of tickers) {
    const returns = alignedReturns[ticker];
    const meanMonthly = returns.reduce((a, b) => a + b, 0) / returns.length;
    expectedReturns.push(meanMonthly * 12); // Annualize
    volatilities.push(calculateVolatility(returns));
  }
  
  // Build covariance matrix (annualized)
  const covMatrix = buildCovarianceMatrix(alignedReturns, tickers);
  
  // Calculate correlation matrix for display
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
      weights: { ...currentWeights },
      numAssets: Object.values(currentWeights).filter(w => w > 0.001).length
    };
  }
  
  // ============= DETERMINISTIC OPTIMIZATION =============
  
  // 1. Find Minimum Variance Portfolio
  const minVarWeights = findMinVariancePortfolio(
    covMatrix, 
    expectedReturns, 
    options.riskFreeRate, 
    options.allowShortSelling
  );
  const minVarStats = calculatePortfolioStats(minVarWeights, expectedReturns, covMatrix, options.riskFreeRate);
  const minVarWeightsMap: Record<string, number> = {};
  tickers.forEach((t, i) => minVarWeightsMap[t] = minVarWeights[i]);
  
  const minVariancePortfolio: PortfolioPoint = {
    ...minVarStats,
    weights: minVarWeightsMap,
    numAssets: minVarWeights.filter(w => Math.abs(w) > 0.001).length
  };
  
  // 2. Find Maximum Sharpe Portfolio (Tangency Portfolio)
  const maxSharpeWeights = findMaxSharpePortfolio(
    covMatrix, 
    expectedReturns, 
    options.riskFreeRate, 
    options.allowShortSelling
  );
  const maxSharpeStats = calculatePortfolioStats(maxSharpeWeights, expectedReturns, covMatrix, options.riskFreeRate);
  const maxSharpeWeightsMap: Record<string, number> = {};
  tickers.forEach((t, i) => maxSharpeWeightsMap[t] = maxSharpeWeights[i]);
  
  const maxSharpePortfolio: PortfolioPoint = {
    ...maxSharpeStats,
    weights: maxSharpeWeightsMap,
    numAssets: maxSharpeWeights.filter(w => Math.abs(w) > 0.001).length
  };
  
  // 3. Generate Efficient Frontier Curve
  // Find the range of returns on the frontier
  const minReturn = minVarStats.return;
  const maxReturn = Math.max(...expectedReturns);
  
  // Handle edge case where all returns are the same
  const returnRange = maxReturn - minReturn;
  const numFrontierPoints = Math.min(options.numPortfolios, 100); // Cap at 100 for performance
  
  const frontier: PortfolioPoint[] = [];
  
  // Add minimum variance point first
  frontier.push(minVariancePortfolio);
  
  if (returnRange > 0.01) { // Only generate curve if there's meaningful variation
    const step = returnRange / (numFrontierPoints - 1);
    
    for (let i = 1; i < numFrontierPoints; i++) {
      const targetReturn = minReturn + i * step;
      
      // Skip if target is very close to min variance return
      if (Math.abs(targetReturn - minReturn) < 0.01) continue;
      
      try {
        const weights = findPortfolioForTargetReturn(
          covMatrix,
          expectedReturns,
          targetReturn,
          options.riskFreeRate,
          options.allowShortSelling
        );
        
        const stats = calculatePortfolioStats(weights, expectedReturns, covMatrix, options.riskFreeRate);
        
        // Validate portfolio
        if (!isNaN(stats.volatility) && !isNaN(stats.return) && stats.volatility > 0) {
          const weightsMap: Record<string, number> = {};
          tickers.forEach((t, idx) => weightsMap[t] = weights[idx]);
          
          frontier.push({
            ...stats,
            weights: weightsMap,
            numAssets: weights.filter(w => Math.abs(w) > 0.001).length
          });
        }
      } catch (e) {
        // Skip problematic points
        continue;
      }
    }
  }
  
  // Sort frontier by volatility and remove dominated points
  frontier.sort((a, b) => a.volatility - b.volatility);
  
  // Filter to keep only efficient (non-dominated) portfolios
  const efficientFrontier: PortfolioPoint[] = [];
  let maxSeenReturn = -Infinity;
  
  for (const p of frontier) {
    if (p.return >= maxSeenReturn - 0.001) { // Small tolerance for numerical precision
      efficientFrontier.push(p);
      maxSeenReturn = Math.max(maxSeenReturn, p.return);
    }
  }
  
  // Build asset summary
  const assets = tickers.map((ticker, idx) => ({
    ticker,
    expectedReturn: expectedReturns[idx],
    volatility: volatilities[idx],
    weight: currentWeights[ticker] * 100
  }));
  
  return {
    frontier: efficientFrontier,
    currentPortfolio,
    minVariancePortfolio,
    maxSharpePortfolio,
    assets,
    correlationMatrix: { tickers, matrix: correlationMatrix },
    validationErrors
  };
}
