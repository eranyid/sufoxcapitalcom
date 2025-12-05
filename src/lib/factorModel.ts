// Factor Model Calculations - Bloomberg PORT / MSCI Barra / Axioma style

import { Transaction, MonthlyValuation, FactorExposure, FactorRiskBreakdown, FactorModelResults } from '@/types/investment';
import { ALL_FACTORS, Factor, STYLE_FACTORS, MACRO_FACTORS } from '@/data/factors';
import { calculateMonthlyReturns, calculateVolatility } from './calculations';

// Re-export types for backward compatibility
export type { FactorExposure, FactorRiskBreakdown, FactorModelResults };

// Generate simulated factor returns based on historical patterns
// In production, this would come from actual factor index data
export function generateFactorReturns(months: string[]): Record<string, number[]> {
  const factorReturns: Record<string, number[]> = {};
  
  // Seed for reproducibility based on months
  const seed = months.length > 0 ? months[0].charCodeAt(0) : 42;
  let random = seededRandom(seed);
  
  // Base market parameters (monthly)
  const marketMean = 0.8; // ~9.6% annual
  const marketVol = 4.5;  // ~15.6% annual
  
  // Generate correlated factor returns
  for (let i = 0; i < months.length; i++) {
    // Market factor (base)
    const marketReturn = marketMean + marketVol * normalRandom(random);
    
    // Style factors (partially correlated to market)
    factorReturns['market'] = factorReturns['market'] || [];
    factorReturns['market'].push(marketReturn);
    
    factorReturns['value'] = factorReturns['value'] || [];
    factorReturns['value'].push(marketReturn * 0.3 + normalRandom(random) * 2.5);
    
    factorReturns['growth'] = factorReturns['growth'] || [];
    factorReturns['growth'].push(marketReturn * 0.4 + normalRandom(random) * 3.0);
    
    factorReturns['momentum'] = factorReturns['momentum'] || [];
    factorReturns['momentum'].push(marketReturn * 0.2 + normalRandom(random) * 3.5);
    
    factorReturns['volatility'] = factorReturns['volatility'] || [];
    factorReturns['volatility'].push(marketReturn * 0.6 - normalRandom(random) * 1.5);
    
    factorReturns['quality'] = factorReturns['quality'] || [];
    factorReturns['quality'].push(marketReturn * 0.5 + normalRandom(random) * 2.0);
    
    factorReturns['size'] = factorReturns['size'] || [];
    factorReturns['size'].push(normalRandom(random) * 2.8 + 0.2);
    
    // Macro factors
    factorReturns['tech'] = factorReturns['tech'] || [];
    factorReturns['tech'].push(marketReturn * 1.3 + normalRandom(random) * 2.0);
    
    factorReturns['rates'] = factorReturns['rates'] || [];
    factorReturns['rates'].push(normalRandom(random) * 1.2 - 0.1);
    
    factorReturns['usd'] = factorReturns['usd'] || [];
    factorReturns['usd'].push(normalRandom(random) * 1.5);
    
    factorReturns['inflation'] = factorReturns['inflation'] || [];
    factorReturns['inflation'].push(normalRandom(random) * 0.8 + 0.2);
    
    factorReturns['credit'] = factorReturns['credit'] || [];
    factorReturns['credit'].push(marketReturn * 0.4 + normalRandom(random) * 1.8);
    
    random = seededRandom(seed + i + 1);
  }
  
  return factorReturns;
}

// Seeded random number generator
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Box-Muller transform for normal distribution
function normalRandom(random: () => number): number {
  const u1 = random();
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Single factor regression: portfolio_return = α + β * factor_return + ε
function runRegression(portfolioReturns: number[], factorReturns: number[]): {
  beta: number;
  alpha: number;
  r2: number;
  tStat: number;
  pValue: number;
  residuals: number[];
} {
  const n = Math.min(portfolioReturns.length, factorReturns.length);
  if (n < 3) {
    return { beta: 0, alpha: 0, r2: 0, tStat: 0, pValue: 1, residuals: [] };
  }
  
  const y = portfolioReturns.slice(0, n);
  const x = factorReturns.slice(0, n);
  
  // Calculate means
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  
  // Calculate beta and alpha (OLS)
  let sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumXY += (x[i] - meanX) * (y[i] - meanY);
    sumX2 += (x[i] - meanX) ** 2;
  }
  
  const beta = sumX2 !== 0 ? sumXY / sumX2 : 0;
  const alpha = meanY - beta * meanX;
  
  // Calculate R² and residuals
  const residuals: number[] = [];
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = alpha + beta * x[i];
    const residual = y[i] - predicted;
    residuals.push(residual);
    ssRes += residual ** 2;
    ssTot += (y[i] - meanY) ** 2;
  }
  
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
  
  // Calculate t-statistic for beta
  const mse = ssRes / (n - 2);
  const seBeta = sumX2 !== 0 ? Math.sqrt(mse / sumX2) : 1;
  const tStat = seBeta !== 0 ? beta / seBeta : 0;
  
  // Approximate p-value (using normal approximation for large n)
  const pValue = 2 * (1 - normalCDF(Math.abs(tStat)));
  
  return { beta, alpha, r2, tStat, pValue, residuals };
}

// Normal CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

// Calculate factor covariance matrix
export function calculateFactorCovariance(factorReturns: Record<string, number[]>): number[][] {
  const factorKeys = Object.keys(factorReturns);
  const n = factorKeys.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = calculateCovariance(
        factorReturns[factorKeys[i]],
        factorReturns[factorKeys[j]]
      );
    }
  }
  
  return matrix;
}

