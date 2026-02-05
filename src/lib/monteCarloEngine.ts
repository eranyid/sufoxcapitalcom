/**
 * SUFOX Capital Terminal - Multivariate Monte Carlo Simulation Engine
 * ====================================================================
 * 
 * Institutional-grade Monte Carlo simulation following Morningstar EnCorr methodology.
 * Uses Cholesky decomposition for correlated asset returns.
 * 
 * Key Features:
 * - Multivariate simulation with asset-level correlations
 * - Cholesky decomposition for correlated random shocks
 * - Geometric Brownian Motion (GBM) with Itô correction
 * - Rebalancing options (constant weights vs. buy-and-hold)
 * - Data quality validation and fallback mechanisms
 * 
 * Formula: S_i(t+1) = S_i(t) × exp[(μ_i - 0.5σ_i²)Δt + σ_i√Δt × ε_i]
 * Where ε = L × Z (correlated shocks via Cholesky)
 */

// ============================================
// TYPES
// ============================================

export interface AssetParameters {
  ticker: string;
  name: string;
  weight: number;           // Current portfolio weight (0-1)
  meanReturn: number;       // Annualized expected return (decimal)
  volatility: number;       // Annualized volatility (decimal)
  monthsOfData: number;     // For confidence indicator
}

export interface MultivariateConfig {
  assets: AssetParameters[];
  correlationMatrix: number[][];
  covarianceMatrix: number[][];
  choleskyL: number[][];
  rebalancing: 'constant' | 'buy_and_hold';
}

export type SimulationModeType = 'univariate' | 'multivariate';

export interface SimulationMode {
  type: SimulationModeType;
  reason?: string;  // Why fallback to univariate
}

export type DataQualityLevel = 'high' | 'medium' | 'low' | 'insufficient';

export interface DataQualityInfo {
  level: DataQualityLevel;
  minMonths: number;
  avgMonths: number;
  assets: { ticker: string; months: number }[];
}

export interface MultivariateSimulationResult {
  paths: number[][];           // Portfolio paths [simulation][year]
  assetPaths?: number[][][];   // Per-asset paths [simulation][asset][year]
  finalValues: number[];       // Sorted final portfolio values
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
  riskMetrics: {
    var95: number;
    cvar95: number;
    probGain: number;
    probLoss: number;
  };
  diversificationBenefit: number;  // % reduction vs. weighted-average VaRs
}

// ============================================
// NUMERICAL STABILITY GUARDS
// ============================================

/**
 * Maximum allowed log return per step to prevent numerical overflow
 * This caps extreme moves to ~50% per period
 */
const MAX_LOG_RETURN_PER_STEP = 0.4;

/**
 * Maximum portfolio value multiplier (prevents runaway growth)
 * 1000x initial value is already astronomical for any realistic projection
 */
const MAX_VALUE_MULTIPLIER = 10000;

/**
 * Minimum portfolio value as fraction of initial (prevent zero/negative)
 */
const MIN_VALUE_MULTIPLIER = 0.0001;

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if a number is valid (finite and not NaN)
 */
function isValidNumber(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

// ============================================
// RANDOM NUMBER GENERATION
// ============================================

/**
 * Box-Muller transform for generating standard normal random numbers
 * N(0,1) distribution
 */
export function generateNormalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate N independent standard normal random variables
 */
export function generateIndependentNormals(n: number): number[] {
  return Array.from({ length: n }, () => generateNormalRandom());
}

// ============================================
// MATRIX OPERATIONS
// ============================================

/**
 * Cholesky Decomposition
 * Decomposes a positive-definite matrix Σ into L × L^T
 * where L is a lower triangular matrix
 * 
 * Input: Covariance or correlation matrix (must be positive semi-definite)
 * Output: Lower triangular matrix L
 * 
 * Algorithm: Cholesky-Banachiewicz
 */
export function choleskyDecomposition(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  const L: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let j = 0; j < n; j++) {
    // Diagonal element
    let sum = 0;
    for (let k = 0; k < j; k++) {
      sum += L[j][k] * L[j][k];
    }
    
    const diag = matrix[j][j] - sum;
    
    // Check for numerical stability (matrix must be positive definite)
    if (diag < 0) {
      // Matrix is not positive definite - return null to trigger fallback
      console.warn('Cholesky decomposition failed: matrix is not positive definite');
      return null;
    }
    
    L[j][j] = Math.sqrt(diag);
    
    // Off-diagonal elements
    for (let i = j + 1; i < n; i++) {
      let sum2 = 0;
      for (let k = 0; k < j; k++) {
        sum2 += L[i][k] * L[j][k];
      }
      
      L[i][j] = L[j][j] !== 0 ? (matrix[i][j] - sum2) / L[j][j] : 0;
    }
  }
  
  return L;
}

