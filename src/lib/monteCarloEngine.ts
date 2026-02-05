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
 * - Full log-space simulation for numerical stability
 * - Comprehensive bounds checking and failure diagnostics
 * 
 * Formula: logS_i(t+1) = logS_i(t) + (μ_i - 0.5σ_i²)Δt + σ_i√Δt × ε_i
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

// ============================================
// SIMULATION DIAGNOSTICS & ERROR TYPES
// ============================================

export interface SimulationDiagnostics {
  discardedPaths: number;
  cappedPaths: number;
  totalPaths: number;
  appliedCaps: {
    meanReturnCapped: boolean;
    volatilityCapped: boolean;
    dispersionCapped: boolean;
    originalMean?: number;
    originalVol?: number;
    originalDispersion?: number;
  };
  warnings: string[];
}

export interface SimulationError {
  status: 'unstable_simulation' | 'invalid_parameters' | 'insufficient_data';
  reason: string;
  diagnostics: {
    discardedPaths?: number;
    totalPaths?: number;
    inputParameters?: {
      meanReturn: number;
      volatility: number;
      years: number;
      numSimulations: number;
    };
  };
}

// ============================================
// STRUCTURED ERROR TYPES (INSTITUTIONAL-GRADE)
// ============================================

export type SimulationErrorCode = 
  | 'EXCESSIVE_DISPERSION'
  | 'INVALID_PARAMETERS'
  | 'INSUFFICIENT_DATA'
  | 'BROKEN_TIME_RECURRENCE'
  | 'PATH_FAILURE_EXCEEDED'
  | 'NUMERICAL_OVERFLOW'
  | 'CONTEXT_SCOPE_VIOLATION';

export interface StructuredSimulationError {
  code: SimulationErrorCode;
  message: string;
  diagnostics: {
    inputParameters?: {
      meanReturn: number;
      volatility: number;
      years: number;
      numSimulations: number;
      dispersion?: number;
    };
    pathMetrics?: {
      discardedPaths: number;
      flatPaths: number;
      totalPaths: number;
      failureRate: number;
    };
    context?: {
      scope: string;
      clientId: string | null;
    };
  };
}

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
  diagnostics: SimulationDiagnostics;
  isStabilized: boolean;  // True if parameters were auto-adjusted
}

// ============================================
// NUMERICAL STABILITY GUARDS (INSTITUTIONAL)
// ============================================

/** Maximum allowed log return per step (±50% per period) */
const MAX_LOG_RETURN_PER_STEP = 0.5;

/** Log-space bounds: logS ∈ [-30, +30] → S ∈ [~1e-13, ~1e13] */
const LOG_VALUE_MAX = 30;
const LOG_VALUE_MIN = -30;

/** Level-space bounds derived from log bounds */
const LEVEL_VALUE_MAX = Math.exp(LOG_VALUE_MAX);
const LEVEL_VALUE_MIN = Math.exp(LOG_VALUE_MIN);

/** Maximum dispersion: σ × √T ≤ 10 */
const MAX_DISPERSION = 10.0;

/** Z-score truncation bounds for normal draws */
const MAX_Z_SCORE = 8.0;

/** Maximum allowed path failure rate (2%) */
const MAX_PATH_FAILURE_RATE = 0.02;

/** Minimum change threshold for flat path detection */
const FLAT_PATH_THRESHOLD = 1e-12;