// Calculate factor correlation matrix
export function calculateFactorCorrelation(factorReturns: Record<string, number[]>): number[][] {
  const factorKeys = Object.keys(factorReturns);
  const n = factorKeys.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = calculateCorrelation(
          factorReturns[factorKeys[i]],
          factorReturns[factorKeys[j]]
        );
      }
    }
  }
  
  return matrix;
}

function calculateCovariance(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY);
  }
  
  return sum / (n - 1);
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  
  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }
  
  const denom = Math.sqrt(sumX2 * sumY2);
  return denom !== 0 ? sumXY / denom : 0;
}

// Main function: Compute complete factor model
export function computeFactorModel(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): FactorModelResults | null {
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  
  if (monthlyReturns.length < 6) {
    return null; // Need at least 6 months for meaningful regression
  }
  
  const portfolioReturns = monthlyReturns.map(r => r.return);
  const months = monthlyReturns.map(r => r.month);
  
  // Generate factor returns (in production, use real factor data)
  const factorReturns = generateFactorReturns(months);
  
  // Run regressions for each factor
  const exposures: FactorExposure[] = [];
  const allBetas: Record<string, number> = {};
  
  for (const factor of ALL_FACTORS) {
    const factorRets = factorReturns[factor.key];
    if (!factorRets) continue;
    
    const regression = runRegression(portfolioReturns, factorRets);
    
    exposures.push({
      factor: factor.key,
      factorLabel: factor.label,
      factorType: factor.type,
      beta: regression.beta,
      tStat: regression.tStat,
      r2: regression.r2,
      pValue: regression.pValue
    });
    
    allBetas[factor.key] = regression.beta;
  }
  
  // Sort exposures by absolute beta
  exposures.sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta));
  
  // Calculate factor covariance and correlation matrices
  const factorCovariance = calculateFactorCovariance(factorReturns);
  const factorCorrelation = calculateFactorCorrelation(factorReturns);
  
  // Calculate systematic vs specific risk
  // Total Variance = β * Cov(Factors) * βᵀ + Specific Variance
  const factorKeys = Object.keys(factorReturns);
  const betaVector = factorKeys.map(k => allBetas[k] || 0);
  
  // β * Cov(Factors) * βᵀ
  let systematicVariance = 0;
  for (let i = 0; i < factorKeys.length; i++) {
    for (let j = 0; j < factorKeys.length; j++) {
      systematicVariance += betaVector[i] * factorCovariance[i][j] * betaVector[j];
    }
  }
  
  // Total portfolio variance
  const portfolioVol = calculateVolatility(portfolioReturns);
  const totalVariance = (portfolioVol / Math.sqrt(12)) ** 2; // Monthly variance
  
  // Specific variance = Total - Systematic
  const specificVariance = Math.max(0, totalVariance - systematicVariance);
  
  // Percentages
  const systematicPct = totalVariance > 0 ? (systematicVariance / totalVariance) * 100 : 0;
  const specificPct = totalVariance > 0 ? (specificVariance / totalVariance) * 100 : 0;
  
  // Residual volatility (annualized)
  const residualVolatility = Math.sqrt(specificVariance * 12) * 100;
  
  // Risk contribution per factor
  const risk: FactorRiskBreakdown[] = [];
  let totalFactorContribution = 0;
  
  for (let i = 0; i < factorKeys.length; i++) {
    const factor = ALL_FACTORS.find(f => f.key === factorKeys[i]);
    if (!factor) continue;
    
    // Marginal contribution: β_i * Σ(Cov_ij * β_j)
    let marginalContrib = 0;
    for (let j = 0; j < factorKeys.length; j++) {
      marginalContrib += factorCovariance[i][j] * betaVector[j];
    }
    marginalContrib *= betaVector[i];
    
    totalFactorContribution += marginalContrib;
    
    risk.push({
      factor: factor.key,
      factorLabel: factor.label,
      contributionAbs: marginalContrib,
      contributionPct: 0 // Will calculate after
    });
  }
  
  // Calculate percentages
  for (const r of risk) {
    r.contributionPct = totalFactorContribution > 0 
      ? (r.contributionAbs / totalFactorContribution) * systematicPct 
      : 0;
  }
  
  // Sort by contribution
  risk.sort((a, b) => Math.abs(b.contributionPct) - Math.abs(a.contributionPct));
  
  return {
    exposures,
    risk,
    systematicPct,
    specificPct,
    factorCovariance,
    factorCorrelation,
    totalVariance,
    systematicVariance,
    specificVariance,
    residualVolatility
  };
}

// Validate factor model results for Data Watchdog
export function validateFactorModel(results: FactorModelResults): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for NaN betas
  for (const exp of results.exposures) {
    if (isNaN(exp.beta)) {
      issues.push(`NaN beta for factor ${exp.factorLabel}`);
    }
  }
  
  // Check for negative variance
  if (results.totalVariance < 0) {
    issues.push('Total variance is negative');
  }
  if (results.systematicVariance < 0) {
    issues.push('Systematic variance is negative');
  }
  if (results.specificVariance < 0) {
    issues.push('Specific variance is negative');
  }
  
  // Check covariance matrix symmetry
  const n = results.factorCovariance.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(results.factorCovariance[i][j] - results.factorCovariance[j][i]) > 0.0001) {
        issues.push('Factor covariance matrix is not symmetric');
        break;
      }
    }
  }
  
  // Check systematic + specific ≈ 100%
  const totalPct = results.systematicPct + results.specificPct;
  if (Math.abs(totalPct - 100) > 5) {
    issues.push(`Risk decomposition does not sum to 100% (got ${totalPct.toFixed(1)}%)`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
