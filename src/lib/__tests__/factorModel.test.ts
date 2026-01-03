/**
 * SUFOX Capital Terminal - Factor Model Unit Tests
 * ================================================
 * 
 * Tests for factor model calculations including:
 * - Factor exposure regression
 * - Systematic vs residual risk decomposition
 * - Covariance and correlation matrices
 */

import { describe, it, expect } from 'vitest';

// ============================================
// RESIDUAL VOLATILITY TESTS
// Formula: Residual Vol = √(Total Variance - Systematic Variance) × √12
// ============================================
describe('Residual Volatility (SUFOX Spec)', () => {
  it('should calculate residual as sqrt(total - systematic)', () => {
    // Given total variance and systematic variance
    const totalVariance = 100; // Monthly variance
    const systematicVariance = 60;
    
    // Residual variance = Total - Systematic
    const residualVariance = totalVariance - systematicVariance;
    
    // Residual vol = √residualVariance × √12 (annualized)
    const residualVol = Math.sqrt(residualVariance) * Math.sqrt(12);
    
    expect(residualVol).toBeCloseTo(Math.sqrt(40) * Math.sqrt(12), 2);
  });

  it('should handle zero systematic risk', () => {
    const totalVariance = 50;
    const systematicVariance = 0;
    
    const residualVariance = totalVariance - systematicVariance;
    const residualVol = Math.sqrt(residualVariance) * Math.sqrt(12);
    
    // All risk is residual/idiosyncratic
    expect(residualVol).toBeCloseTo(Math.sqrt(50) * Math.sqrt(12), 2);
  });

  it('should handle total variance = systematic variance', () => {
    const totalVariance = 100;
    const systematicVariance = 100;
    
    const residualVariance = totalVariance - systematicVariance;
    const residualVol = Math.sqrt(Math.max(0, residualVariance)) * Math.sqrt(12);
    
    // No residual risk
    expect(residualVol).toBe(0);
  });
});

// ============================================
// FACTOR COVARIANCE MATRIX TESTS
// ============================================
describe('Factor Covariance Matrix', () => {
  it('should produce symmetric matrix', () => {
    // Simple covariance calculation
    const calculateCovariance = (x: number[], y: number[]): number => {
      const n = x.length;
      const meanX = x.reduce((a, b) => a + b, 0) / n;
      const meanY = y.reduce((a, b) => a + b, 0) / n;
      
      let cov = 0;
      for (let i = 0; i < n; i++) {
        cov += (x[i] - meanX) * (y[i] - meanY);
      }
      return cov / (n - 1);
    };
    
    const factorA = [1, 2, 3, 4, 5];
    const factorB = [2, 4, 5, 4, 6];
    
    const covAB = calculateCovariance(factorA, factorB);
    const covBA = calculateCovariance(factorB, factorA);
    
    // Covariance should be symmetric: Cov(A,B) = Cov(B,A)
    expect(covAB).toBeCloseTo(covBA, 10);
  });

  it('should have variance on diagonal', () => {
    const calculateVariance = (x: number[]): number => {
      const n = x.length;
      const mean = x.reduce((a, b) => a + b, 0) / n;
      return x.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    };
    
    const calculateCovariance = (x: number[], y: number[]): number => {
      const n = x.length;
      const meanX = x.reduce((a, b) => a + b, 0) / n;
      const meanY = y.reduce((a, b) => a + b, 0) / n;
      
      let cov = 0;
      for (let i = 0; i < n; i++) {
        cov += (x[i] - meanX) * (y[i] - meanY);
      }
      return cov / (n - 1);
    };
    
    const data = [1, 2, 3, 4, 5];
    
    const variance = calculateVariance(data);
    const selfCovariance = calculateCovariance(data, data);
    
    // Cov(X,X) = Var(X)
    expect(selfCovariance).toBeCloseTo(variance, 10);
  });
});

