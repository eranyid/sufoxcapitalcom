/**
 * Black-Litterman Model Implementation
 * 
 * The Black-Litterman model combines market equilibrium returns with investor views
 * to produce optimal portfolio allocations. This implementation uses:
 * - Reverse optimization to derive market-implied equilibrium returns (Pi)
 * - Dynamic P and Q matrices based on user-defined analyst views
 * - Full matrix algebra using math.js for numerical stability
 * 
 * Master Equation:
 * E[R] = inv(inv(τΣ) + P'inv(Ω)P) × (inv(τΣ)Π + P'inv(Ω)Q)
 * 
 * IMPORTANT UNITS:
 * - All internal calculations use DECIMAL returns (0.05 = 5%)
 * - Covariance matrix is in decimal squared units
 * - Final output converts back to percentage for display
 */

import * as math from 'mathjs';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { calculatePositions, getLatestValuations, calculateAssetMonthlyReturns } from './calculations';

// ============= Types =============

export interface AnalystView {
  id: string;
  asset: string;           // Primary asset ticker
  direction: 'outperform' | 'underperform';
  comparison: 'absolute' | 'relative';
  comparisonAsset?: string; // For relative views
  magnitude: number;        // Expected return/outperformance in % (user input)
  confidence: number;       // 0-100, maps to Omega matrix
}

export interface BlackLittermanInputs {
  tau: number;             // Scalar (typically 0.025-0.05)
  riskAversion: number;    // Delta (typically 2.5-3.5)
  views: AnalystView[];
}

export interface BlackLittermanResult {
  assets: string[];
  marketWeights: number[];
  equilibriumReturns: number[];  // Pi (market-implied returns) in PERCENTAGE
  blReturns: number[];           // Black-Litterman posterior returns in PERCENTAGE
  optimalWeights: number[];      // Optimal weights from BL returns (sum = 1)
  covarianceMatrix: number[][];
  viewImpact: { asset: string; equilibrium: number; posterior: number; delta: number }[];
  validationErrors: string[];
}

// ============= Constants =============
const REGULARIZATION_EPSILON = 1e-8;  // Ridge regularization for near-singular matrices
const MIN_WEIGHT = 0.001;             // Minimum weight threshold (0.1%)
const MAX_ITERATIONS = 100;           // Max iterations for weight projection

// ============= Utility Functions =============

/**
 * Check if a value is valid (not NaN, not Infinity)
 */
function isValidNumber(val: number): boolean {
  return typeof val === 'number' && isFinite(val) && !isNaN(val);
}

/**
 * Validate and sanitize a matrix
 */
function sanitizeMatrix(matrix: number[][]): { valid: boolean; matrix: number[][] } {
  const n = matrix.length;
  const sanitized: number[][] = [];
  let hasInvalid = false;
  
  for (let i = 0; i < n; i++) {
    sanitized[i] = [];
    for (let j = 0; j < matrix[i].length; j++) {
      if (isValidNumber(matrix[i][j])) {
        sanitized[i][j] = matrix[i][j];
      } else {
        sanitized[i][j] = 0;
        hasInvalid = true;
      }
    }
  }
  
  return { valid: !hasInvalid, matrix: sanitized };
}

/**
 * Add ridge regularization to a covariance matrix
 */
function regularizeMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result = matrix.map(row => [...row]);
  
  for (let i = 0; i < n; i++) {
    result[i][i] += REGULARIZATION_EPSILON;
  }
  
  return result;
}

/**
 * Safe matrix inversion with regularization fallback
 */
function safeInverse(matrix: number[][]): number[][] | null {
  try {
    // First attempt: direct inversion
    return math.inv(matrix) as number[][];
  } catch {
    try {
      // Second attempt: with regularization
      const regularized = regularizeMatrix(matrix);
      return math.inv(regularized) as number[][];
    } catch {
      console.error('Matrix inversion failed even with regularization');
      return null;
    }
  }
}

// ============= Matrix Utilities =============

/**
 * Build covariance matrix from aligned monthly returns
 * 
 * CRITICAL: Returns are in PERCENTAGE form from calculateAssetMonthlyReturns
 * We must convert to DECIMAL (divide by 100) before computing covariance
 * 
 * Output: Annualized covariance matrix in DECIMAL squared units
 */