/**
 * Matrix-vector multiplication
 * Result: L × Z (transforms independent normals to correlated)
 */
export function matrixVectorMultiply(L: number[][], Z: number[]): number[] {
  const n = L.length;
  const result: number[] = Array(n).fill(0);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {  // L is lower triangular
      result[i] += L[i][j] * Z[j];
    }
  }
  
  return result;
}

// ============================================
// COVARIANCE & CORRELATION
// ============================================

/**
 * Build covariance matrix from asset statistics
 * Cov(i,j) = ρ_ij × σ_i × σ_j
 */
export function buildCovarianceMatrix(
  volatilities: number[],
  correlationMatrix: number[][]
): number[][] {
  const n = volatilities.length;
  const covMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      covMatrix[i][j] = correlationMatrix[i][j] * volatilities[i] * volatilities[j];
    }
  }
  
  return covMatrix;
}

/**
 * Calculate correlation between two return series
 */
export function calculateCorrelation(x: number[], y: number[]): number {
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
 * Calculate mean and standard deviation from return series
 */
export function calculateStatistics(returns: number[]): { mean: number; std: number } {
  const n = returns.length;
  if (n === 0) return { mean: 0, std: 0 };
  
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  
  if (n < 2) return { mean, std: 0 };
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  return { mean, std };
}

// ============================================
// DATA QUALITY ASSESSMENT
// ============================================

/**
 * Assess data quality based on months of historical data
 * 
 * Thresholds:
 * - High: 12+ months (full multivariate)
 * - Medium: 6-11 months (multivariate with warning)
 * - Low: 3-5 months (univariate fallback)
 * - Insufficient: <3 months (simulation disabled)
 */
export function assessDataQuality(assets: AssetParameters[]): DataQualityInfo {
  if (assets.length === 0) {
    return { level: 'insufficient', minMonths: 0, avgMonths: 0, assets: [] };
  }
  
  const months = assets.map(a => a.monthsOfData);
  const minMonths = Math.min(...months);
  const avgMonths = months.reduce((a, b) => a + b, 0) / months.length;
  
  let level: DataQualityLevel;
  
  if (minMonths >= 12) {
    level = 'high';
  } else if (minMonths >= 6) {
    level = 'medium';
  } else if (minMonths >= 3) {
    level = 'low';
  } else {
    level = 'insufficient';
  }
  
  return {
    level,
    minMonths,
    avgMonths,
    assets: assets.map(a => ({ ticker: a.ticker, months: a.monthsOfData }))
  };
}

/**
 * Determine simulation mode based on data quality and asset count
 */
export function determineSimulationMode(
  assets: AssetParameters[],
  correlationMatrix: number[][] | null
): SimulationMode {
  // Need at least 2 assets for multivariate
  if (assets.length < 2) {
    return { 
      type: 'univariate', 
      reason: 'Single asset - using portfolio-level simulation' 
    };
  }
  
  const quality = assessDataQuality(assets);
  
  // Insufficient data
  if (quality.level === 'insufficient') {
    return { 
      type: 'univariate', 
      reason: `Insufficient data (min ${quality.minMonths} months) - need at least 3 months per asset` 
    };
  }
  
  // Check if we have a valid correlation matrix
  if (!correlationMatrix || correlationMatrix.length < 2) {
    return { 
      type: 'univariate', 
      reason: 'Unable to calculate correlation matrix' 
    };
  }
  
  // Low quality - fallback to univariate
  if (quality.level === 'low') {
    return { 
      type: 'univariate', 
      reason: `Low data quality (${quality.minMonths} months) - using univariate for stability` 
    };
  }
  
  // Medium or high quality - use multivariate
  return { 
    type: 'multivariate',
    reason: quality.level === 'medium' 
      ? `Medium confidence (${quality.minMonths} months) - correlations may be unstable`
      : undefined
  };
}

// ============================================
// MULTIVARIATE SIMULATION ENGINE
// ============================================

/**
 * Run Multivariate Monte Carlo Simulation
 * 
 * Uses Cholesky decomposition to generate correlated asset returns,
 * then aggregates to portfolio level.
 * 
 * @param config - Multivariate configuration with assets and correlation
 * @param initialValue - Starting portfolio value
 * @param years - Simulation horizon in years
 * @param numSimulations - Number of Monte Carlo paths
 * @param stepsPerYear - Time steps per year (12 = monthly, 252 = daily)
 */
export function runMultivariateSimulation(
  config: MultivariateConfig,
  initialValue: number,
  years: number,
  numSimulations: number = 10000,
  stepsPerYear: number = 12
): MultivariateSimulationResult | null {
  const { assets, choleskyL, rebalancing } = config;
  const n = assets.length;
  
  if (n === 0 || !choleskyL) {
    return null;
  }
  
  const totalSteps = years * stepsPerYear;
  const dt = 1 / stepsPerYear;  // Time step as fraction of year
  const sqrtDt = Math.sqrt(dt);
  
  // Per-asset parameters (already annualized) - clamp to reasonable ranges
  const means = assets.map(a => clamp(a.meanReturn, -0.5, 1.0));  // -50% to +100% annual
  const vols = assets.map(a => clamp(a.volatility, 0.01, 1.0));   // 1% to 100% annual
  const weights = assets.map(a => a.weight);
  
  // Value bounds
  const maxValue = initialValue * MAX_VALUE_MULTIPLIER;
  const minValue = initialValue * MIN_VALUE_MULTIPLIER;
  
  const portfolioPaths: number[][] = [];
  const finalValues: number[] = [];
  
  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    // Initialize asset values based on weights
    let assetValues = weights.map(w => initialValue * w);
    const portfolioPath: number[] = [initialValue];
    let isPathValid = true;
    
    for (let step = 0; step < totalSteps && isPathValid; step++) {
      // Generate correlated random shocks
      const Z = generateIndependentNormals(n);
      const epsilon = matrixVectorMultiply(choleskyL, Z);
      
      // Update each asset using GBM
      for (let i = 0; i < n; i++) {
        // GBM with Itô correction: r = (μ - 0.5σ²)dt + σ√dt × ε
        const drift = (means[i] - 0.5 * vols[i] * vols[i]) * dt;
        const diffusion = vols[i] * sqrtDt * epsilon[i];
        // Clamp log return to prevent extreme moves
        const logReturn = clamp(drift + diffusion, -MAX_LOG_RETURN_PER_STEP, MAX_LOG_RETURN_PER_STEP);
        
        let newValue = assetValues[i] * Math.exp(logReturn);
        
        // Guard against invalid values
        if (!isValidNumber(newValue)) {
          newValue = assetValues[i]; // Keep previous value
        }
        
        assetValues[i] = newValue;
      }
      
      // Check for path validity
      const currentTotal = assetValues.reduce((a, b) => a + b, 0);
      if (!isValidNumber(currentTotal) || currentTotal > maxValue * 10) {
        isPathValid = false;
        break;
      }
      
      // Rebalancing logic
      if (rebalancing === 'constant') {
        // Constant weights: rebalance to target weights each period
        const totalValue = assetValues.reduce((a, b) => a + b, 0);
        const clampedTotal = clamp(totalValue, minValue, maxValue);
        assetValues = weights.map(w => clampedTotal * w);
      } else {
        // For buy_and_hold, still apply value bounds per asset
        assetValues = assetValues.map(v => clamp(v, minValue / n, maxValue / n));
      }
      
      // Record portfolio value at yearly intervals
      if ((step + 1) % stepsPerYear === 0) {
        const portfolioValue = clamp(assetValues.reduce((a, b) => a + b, 0), minValue, maxValue);
        portfolioPath.push(portfolioValue);
      }
    }
    
    // Only include valid paths
    if (isPathValid) {
      const finalValue = clamp(assetValues.reduce((a, b) => a + b, 0), minValue, maxValue);
      // Fill missing yearly values if path was cut short
      while (portfolioPath.length < years + 1) {
        portfolioPath.push(portfolioPath[portfolioPath.length - 1]);
      }
      portfolioPaths.push(portfolioPath);
      finalValues.push(finalValue);
    }
  }
  
  // If too many paths were invalid, return null
  if (finalValues.length < numSimulations * 0.5) {
    console.warn('Monte Carlo: Too many invalid paths, falling back');
    return null;
  }
  
  // Sort final values for percentile calculations
  const sortedFinalValues = [...finalValues].sort((a, b) => a - b);
  
  // Calculate percentiles
  const getPercentile = (p: number) => {
    const index = Math.floor((p / 100) * sortedFinalValues.length);
    return sortedFinalValues[Math.min(index, sortedFinalValues.length - 1)];
  };
  
  // Calculate risk metrics
  const cutoffIndex = Math.floor(0.05 * sortedFinalValues.length);
  const p5Value = sortedFinalValues[cutoffIndex];
  const var95 = ((p5Value - initialValue) / initialValue) * 100;
  
  const tailValues = sortedFinalValues.slice(0, cutoffIndex + 1);
  const avgTailValue = tailValues.reduce((a, b) => a + b, 0) / tailValues.length;
  const cvar95 = ((avgTailValue - initialValue) / initialValue) * 100;
  
  const probGain = (finalValues.filter(v => v > initialValue).length / finalValues.length) * 100;
  const probLoss = 100 - probGain;
  
  // Calculate diversification benefit
  // Compare portfolio VaR to weighted average of individual VaRs
  const individualVars = assets.map(a => 1.645 * a.volatility * Math.sqrt(years));
  const weightedAvgVar = assets.reduce((sum, a, i) => sum + a.weight * individualVars[i], 0);
  const portfolioVarEstimate = Math.abs(var95 / 100);
  const diversificationBenefit = weightedAvgVar > 0 
    ? ((weightedAvgVar - portfolioVarEstimate) / weightedAvgVar) * 100 
    : 0;
  
  return {
    paths: portfolioPaths,
    finalValues: sortedFinalValues,
    percentiles: {
      p5: getPercentile(5),
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
    },
    riskMetrics: {
      var95,
      cvar95,
      probGain,
      probLoss,
    },
    diversificationBenefit: Math.max(0, diversificationBenefit),
  };
}