// ============================================
// FACTOR CORRELATION MATRIX TESTS
// ============================================
describe('Factor Correlation Matrix', () => {
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
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
  };
  
  it('should have 1 on diagonal', () => {
    const data = [1, 2, 3, 4, 5];
    const selfCorrelation = calculateCorrelation(data, data);
    
    expect(selfCorrelation).toBeCloseTo(1, 10);
  });

  it('should be between -1 and 1', () => {
    const factorA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const factorB = [2, 1, 4, 3, 6, 5, 8, 7, 10, 9];
    
    const correlation = calculateCorrelation(factorA, factorB);
    
    expect(correlation).toBeGreaterThanOrEqual(-1);
    expect(correlation).toBeLessThanOrEqual(1);
  });

  it('should be 1 for perfectly correlated data', () => {
    const factorA = [1, 2, 3, 4, 5];
    const factorB = [2, 4, 6, 8, 10]; // 2 × factorA
    
    const correlation = calculateCorrelation(factorA, factorB);
    
    expect(correlation).toBeCloseTo(1, 10);
  });

  it('should be -1 for perfectly inverse correlated data', () => {
    const factorA = [1, 2, 3, 4, 5];
    const factorB = [5, 4, 3, 2, 1]; // Inverted
    
    const correlation = calculateCorrelation(factorA, factorB);
    
    expect(correlation).toBeCloseTo(-1, 10);
  });

  it('should be near 0 for uncorrelated data', () => {
    // Alternating pattern should have low correlation with linear pattern
    const factorA = [1, 2, 3, 4, 5, 6, 7, 8];
    const factorB = [1, -1, 1, -1, 1, -1, 1, -1];
    
    const correlation = calculateCorrelation(factorA, factorB);
    
    expect(Math.abs(correlation)).toBeLessThan(0.5);
  });
});

// ============================================
// R-SQUARED TESTS
// R² = Systematic Variance / Total Variance
// ============================================
describe('R-Squared (SUFOX Spec)', () => {
  it('should be between 0 and 1', () => {
    const totalVariance = 100;
    const systematicVariance = 60;
    
    const rSquared = systematicVariance / totalVariance;
    
    expect(rSquared).toBeGreaterThanOrEqual(0);
    expect(rSquared).toBeLessThanOrEqual(1);
  });

  it('should be 0 when no systematic risk', () => {
    const totalVariance = 100;
    const systematicVariance = 0;
    
    const rSquared = systematicVariance / totalVariance;
    
    expect(rSquared).toBe(0);
  });

  it('should be 1 when all risk is systematic', () => {
    const totalVariance = 100;
    const systematicVariance = 100;
    
    const rSquared = systematicVariance / totalVariance;
    
    expect(rSquared).toBe(1);
  });

  it('should equal 1 - (Residual Variance / Total Variance)', () => {
    const totalVariance = 100;
    const systematicVariance = 70;
    const residualVariance = 30;
    
    const rSquaredFromSystematic = systematicVariance / totalVariance;
    const rSquaredFromResidual = 1 - (residualVariance / totalVariance);
    
    expect(rSquaredFromSystematic).toBeCloseTo(rSquaredFromResidual, 10);
  });
});

// ============================================
// REGRESSION BETA TESTS
// Beta = Cov(Y, X) / Var(X)
// ============================================
describe('Regression Beta (Factor Exposure)', () => {
  const calculateBeta = (y: number[], x: number[]): number => {
    const n = y.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let covariance = 0;
    let varianceX = 0;
    
    for (let i = 0; i < n; i++) {
      covariance += (y[i] - meanY) * (x[i] - meanX);
      varianceX += Math.pow(x[i] - meanX, 2);
    }
    
    covariance /= (n - 1);
    varianceX /= (n - 1);
    
    return varianceX !== 0 ? covariance / varianceX : 0;
  };

  it('should calculate correct slope', () => {
    // y = 2x + noise
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // Perfect 2x relationship
    
    const beta = calculateBeta(y, x);
    
    expect(beta).toBeCloseTo(2, 10);
  });

  it('should be 0 for uncorrelated data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 5, 5, 5, 5]; // Constant - no relationship
    
    const beta = calculateBeta(y, x);
    
    expect(beta).toBe(0);
  });

  it('should handle negative relationships', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2]; // Negative slope
    
    const beta = calculateBeta(y, x);
    
    expect(beta).toBeLessThan(0);
    expect(beta).toBeCloseTo(-2, 10);
  });
});