function buildCovarianceMatrix(
  alignedReturns: Record<string, number[]>,
  tickers: string[]
): number[][] {
  const n = tickers.length;
  const T = alignedReturns[tickers[0]].length;
  
  // Convert percentage returns to decimal returns
  const decimalReturns: Record<string, number[]> = {};
  for (const ticker of tickers) {
    decimalReturns[ticker] = alignedReturns[ticker].map(r => r / 100);
  }
  
  // Calculate means (in decimal)
  const means: number[] = [];
  for (const ticker of tickers) {
    means.push(decimalReturns[ticker].reduce((a, b) => a + b, 0) / T);
  }
  
  // Calculate covariance matrix (annualized)
  // Monthly covariance * 12 = Annualized covariance
  const covMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    covMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      let cov = 0;
      for (let t = 0; t < T; t++) {
        cov += (decimalReturns[tickers[i]][t] - means[i]) * 
               (decimalReturns[tickers[j]][t] - means[j]);
      }
      // Sample covariance (T-1) * 12 for annualization
      covMatrix[i][j] = (cov / (T - 1)) * 12;
    }
  }
  
  return covMatrix;
}

/**
 * Calculate market-implied equilibrium returns using reverse optimization
 * Pi = delta * Sigma * w_mkt
 * 
 * Input: Covariance matrix in DECIMAL squared, weights as fractions
 * Output: Returns in DECIMAL form (will be converted to % for display)
 */
function calculateEquilibriumReturns(
  covMatrix: number[][],
  marketWeights: number[],
  riskAversion: number
): number[] {
  // Sigma * w
  const sigmaW = math.multiply(covMatrix, marketWeights) as number[];
  
  // Pi = delta * Sigma * w (result in DECIMAL form)
  const equilibrium = sigmaW.map(v => {
    const val = v * riskAversion;
    return isValidNumber(val) ? val : 0;
  });
  
  return equilibrium;
}

/**
 * Build P matrix from analyst views
 * For relative view (A > B by x%): P row = [0, ..., 1 (A), ..., -1 (B), ..., 0]
 * For absolute view (A = x%): P row = [0, ..., 1 (A), ..., 0]
 */
function buildPMatrix(views: AnalystView[], assets: string[]): number[][] {
  const P: number[][] = [];
  
  for (const view of views) {
    const row = new Array(assets.length).fill(0);
    const primaryIdx = assets.indexOf(view.asset);
    
    if (primaryIdx === -1) continue;
    
    if (view.comparison === 'absolute') {
      row[primaryIdx] = 1;
    } else if (view.comparison === 'relative' && view.comparisonAsset) {
      const compIdx = assets.indexOf(view.comparisonAsset);
      if (compIdx === -1) continue;
      
      if (view.direction === 'outperform') {
        row[primaryIdx] = 1;
        row[compIdx] = -1;
      } else {
        row[primaryIdx] = -1;
        row[compIdx] = 1;
      }
    }
    
    P.push(row);
  }
  
  return P;
}

/**
 * Build Q vector from analyst views (expected returns/outperformance)
 * Input: view.magnitude is in PERCENTAGE (e.g., 5 for 5%)
 * Output: Q in DECIMAL form (e.g., 0.05)
 */
function buildQVector(views: AnalystView[]): number[] {
  return views.map(v => v.magnitude / 100); // Convert percentage to decimal
}

/**
 * Build Omega matrix (diagonal covariance matrix of view uncertainty)
 * Lower confidence = higher variance in Omega
 * Omega_ii = (1/c - 1) * P_i * Σ * P_i' where c = confidence/100
 * 
 * This uses the proportional uncertainty approach from He & Litterman (1999)
 */