/**
 * Run Univariate Monte Carlo Simulation (Portfolio-Level)
 * 
 * Fallback when multivariate is not possible.
 * Simulates the portfolio as a single entity.
 */
export function runUnivariateSimulation(
  initialValue: number,
  annualReturn: number,
  annualVol: number,
  years: number,
  numSimulations: number = 10000,
  stepsPerYear: number = 12
): MultivariateSimulationResult {
  const totalSteps = years * stepsPerYear;
  const dt = 1 / stepsPerYear;
  const sqrtDt = Math.sqrt(dt);
  
  // Clamp inputs to reasonable ranges
  const clampedReturn = clamp(annualReturn, -0.5, 1.0);  // -50% to +100% annual
  const clampedVol = clamp(annualVol, 0.01, 1.0);        // 1% to 100% annual
  
  const drift = (clampedReturn - 0.5 * clampedVol * clampedVol) * dt;
  const diffusion = clampedVol * sqrtDt;
  
  // Value bounds
  const maxValue = initialValue * MAX_VALUE_MULTIPLIER;
  const minValue = initialValue * MIN_VALUE_MULTIPLIER;
  
  const portfolioPaths: number[][] = [];
  const finalValues: number[] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    let value = initialValue;
    const path: number[] = [initialValue];
    
    for (let step = 0; step < totalSteps; step++) {
      const z = generateNormalRandom();
      // Clamp log return to prevent extreme moves
      const logReturn = clamp(drift + diffusion * z, -MAX_LOG_RETURN_PER_STEP, MAX_LOG_RETURN_PER_STEP);
      let newValue = value * Math.exp(logReturn);
      
      // Guard against invalid values and apply bounds
      if (!isValidNumber(newValue)) {
        newValue = value; // Keep previous value
      }
      value = clamp(newValue, minValue, maxValue);
      
      if ((step + 1) % stepsPerYear === 0) {
        path.push(value);
      }
    }
    
    portfolioPaths.push(path);
    finalValues.push(value);
  }
  
  const sortedFinalValues = [...finalValues].sort((a, b) => a - b);
  
  const getPercentile = (p: number) => {
    const index = Math.floor((p / 100) * sortedFinalValues.length);
    return sortedFinalValues[Math.min(index, sortedFinalValues.length - 1)];
  };
  
  const cutoffIndex = Math.floor(0.05 * sortedFinalValues.length);
  const p5Value = sortedFinalValues[cutoffIndex];
  const var95 = ((p5Value - initialValue) / initialValue) * 100;
  
  const tailValues = sortedFinalValues.slice(0, cutoffIndex + 1);
  const avgTailValue = tailValues.reduce((a, b) => a + b, 0) / tailValues.length;
  const cvar95 = ((avgTailValue - initialValue) / initialValue) * 100;
  
  const probGain = (finalValues.filter(v => v > initialValue).length / finalValues.length) * 100;
  
  return {
    paths: portfolioPaths,
    finalValues: sortedFinalValues,
    percentiles: {
      p5: getPercentile(5),
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
    },
    riskMetrics: {
      var95,
      cvar95,
      probGain,
      probLoss: 100 - probGain,
    },
    diversificationBenefit: 0, // N/A for univariate
  };
}