/** Input parameter bounds */
const PARAM_BOUNDS = {
  meanReturn: { min: -0.90, max: 2.00 },      // -90% to +200% annualized
  volatility: { min: 0.001, max: 3.00 },       // 0.1% to 300% annualized
  years: { min: 1, max: 100 },
  numSimulations: { min: 100, max: 200000 },
  stepsPerYear: { min: 1, max: 252 },
};

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Check if a number is valid (finite and not NaN) */
function isValidNumber(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

// ============================================
// PRE-SIMULATION VALIDATION (STEP 1)
// ============================================

/**
 * Validate all simulation parameters BEFORE any simulation starts.
 * Returns structured error if validation fails, null if valid.
 * CRITICAL: This is the gatekeeper - no simulation runs without passing this.
 */
export function validateSimulationParameters(
  meanReturn: number,
  volatility: number,
  years: number,
  numSimulations: number,
  stepsPerYear: number = 12
): StructuredSimulationError | null {
  // Check for NaN/undefined/non-finite
  if (!isValidNumber(meanReturn)) {
    return {
      code: 'INVALID_PARAMETERS',
      message: 'Mean return is not a valid finite number',
      diagnostics: {
        inputParameters: { meanReturn, volatility, years, numSimulations }
      }
    };
  }
  
  if (!isValidNumber(volatility)) {
    return {
      code: 'INVALID_PARAMETERS',
      message: 'Volatility is not a valid finite number',
      diagnostics: {
        inputParameters: { meanReturn, volatility, years, numSimulations }
      }
    };
  }
  
  if (!isValidNumber(years) || years < PARAM_BOUNDS.years.min || years > PARAM_BOUNDS.years.max) {
    return {
      code: 'INVALID_PARAMETERS',
      message: `Years must be between ${PARAM_BOUNDS.years.min} and ${PARAM_BOUNDS.years.max}`,
      diagnostics: {
        inputParameters: { meanReturn, volatility, years, numSimulations }
      }
    };
  }
  
  if (!isValidNumber(numSimulations) || numSimulations < PARAM_BOUNDS.numSimulations.min || numSimulations > PARAM_BOUNDS.numSimulations.max) {
    return {
      code: 'INVALID_PARAMETERS',
      message: `Number of simulations must be between ${PARAM_BOUNDS.numSimulations.min} and ${PARAM_BOUNDS.numSimulations.max}`,
      diagnostics: {
        inputParameters: { meanReturn, volatility, years, numSimulations }
      }
    };
  }
  
  if (!isValidNumber(stepsPerYear) || stepsPerYear < PARAM_BOUNDS.stepsPerYear.min || stepsPerYear > PARAM_BOUNDS.stepsPerYear.max) {
    return {
      code: 'INVALID_PARAMETERS',
      message: `Steps per year must be between ${PARAM_BOUNDS.stepsPerYear.min} and ${PARAM_BOUNDS.stepsPerYear.max}`,
      diagnostics: {
        inputParameters: { meanReturn, volatility, years, numSimulations }
      }
    };
  }
  
  // Check dispersion: σ × √T > MAX_DISPERSION is EXCESSIVE
  const dispersion = volatility * Math.sqrt(years);
  if (dispersion > MAX_DISPERSION) {
    return {
      code: 'EXCESSIVE_DISPERSION',
      message: `Dispersion σ×√T = ${dispersion.toFixed(2)} exceeds maximum ${MAX_DISPERSION}. Reduce volatility or horizon.`,
      diagnostics: {
        inputParameters: { meanReturn, volatility, years, numSimulations, dispersion }
      }
    };
  }
  
  return null; // Valid
}

/**
 * Type guard to check if simulation result is a structured error
 */
export function isStructuredError<T>(
  result: T | StructuredSimulationError | null
): result is StructuredSimulationError {
  return result !== null && typeof result === 'object' && 'code' in result && 'message' in result;
}

// ============================================
// SAFE RANDOM NUMBER GENERATION
// ============================================

/**
 * Safe Box-Muller transform for generating standard normal random numbers
 * N(0,1) distribution with guards against log(0) and Z-score truncation
 */
export function generateNormalRandom(): number {
  // Ensure u1 is never 0 or 1 to prevent log(0) and boundary issues
  const epsilon = 1e-10;
  let u1 = Math.random();
  let u2 = Math.random();
  
  // Guard against exact 0 or 1
  u1 = Math.max(epsilon, Math.min(1 - epsilon, u1));
  u2 = Math.max(epsilon, Math.min(1 - epsilon, u2));
  
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  // Truncate to [-8, +8] as per institutional requirements
  return clamp(z, -MAX_Z_SCORE, MAX_Z_SCORE);
}

/** Generate N independent standard normal random variables (truncated) */
export function generateIndependentNormals(n: number): number[] {
  return Array.from({ length: n }, () => generateNormalRandom());
}

/** Seeded pseudo-random number generator (Mulberry32) for reproducibility */
export function createSeededRNG(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded normal random generator with truncation */
export function createSeededNormalRNG(seed: number): () => number {
  const rng = createSeededRNG(seed);
  return () => {
    const epsilon = 1e-10;
    const u1 = Math.max(epsilon, Math.min(1 - epsilon, rng()));
    const u2 = Math.max(epsilon, Math.min(1 - epsilon, rng()));
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return clamp(z, -MAX_Z_SCORE, MAX_Z_SCORE);
  };
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
 * Run Multivariate Monte Carlo Simulation in Log-Space
 * 
 * Uses Cholesky decomposition to generate correlated asset returns,
 * then aggregates to portfolio level.
 * All calculations performed in log-space for numerical stability.
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
): MultivariateSimulationResult | StructuredSimulationError | null {
  const { assets, choleskyL, rebalancing } = config;
  const n = assets.length;
  
  if (n === 0 || !choleskyL) {
    return null;
  }
  
  // Clamp simulation parameters
  const clampedYears = clamp(Math.round(years), PARAM_BOUNDS.years.min, PARAM_BOUNDS.years.max);
  const clampedSims = clamp(Math.round(numSimulations), PARAM_BOUNDS.numSimulations.min, PARAM_BOUNDS.numSimulations.max);
  
  const totalSteps = clampedYears * stepsPerYear;
  const dt = 1 / stepsPerYear;  // Time step as fraction of year
  const sqrtDt = Math.sqrt(dt);
  
  // Per-asset parameters with dispersion guard
  const rawMeans = assets.map(a => a.meanReturn);
  const rawVols = assets.map(a => a.volatility);
  
  // Apply parameter bounds and dispersion guard
  const means = rawMeans.map(m => clamp(m, PARAM_BOUNDS.meanReturn.min, PARAM_BOUNDS.meanReturn.max));
  const vols = rawVols.map((v, i) => {
    let clampedVol = clamp(v, PARAM_BOUNDS.volatility.min, PARAM_BOUNDS.volatility.max);
    // Apply dispersion guard: σ × √T ≤ 6
    const dispersion = clampedVol * Math.sqrt(clampedYears);
    if (dispersion > MAX_DISPERSION) {
      clampedVol = MAX_DISPERSION / Math.sqrt(clampedYears);
    }
    return clampedVol;
  });
  const weights = assets.map(a => a.weight);
  
  // Value bounds in log-space
  const logMaxValue = LOG_VALUE_MAX;
  const logMinValue = LOG_VALUE_MIN;
  const levelMaxValue = LEVEL_VALUE_MAX;
  const levelMinValue = LEVEL_VALUE_MIN;
  
  // Track diagnostics
  let discardedPaths = 0;
  let cappedPaths = 0;
  let flatPaths = 0;
  
  const portfolioPaths: number[][] = [];
  const finalValues: number[] = [];
  
  // Run simulations
  for (let sim = 0; sim < clampedSims; sim++) {
    // Initialize in LOG-SPACE
    let logAssetValues = weights.map(w => Math.log(Math.max(initialValue * w, 1e-15)));
    const portfolioPath: number[] = [initialValue];
    let isPathValid = true;
    let isPathCapped = false;
    let previousPortfolioValue = initialValue;
    let unchangedSteps = 0;
    
    for (let step = 0; step < totalSteps && isPathValid; step++) {
      // Generate correlated random shocks
      const Z = generateIndependentNormals(n);
      const epsilon = matrixVectorMultiply(choleskyL, Z);
      
      // Update each asset in LOG-SPACE using GBM
      for (let i = 0; i < n; i++) {
        // GBM with Itô correction: r = (μ - 0.5σ²)dt + σ√dt × ε
        const drift = (means[i] - 0.5 * vols[i] * vols[i]) * dt;
        const diffusion = vols[i] * sqrtDt * epsilon[i];
        
        // Clamp log return to prevent extreme moves
        const logReturn = clamp(drift + diffusion, -MAX_LOG_RETURN_PER_STEP, MAX_LOG_RETURN_PER_STEP);
        
        // LOG-SPACE UPDATE: logS[t+1] = logS[t] + logReturn
        let newLogValue = logAssetValues[i] + logReturn;
        
        // Guard against invalid values
        if (!isValidNumber(newLogValue)) {
          isPathValid = false;
          break;
        }
        
        // Apply bounds in log-space
        if (newLogValue > logMaxValue || newLogValue < logMinValue) {
          newLogValue = clamp(newLogValue, logMinValue, logMaxValue);
          isPathCapped = true;
        }
        
        logAssetValues[i] = newLogValue;
      }
      
      if (!isPathValid) break;
      
      // Calculate current portfolio value for flat path detection
      const currentAssetValues = logAssetValues.map(lv => Math.exp(lv));
      const currentPortfolioValue = currentAssetValues.reduce((a, b) => a + b, 0);
      
      // FLAT PATH DETECTION: Check if values changed
      if (Math.abs(currentPortfolioValue - previousPortfolioValue) < FLAT_PATH_THRESHOLD * Math.max(previousPortfolioValue, 1)) {
        unchangedSteps++;
      } else {
        unchangedSteps = 0;
      }
      previousPortfolioValue = currentPortfolioValue;
      
      // Rebalancing logic
      if (rebalancing === 'constant') {
        // Convert to level, sum, then back to log for rebalancing
        const assetLevelValues = logAssetValues.map(lv => Math.exp(lv));
        const totalValue = assetLevelValues.reduce((a, b) => a + b, 0);
        const clampedTotal = clamp(totalValue, levelMinValue, levelMaxValue);
        logAssetValues = weights.map(w => Math.log(Math.max(clampedTotal * w, 1e-15)));
      }
      
      // Record portfolio value at yearly intervals
      if ((step + 1) % stepsPerYear === 0) {
        const assetLevelValues = logAssetValues.map(lv => Math.exp(lv));
        const portfolioValue = clamp(assetLevelValues.reduce((a, b) => a + b, 0), levelMinValue, levelMaxValue);
        portfolioPath.push(portfolioValue);
      }
    }
    
    // Check for flat path (more than 10% of steps unchanged when vol > 0)
    const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
    if (avgVol > 0.001 && unchangedSteps > totalSteps * 0.1) {
      flatPaths++;
      isPathValid = false;
    }
    
    // Only include valid paths
    if (isPathValid) {
      const assetLevelValues = logAssetValues.map(lv => Math.exp(lv));
      const finalValue = clamp(assetLevelValues.reduce((a, b) => a + b, 0), levelMinValue, levelMaxValue);
      // Fill missing yearly values if path was cut short
      while (portfolioPath.length < clampedYears + 1) {
        portfolioPath.push(portfolioPath[portfolioPath.length - 1]);
      }
      portfolioPaths.push(portfolioPath);
      finalValues.push(finalValue);
      if (isPathCapped) cappedPaths++;
    } else {
      discardedPaths++;
    }
  }
  
  // Check path failure rate (2% threshold)
  const failureRate = discardedPaths / clampedSims;
  if (failureRate > MAX_PATH_FAILURE_RATE) {
    // FAIL LOUDLY - return structured error
    return {
      code: 'PATH_FAILURE_EXCEEDED' as SimulationErrorCode,
      message: `Path failure rate ${(failureRate * 100).toFixed(1)}% exceeds maximum ${(MAX_PATH_FAILURE_RATE * 100).toFixed(0)}%`,
      diagnostics: {
        pathMetrics: {
          discardedPaths,
          flatPaths,
          totalPaths: clampedSims,
          failureRate
        }
      }
    } as StructuredSimulationError;
  }
  
  // Check for flat paths specifically - this indicates broken stochastic process
  if (flatPaths > clampedSims * 0.01) {
    return {
      code: 'BROKEN_TIME_RECURRENCE' as SimulationErrorCode,
      message: `Detected ${flatPaths} flat paths (${((flatPaths/clampedSims)*100).toFixed(1)}%) - stochastic process not evolving correctly`,
      diagnostics: {
        pathMetrics: {
          discardedPaths,
          flatPaths,
          totalPaths: clampedSims,
          failureRate
        }
      }
    } as StructuredSimulationError;
  }
  
  // Guard against empty results
  if (finalValues.length === 0) {
    return {
      code: 'PATH_FAILURE_EXCEEDED' as SimulationErrorCode,
      message: 'No valid paths produced - all simulations failed',
      diagnostics: {
        pathMetrics: {
          discardedPaths,
          flatPaths,
          totalPaths: clampedSims,
          failureRate: 1.0
        }
      }
    } as StructuredSimulationError;
  }
  
  // Build diagnostics
  const anyCapped = rawMeans.some((m, i) => m !== means[i]) || rawVols.some((v, i) => v !== vols[i]);
  const diagnostics: SimulationDiagnostics = {
    discardedPaths,
    cappedPaths,
    totalPaths: clampedSims,
    appliedCaps: {
      meanReturnCapped: rawMeans.some((m, i) => m !== means[i]),
      volatilityCapped: rawVols.some((v, i) => v !== vols[i]),
      dispersionCapped: rawVols.some((v, i) => {
        const dispersion = v * Math.sqrt(clampedYears);
        return dispersion > MAX_DISPERSION;
      }),
    },
    warnings: [],
  };
  
  if (diagnostics.appliedCaps.dispersionCapped) {
    diagnostics.warnings.push('Volatility reduced to maintain numerical stability (dispersion cap applied)');
  }
  if (cappedPaths > 0) {
    diagnostics.warnings.push(`${cappedPaths} paths hit value bounds and were capped`);
  }
  if (flatPaths > 0) {
    diagnostics.warnings.push(`${flatPaths} paths showed flat evolution and were discarded`);
  }
  
  const isStabilized = anyCapped || cappedPaths > 0;
  
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
  const individualVars = assets.map((a, i) => 1.645 * vols[i] * Math.sqrt(clampedYears));
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
    diagnostics,
    isStabilized,
  };
}

/**
 * Run Univariate Monte Carlo Simulation in Log-Space (Portfolio-Level)
 * 
 * Fallback when multivariate is not possible.
 * Simulates the portfolio as a single entity.
 * All calculations performed in log-space for numerical stability.
 */
export function runUnivariateSimulation(
  initialValue: number,
  annualReturn: number,
  annualVol: number,
  years: number,
  numSimulations: number = 10000,
  stepsPerYear: number = 12
): MultivariateSimulationResult {
  // Clamp simulation parameters
  const clampedYears = clamp(Math.round(years), PARAM_BOUNDS.years.min, PARAM_BOUNDS.years.max);
  const clampedSims = clamp(Math.round(numSimulations), PARAM_BOUNDS.numSimulations.min, PARAM_BOUNDS.numSimulations.max);
  
  const totalSteps = clampedYears * stepsPerYear;
  const dt = 1 / stepsPerYear;
  const sqrtDt = Math.sqrt(dt);
  
  // Clamp inputs with institutional bounds
  const clampedReturn = clamp(annualReturn, PARAM_BOUNDS.meanReturn.min, PARAM_BOUNDS.meanReturn.max);
  let clampedVol = clamp(annualVol, PARAM_BOUNDS.volatility.min, PARAM_BOUNDS.volatility.max);
  
  // Apply dispersion guard: σ × √T ≤ 6
  const originalDispersion = clampedVol * Math.sqrt(clampedYears);
  const dispersionCapped = originalDispersion > MAX_DISPERSION;
  if (dispersionCapped) {
    clampedVol = MAX_DISPERSION / Math.sqrt(clampedYears);
  }
  
  const drift = (clampedReturn - 0.5 * clampedVol * clampedVol) * dt;
  const diffusion = clampedVol * sqrtDt;
  
  // Value bounds in log-space
  const logMaxValue = LOG_VALUE_MAX;
  const logMinValue = LOG_VALUE_MIN;
  const logInitial = Math.log(initialValue);
  
  // Track diagnostics
  let discardedPaths = 0;
  let cappedPaths = 0;
  
  const portfolioPaths: number[][] = [];
  const finalValues: number[] = [];
  
  for (let sim = 0; sim < clampedSims; sim++) {
    // Initialize in LOG-SPACE
    let logValue = logInitial;
    const path: number[] = [initialValue];
    let isPathValid = true;
    let isPathCapped = false;
    
    for (let step = 0; step < totalSteps && isPathValid; step++) {
      const z = generateNormalRandom();
      // Clamp log return to prevent extreme moves
      const logReturn = clamp(drift + diffusion * z, -MAX_LOG_RETURN_PER_STEP, MAX_LOG_RETURN_PER_STEP);
      
      // LOG-SPACE UPDATE: logS[t+1] = logS[t] + logReturn
      let newLogValue = logValue + logReturn;
      
      // Guard against invalid values
      if (!isValidNumber(newLogValue)) {
        isPathValid = false;
        break;
      }
      
      // Apply bounds in log-space
      if (newLogValue > logMaxValue || newLogValue < logMinValue) {
        newLogValue = clamp(newLogValue, logMinValue, logMaxValue);
        isPathCapped = true;
      }
      
      logValue = newLogValue;
      
      if ((step + 1) % stepsPerYear === 0) {
        path.push(Math.exp(logValue));
      }
    }
    
    if (isPathValid) {
      const finalValue = Math.exp(logValue);
      
      // Fill missing values
      while (path.length < clampedYears + 1) {
        path.push(path[path.length - 1]);
      }
      
      portfolioPaths.push(path);
      finalValues.push(finalValue);
      if (isPathCapped) cappedPaths++;
    } else {
      discardedPaths++;
    }
  }
  
  // If too many paths failed, still return but log warning
  const failureRate = discardedPaths / clampedSims;
  if (failureRate > MAX_PATH_FAILURE_RATE) {
    console.warn(`Monte Carlo univariate: ${(failureRate * 100).toFixed(1)}% path failure rate`);
  }
  
  // Check if parameters were capped
  const meanCapped = annualReturn !== clampedReturn;
  const volCapped = annualVol !== clampedVol;
  
  // Build diagnostics
  const diagnostics: SimulationDiagnostics = {
    discardedPaths,
    cappedPaths,
    totalPaths: clampedSims,
    appliedCaps: { 
      meanReturnCapped: meanCapped, 
      volatilityCapped: volCapped, 
      dispersionCapped,
      originalMean: meanCapped ? annualReturn : undefined,
      originalVol: volCapped ? annualVol : undefined,
      originalDispersion: dispersionCapped ? originalDispersion : undefined,
    },
    warnings: [],
  };
  
  if (dispersionCapped) {
    diagnostics.warnings.push(`Volatility reduced to maintain numerical stability (dispersion was ${originalDispersion.toFixed(2)}, capped to ${MAX_DISPERSION})`);
  }
  if (meanCapped) {
    diagnostics.warnings.push('Mean return clamped to valid range [-90%, +200%]');
  }
  if (cappedPaths > 0) {
    diagnostics.warnings.push(`${cappedPaths} paths hit value bounds and were capped`);
  }
  
  const isStabilized = meanCapped || volCapped || dispersionCapped || cappedPaths > 0;
  
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
    diagnostics,
    isStabilized,
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
    let simResult: MultivariateSimulationResult | StructuredSimulationError | null;
    
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
    
    // Only use valid results, skip errors
    if (simResult && !isStructuredError(simResult)) {
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

/**
 * Type guard to check if simulation result is an error
 */
export function isSimulationError(
  result: MultivariateSimulationResult | SimulationError | null
): result is SimulationError {
  return result !== null && 'status' in result && 'reason' in result;
}

/**
 * Validate simulation parameters and return stabilization info
 * Used by UI to show warnings about parameter adjustments
 */
export function validateAndStabilizeParams(
  meanReturn: number,
  volatility: number,
  years: number
): {
  stabilizedMean: number;
  stabilizedVol: number;
  stabilizedYears: number;
  wasStabilized: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Clamp years
  const stabilizedYears = clamp(Math.round(years), PARAM_BOUNDS.years.min, PARAM_BOUNDS.years.max);
  if (years !== stabilizedYears) {
    warnings.push(`Horizon clamped to ${stabilizedYears} years (max: ${PARAM_BOUNDS.years.max})`);
  }
  
  // Clamp mean return
  const stabilizedMean = clamp(meanReturn, PARAM_BOUNDS.meanReturn.min, PARAM_BOUNDS.meanReturn.max);
  if (meanReturn !== stabilizedMean) {
    warnings.push(`Mean return clamped to ${(stabilizedMean * 100).toFixed(0)}% (range: -90% to +200%)`);
  }
  
  // Clamp volatility with dispersion guard
  let stabilizedVol = clamp(volatility, PARAM_BOUNDS.volatility.min, PARAM_BOUNDS.volatility.max);
  const dispersion = stabilizedVol * Math.sqrt(stabilizedYears);
  if (dispersion > MAX_DISPERSION) {
    stabilizedVol = MAX_DISPERSION / Math.sqrt(stabilizedYears);
    warnings.push(`Volatility reduced to ${(stabilizedVol * 100).toFixed(0)}% for numerical stability (dispersion cap: σ×√T ≤ ${MAX_DISPERSION})`);
  } else if (volatility !== stabilizedVol) {
    warnings.push(`Volatility clamped to ${(stabilizedVol * 100).toFixed(0)}% (range: 0.1% to 300%)`);
  }
  
  return {
    stabilizedMean,
    stabilizedVol,
    stabilizedYears,
    wasStabilized: warnings.length > 0,
    warnings,
  };
}