function buildOmegaMatrix(
  views: AnalystView[],
  P: number[][],
  covMatrix: number[][],
  tau: number
): number[][] {
  const k = views.length;
  const Omega: number[][] = [];
  
  for (let i = 0; i < k; i++) {
    Omega[i] = new Array(k).fill(0);
    
    // Confidence mapping: 100% confidence -> very small variance
    // Clamp confidence to avoid division by zero or negative values
    const confidence = Math.max(0.05, Math.min(0.95, views[i].confidence / 100));
    const uncertaintyFactor = (1 - confidence) / confidence;
    
    // Calculate view variance: P_i * (tau * Sigma) * P_i'
    const pRow = P[i];
    const tauSigmaP = math.multiply(math.multiply(tau, covMatrix), pRow) as number[];
    const viewVariance = math.dot(pRow, tauSigmaP) as number;
    
    // Omega diagonal = uncertainty * |view_variance| + epsilon
    const omegaValue = uncertaintyFactor * Math.abs(viewVariance) + REGULARIZATION_EPSILON;
    Omega[i][i] = isValidNumber(omegaValue) ? omegaValue : REGULARIZATION_EPSILON;
  }
  
  return Omega;
}

/**
 * Solve the Black-Litterman master equation
 * E[R] = inv(inv(τΣ) + P'inv(Ω)P) × (inv(τΣ)Π + P'inv(Ω)Q)
 * 
 * All inputs are in DECIMAL form
 * Output: Returns in DECIMAL form
 */
function solveBlackLitterman(
  covMatrix: number[][],
  equilibriumReturns: number[],  // Already in decimal
  P: number[][],
  Q: number[],                    // Already in decimal
  Omega: number[][],
  tau: number
): { returns: number[]; errors: string[] } {
  const errors: string[] = [];
  
  // If no views, return equilibrium
  if (P.length === 0) {
    return { returns: equilibriumReturns, errors };
  }
  
  try {
    // τΣ
    const tauSigma = math.multiply(tau, covMatrix) as number[][];
    
    // inv(τΣ) with regularization
    const invTauSigma = safeInverse(regularizeMatrix(tauSigma));
    if (!invTauSigma) {
      errors.push('Failed to invert tau*Sigma matrix');
      return { returns: equilibriumReturns, errors };
    }
    
    // inv(Ω)
    const invOmega = safeInverse(Omega);
    if (!invOmega) {
      errors.push('Failed to invert Omega matrix');
      return { returns: equilibriumReturns, errors };
    }
    
    // P' (transpose of P)
    const Pt = math.transpose(P) as number[][];
    
    // P' * inv(Ω) * P
    const PtInvOmega = math.multiply(Pt, invOmega) as number[][];
    const PtInvOmegaP = math.multiply(PtInvOmega, P) as number[][];
    
    // Left side: inv(inv(τΣ) + P'inv(Ω)P)
    const leftMatrix = math.add(invTauSigma, PtInvOmegaP) as number[][];
    const leftInv = safeInverse(leftMatrix);
    if (!leftInv) {
      errors.push('Failed to invert combined matrix');
      return { returns: equilibriumReturns, errors };
    }
    
    // inv(τΣ) * Π (Pi already in decimal)
    const invTauSigmaPi = math.multiply(invTauSigma, equilibriumReturns) as number[];
    
    // P' * inv(Ω) * Q (Q already in decimal)
    const PtInvOmegaQ = math.multiply(math.multiply(Pt, invOmega), Q) as number[];
    
    // Right side: inv(τΣ)Π + P'inv(Ω)Q
    const rightVector = math.add(invTauSigmaPi, PtInvOmegaQ) as number[];
    
    // Final: left * right
    const blReturns = math.multiply(leftInv, rightVector) as number[];
    
    // Validate results
    const validatedReturns = blReturns.map((r, i) => {
      if (!isValidNumber(r)) {
        errors.push(`Invalid return for asset ${i}`);
        return equilibriumReturns[i];
      }
      // Clamp extreme values (beyond +/- 200% annual return)
      return Math.max(-2, Math.min(2, r));
    });
    
    return { returns: validatedReturns, errors };
  } catch (error) {
    console.error('Black-Litterman calculation error:', error);
    errors.push('Matrix calculation error');
    return { returns: equilibriumReturns, errors };
  }
}

/**
 * Calculate optimal weights from Black-Litterman returns
 * w* = (1/delta) * inv(Σ) * E[R]
 * 
 * Then project to long-only simplex (weights >= 0, sum = 1)
 */
