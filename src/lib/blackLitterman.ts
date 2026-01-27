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
  magnitude: number;        // Expected return/outperformance in %
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
  equilibriumReturns: number[];  // Pi (market-implied returns)
  blReturns: number[];           // Black-Litterman posterior returns
  optimalWeights: number[];      // Optimal weights from BL returns
  covarianceMatrix: number[][];
  viewImpact: { asset: string; equilibrium: number; posterior: number; delta: number }[];
  validationErrors: string[];
}

// ============= Matrix Utilities =============

/**
 * Build covariance matrix from aligned monthly returns
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
 * Calculate market-implied equilibrium returns using reverse optimization
 * Pi = delta * Sigma * w_mkt
 */
function calculateEquilibriumReturns(
  covMatrix: number[][],
  marketWeights: number[],
  riskAversion: number
): number[] {
  const sigmaW = math.multiply(covMatrix, marketWeights) as number[];
  return sigmaW.map(v => v * riskAversion * 100); // Convert to percentage
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
 */
function buildQVector(views: AnalystView[]): number[] {
  return views.map(v => v.magnitude / 100); // Convert percentage to decimal
}

/**
 * Build Omega matrix (diagonal covariance matrix of view uncertainty)
 * Lower confidence = higher variance in Omega
 * Omega_ii = (1/c - 1) * P_i * Σ * P_i'
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
    // 0% confidence -> very large variance
    const confidence = Math.max(0.01, Math.min(0.99, views[i].confidence / 100));
    const uncertaintyFactor = (1 - confidence) / confidence;
    
    // Calculate view variance: P_i * (tau * Sigma) * P_i'
    const pRow = P[i];
    const tauSigmaP = math.multiply(math.multiply(tau, covMatrix), pRow) as number[];
    const viewVariance = math.dot(pRow, tauSigmaP) as number;
    
    Omega[i][i] = uncertaintyFactor * Math.abs(viewVariance) + 1e-8; // Add small regularization
  }
  
  return Omega;
}

/**
 * Solve the Black-Litterman master equation
 * E[R] = inv(inv(τΣ) + P'inv(Ω)P) × (inv(τΣ)Π + P'inv(Ω)Q)
 */
function solveBlackLitterman(
  covMatrix: number[][],
  equilibriumReturns: number[],
  P: number[][],
  Q: number[],
  Omega: number[][],
  tau: number
): number[] {
  const n = equilibriumReturns.length;
  const Pi = equilibriumReturns.map(r => r / 100); // Convert to decimal
  
  // If no views, return equilibrium
  if (P.length === 0) {
    return equilibriumReturns;
  }
  
  try {
    // τΣ
    const tauSigma = math.multiply(tau, covMatrix) as number[][];
    
    // inv(τΣ)
    const invTauSigma = math.inv(tauSigma) as number[][];
    
    // inv(Ω)
    const invOmega = math.inv(Omega) as number[][];
    
    // P' (transpose of P)
    const Pt = math.transpose(P) as number[][];
    
    // P' * inv(Ω) * P
    const PtInvOmegaP = math.multiply(math.multiply(Pt, invOmega), P) as number[][];
    
    // Left side: inv(inv(τΣ) + P'inv(Ω)P)
    const leftMatrix = math.add(invTauSigma, PtInvOmegaP) as number[][];
    const leftInv = math.inv(leftMatrix) as number[][];
    
    // inv(τΣ) * Π
    const invTauSigmaPi = math.multiply(invTauSigma, Pi) as number[];
    
    // P' * inv(Ω) * Q
    const PtInvOmegaQ = math.multiply(math.multiply(Pt, invOmega), Q) as number[];
    
    // Right side: inv(τΣ)Π + P'inv(Ω)Q
    const rightVector = math.add(invTauSigmaPi, PtInvOmegaQ) as number[];
    
    // Final: left * right
    const blReturns = math.multiply(leftInv, rightVector) as number[];
    
    // Convert back to percentage
    return blReturns.map(r => r * 100);
  } catch (error) {
    console.error('Black-Litterman calculation error:', error);
    return equilibriumReturns;
  }
}

/**
 * Calculate optimal weights from Black-Litterman returns
 * w* = (1/delta) * inv(Σ) * E[R]
 */
function calculateOptimalWeights(
  covMatrix: number[][],
  blReturns: number[],
  riskAversion: number
): number[] {
  try {
    const returns = blReturns.map(r => r / 100); // Convert to decimal
    const invSigma = math.inv(covMatrix) as number[][];
    const rawWeights = math.multiply(invSigma, returns) as number[];
    const scaledWeights = rawWeights.map(w => w / riskAversion);
    
    // Normalize to sum to 1 (long-only constraint approximation)
    const sum = scaledWeights.reduce((a, b) => a + Math.max(0, b), 0);
    if (sum > 0) {
      return scaledWeights.map(w => Math.max(0, w) / sum);
    }
    
    return new Array(blReturns.length).fill(1 / blReturns.length);
  } catch (error) {
    console.error('Weight optimization error:', error);
    return new Array(blReturns.length).fill(1 / blReturns.length);
  }
}

// ============= Main Function =============

export function calculateBlackLitterman(
  transactions: Transaction[],
  valuations: MonthlyValuation[],
  inputs: BlackLittermanInputs
): BlackLittermanResult {
  const validationErrors: string[] = [];
  const { tau, riskAversion, views } = inputs;
  
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
    validationErrors.push('Need at least 2 assets with sufficient price history');
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
    validationErrors.push('Insufficient overlapping price history');
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
  
  // Align returns
  const alignedReturns: Record<string, number[]> = {};
  for (const ticker of tickers) {
    alignedReturns[ticker] = commonMonths.map(month => {
      const ret = assetReturns[ticker].find(r => r.month === month);
      return ret ? ret.return : 0;
    });
  }
  
  // Build covariance matrix
  const covMatrix = buildCovarianceMatrix(alignedReturns, tickers);
  
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
  
  // Calculate equilibrium returns (Pi)
  const equilibriumReturns = calculateEquilibriumReturns(covMatrix, marketWeights, riskAversion);
  
  // Filter valid views (only those with assets in our universe)
  const validViews = views.filter(v => {
    const hasAsset = tickers.includes(v.asset);
    const hasComparison = v.comparison === 'absolute' || 
      (v.comparisonAsset && tickers.includes(v.comparisonAsset));
    return hasAsset && hasComparison;
  });
  
  // Build P, Q, and Omega matrices
  const P = buildPMatrix(validViews, tickers);
  const Q = buildQVector(validViews);
  const Omega = validViews.length > 0 
    ? buildOmegaMatrix(validViews, P, covMatrix, tau)
    : [];
  
  // Solve Black-Litterman
  const blReturns = solveBlackLitterman(covMatrix, equilibriumReturns, P, Q, Omega, tau);
  
  // Calculate optimal weights
  const optimalWeights = calculateOptimalWeights(covMatrix, blReturns, riskAversion);
  
  // Calculate view impact
  const viewImpact = tickers.map((asset, i) => ({
    asset,
    equilibrium: equilibriumReturns[i],
    posterior: blReturns[i],
    delta: blReturns[i] - equilibriumReturns[i]
  }));
  
  return {
    assets: tickers,
    marketWeights,
    equilibriumReturns,
    blReturns,
    optimalWeights,
    covarianceMatrix: covMatrix,
    viewImpact,
    validationErrors
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