/**
 * Build multivariate configuration from asset data
 * Returns null if configuration cannot be built
 */
export function buildMultivariateConfig(
  assets: AssetParameters[],
  correlationMatrix: number[][],
  rebalancing: 'constant' | 'buy_and_hold' = 'constant'
): MultivariateConfig | null {
  if (assets.length < 2 || correlationMatrix.length !== assets.length) {
    return null;
  }
  
  const volatilities = assets.map(a => a.volatility);
  const covarianceMatrix = buildCovarianceMatrix(volatilities, correlationMatrix);
  const choleskyL = choleskyDecomposition(covarianceMatrix);
  
  if (!choleskyL) {
    return null;
  }
  
  return {
    assets,
    correlationMatrix,
    covarianceMatrix,
    choleskyL,
    rebalancing,
  };
}

/**
 * Generate percentile paths for fan chart visualization
 */
export function generatePercentilePathsMultivariate(
  config: MultivariateConfig | null,
  initialValue: number,
  maxYears: number,
  annualReturn: number,
  annualVol: number,
  numSimulations: number = 2000,
  stepsPerYear: number = 12
): { period: number; p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number }[] {
  const results: { period: number; p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number }[] = [];
  
  // Year 0: initial value
  results.push({
    period: 0,
    p5: initialValue,
    p10: initialValue,
    p25: initialValue,
    p50: initialValue,
    p75: initialValue,
    p90: initialValue,
    p95: initialValue,
  });
  
  // Generate for each year
  for (let year = 1; year <= maxYears; year += (year < 10 ? 1 : 5)) {
    let simResult: MultivariateSimulationResult | null;
    
    if (config && config.choleskyL) {
      simResult = runMultivariateSimulation(
        config,
        initialValue,
        year,
        Math.min(numSimulations, 2000),
        stepsPerYear
      );
    } else {
      simResult = runUnivariateSimulation(
        initialValue,
        annualReturn,
        annualVol,
        year,
        Math.min(numSimulations, 2000),
        stepsPerYear
      );
    }
    
    if (simResult) {
      results.push({
        period: year,
        ...simResult.percentiles,
      });
    }
  }
  
  return results;
}

/**
 * Extract asset parameters from portfolio data
 */
export function extractAssetParameters(
  assetReturns: Record<string, { month: string; return: number }[]>,
  weights: Record<string, number>,
  assetNames: Record<string, string>
): AssetParameters[] {
  const assets: AssetParameters[] = [];
  
  for (const [ticker, returns] of Object.entries(assetReturns)) {
    if (returns.length < 3) continue;
    
    const monthlyReturns = returns.map(r => r.return / 100);  // Convert to decimal
    const stats = calculateStatistics(monthlyReturns);
    
    // Annualize: mean × 12, std × √12
    const annualMean = stats.mean * 12;
    const annualVol = stats.std * Math.sqrt(12);
    
    assets.push({
      ticker,
      name: assetNames[ticker] || ticker,
      weight: weights[ticker] || 0,
      meanReturn: annualMean,
      volatility: annualVol,
      monthsOfData: returns.length,
    });
  }
  
  // Normalize weights to sum to 1
  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight > 0) {
    assets.forEach(a => a.weight = a.weight / totalWeight);
  }
  
  return assets;
}