function calculateOptimalWeights(
  covMatrix: number[][],
  blReturns: number[],  // In decimal form
  riskAversion: number
): { weights: number[]; constrained: boolean } {
  const n = blReturns.length;
  
  try {
    const invSigma = safeInverse(regularizeMatrix(covMatrix));
    if (!invSigma) {
      // Fallback to equal weights
      return { weights: new Array(n).fill(1 / n), constrained: true };
    }
    
    // Raw unconstrained weights: (1/delta) * inv(Sigma) * E[R]
    const rawWeights = math.multiply(invSigma, blReturns) as number[];
    const scaledWeights = rawWeights.map(w => w / riskAversion);
    
    // Project to long-only simplex
    const projectedWeights = projectToSimplex(scaledWeights);
    
    // Check if projection was needed
    const wasConstrained = scaledWeights.some(w => w < 0) || 
                          Math.abs(scaledWeights.reduce((a, b) => a + b, 0) - 1) > 0.01;
    
    return { weights: projectedWeights, constrained: wasConstrained };
  } catch (error) {
    console.error('Weight optimization error:', error);
    return { weights: new Array(n).fill(1 / n), constrained: true };
  }
}

/**
 * Project a vector onto the probability simplex (non-negative, sum = 1)
 * Uses the algorithm from "Efficient Projections onto the l1-Ball" by Duchi et al.
 */
function projectToSimplex(v: number[]): number[] {
  const n = v.length;
  
  // Sort in descending order
  const sorted = [...v].sort((a, b) => b - a);
  
  // Find the threshold
  let cumSum = 0;
  let rho = 0;
  
  for (let j = 0; j < n; j++) {
    cumSum += sorted[j];
    if (sorted[j] + (1 - cumSum) / (j + 1) > 0) {
      rho = j + 1;
    }
  }
  
  // Calculate threshold
  const theta = (sorted.slice(0, rho).reduce((a, b) => a + b, 0) - 1) / rho;
  
  // Project
  const projected = v.map(vi => Math.max(0, vi - theta));
  
  // Normalize to ensure sum = 1 (handle numerical errors)
  const sum = projected.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    return projected.map(w => w / sum);
  }
  
  // Fallback to equal weights
  return new Array(n).fill(1 / n);
}

// ============= Main Function =============

export function calculateBlackLitterman(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  inputs: BlackLittermanInputs
): BlackLittermanResult {
  const validationErrors: string[] = [];
  const { tau, riskAversion, views } = inputs;
  
  // Validate inputs
  if (tau <= 0 || tau > 0.5) {
    validationErrors.push(`Tau (${tau}) should be between 0.01 and 0.5`);
  }
  if (riskAversion <= 0 || riskAversion > 10) {
    validationErrors.push(`Risk aversion (${riskAversion}) should be between 0.5 and 10`);
  }
  
  // Get current positions and returns
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  
  // Filter assets with sufficient data
  const minMonths = 6;
  const tickers = Object.keys(assetReturns).filter(t => {
    const returns = assetReturns[t];
    if (!returns || returns.length < minMonths) {
      return false;
    }
    return true;
  });
  
  if (tickers.length < 2) {
    validationErrors.push('Need at least 2 assets with sufficient price history (6+ months)');
    return {
      assets: [],
      marketWeights: [],
      equilibriumReturns: [],
      blReturns: [],
      optimalWeights: [],
      covarianceMatrix: [],
      viewImpact: [],
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
    validationErrors.push(`Insufficient overlapping price history (${commonMonths.length} months, need ${minMonths}+)`);
    return {
      assets: tickers,
      marketWeights: [],
      equilibriumReturns: [],
      blReturns: [],
      optimalWeights: [],
      covarianceMatrix: [],
      viewImpact: [],
      validationErrors
    };
  }
  
  // Align returns (still in PERCENTAGE from source)
  const alignedReturns: Record<string, number[]> = {};
  for (const ticker of tickers) {
    alignedReturns[ticker] = commonMonths.map(month => {
      const ret = assetReturns[ticker].find(r => r.month === month);
      return ret ? ret.return : 0;  // In percentage
    });
  }
  
  // Build covariance matrix (converts to DECIMAL internally)
  const covMatrix = buildCovarianceMatrix(alignedReturns, tickers);
  
  // Sanitize covariance matrix
  const { valid: covValid, matrix: sanitizedCov } = sanitizeMatrix(covMatrix);
  if (!covValid) {
    validationErrors.push('Covariance matrix contains invalid values (NaN/Infinity)');
  }
  
  // Calculate market weights from current positions
  let totalValue = 0;
  const positionValues: Record<string, number> = {};
  
  for (const ticker of tickers) {
    const pos = positions[ticker];
    const val = latestVals[ticker];
    if (pos && val && pos.quantity > 0) {
      const value = pos.quantity * val.pricePerUnit;
      positionValues[ticker] = value;
      totalValue += value;
    } else {
      positionValues[ticker] = 0;
    }
  }
  
  const marketWeights = tickers.map(t => 
    totalValue > 0 ? (positionValues[t] || 0) / totalValue : 1 / tickers.length
  );
  
  // Calculate equilibrium returns (Pi) in DECIMAL form
  const equilibriumReturnsDecimal = calculateEquilibriumReturns(
    sanitizedCov, 
    marketWeights, 
    riskAversion
  );
  
  // Filter valid views (only those with assets in our universe)
  const validViews = views.filter(v => {
    const hasAsset = tickers.includes(v.asset);
    const hasComparison = v.comparison === 'absolute' || 
      (v.comparisonAsset && tickers.includes(v.comparisonAsset));
    
    if (!hasAsset) {
      validationErrors.push(`View asset "${v.asset}" not in portfolio`);
    }
    if (v.comparison === 'relative' && v.comparisonAsset && !tickers.includes(v.comparisonAsset)) {
      validationErrors.push(`Comparison asset "${v.comparisonAsset}" not in portfolio`);
    }
    
    return hasAsset && hasComparison;
  });
  
  // Build P, Q, and Omega matrices (all in DECIMAL form)
  const P = buildPMatrix(validViews, tickers);
  const Q = buildQVector(validViews);
  const Omega = validViews.length > 0 
    ? buildOmegaMatrix(validViews, P, sanitizedCov, tau)
    : [];
  
  // Solve Black-Litterman (all in DECIMAL)
  const { returns: blReturnsDecimal, errors: blErrors } = solveBlackLitterman(
    sanitizedCov, 
    equilibriumReturnsDecimal, 
    P, 
    Q, 
    Omega, 
    tau
  );
  validationErrors.push(...blErrors);
  
  // Calculate optimal weights
  const { weights: optimalWeights, constrained } = calculateOptimalWeights(
    sanitizedCov, 
    blReturnsDecimal, 
    riskAversion
  );
  
  if (constrained) {
    validationErrors.push('Weights constrained to long-only (non-negative)');
  }
  
  // Convert returns to PERCENTAGE for display
  const equilibriumReturnsPercent = equilibriumReturnsDecimal.map(r => r * 100);
  const blReturnsPercent = blReturnsDecimal.map(r => r * 100);
  
  // Calculate view impact
  const viewImpact = tickers.map((asset, i) => ({
    asset,
    equilibrium: equilibriumReturnsPercent[i],
    posterior: blReturnsPercent[i],
    delta: blReturnsPercent[i] - equilibriumReturnsPercent[i]
  }));
  
  return {
    assets: tickers,
    marketWeights,
    equilibriumReturns: equilibriumReturnsPercent,
    blReturns: blReturnsPercent,
    optimalWeights,
    covarianceMatrix: covMatrix,
    viewImpact,
    validationErrors: validationErrors.filter(e => !e.includes('constrained')) // Don't show constraint warning as error
  };
}

/**
 * Get list of available assets for view selection
 */
export function getAvailableAssets(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): { ticker: string; name: string }[] {
  const assetReturns = calculateAssetMonthlyReturns(transactions, valuations);
  const positions = calculatePositions(transactions);
  
  const minMonths = 6;
  const tickers = Object.keys(assetReturns).filter(t => {
    const returns = assetReturns[t];
    return returns && returns.length >= minMonths;
  });
  
  return tickers.map(ticker => {
    const txs = transactions.filter(t => t.ticker === ticker);
    const name = txs.length > 0 ? txs[0].assetName : ticker;
    return { ticker, name };
  });
}
