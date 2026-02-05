/**
 * SUFOX Capital Terminal - Multivariate Monte Carlo Unit Tests
 * ============================================================
 * 
 * Tests for the institutional-grade multivariate Monte Carlo simulation engine.
 * Covers Cholesky decomposition, correlation preservation, and multivariate GBM.
 */

import { describe, it, expect } from 'vitest';
import {
  choleskyDecomposition,
  matrixVectorMultiply,
  buildCovarianceMatrix,
  calculateCorrelation,
  calculateStatistics,
  generateIndependentNormals,
  assessDataQuality,
  determineSimulationMode,
  runMultivariateSimulation,
  runUnivariateSimulation,
  isStructuredError,
  buildMultivariateConfig,
  AssetParameters,
} from '../monteCarloEngine';

// ============================================
// CHOLESKY DECOMPOSITION TESTS
// ============================================
describe('Cholesky Decomposition', () => {
  it('should decompose identity matrix correctly', () => {
    const I = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    
    const L = choleskyDecomposition(I);
    expect(L).not.toBeNull();
    
    // L × L^T should equal I
    // For identity, L should also be identity
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(L![i][j]).toBeCloseTo(I[i][j], 10);
      }
    }
  });

  it('should decompose a simple 2x2 correlation matrix', () => {
    const R = [
      [1.0, 0.5],
      [0.5, 1.0],
    ];
    
    const L = choleskyDecomposition(R);
    expect(L).not.toBeNull();
    
    // Verify L × L^T = R
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let sum = 0;
        for (let k = 0; k < 2; k++) {
          sum += L![i][k] * L![j][k];
        }
        expect(sum).toBeCloseTo(R[i][j], 6);
      }
    }
  });

  it('should decompose a 3x3 correlation matrix', () => {
    // Typical stock correlation matrix
    const R = [
      [1.0, 0.6, 0.3],
      [0.6, 1.0, 0.4],
      [0.3, 0.4, 1.0],
    ];
    
    const L = choleskyDecomposition(R);
    expect(L).not.toBeNull();
    
    // Verify L is lower triangular
    expect(L![0][1]).toBe(0);
    expect(L![0][2]).toBe(0);
    expect(L![1][2]).toBe(0);
    
    // Verify L × L^T = R
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += L![i][k] * L![j][k];
        }
        expect(sum).toBeCloseTo(R[i][j], 6);
      }
    }
  });

  it('should return null for non-positive-definite matrix', () => {
    // This matrix is not positive definite
    const badMatrix = [
      [1.0, 2.0],
      [2.0, 1.0],
    ];
    
    const L = choleskyDecomposition(badMatrix);
    expect(L).toBeNull();
  });

  it('should handle perfect correlation (boundary case)', () => {
    const R = [
      [1.0, 0.999],
      [0.999, 1.0],
    ];
    
    const L = choleskyDecomposition(R);
    expect(L).not.toBeNull();
    
    // Should still produce valid decomposition
    expect(L![0][0]).toBeCloseTo(1.0, 6);
  });
});

// ============================================
// MATRIX-VECTOR MULTIPLICATION TESTS
// ============================================
describe('Matrix-Vector Multiplication', () => {
  it('should multiply correctly with identity matrix', () => {
    const L = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const Z = [1, 2, 3];
    
    const result = matrixVectorMultiply(L, Z);
    
    expect(result[0]).toBeCloseTo(1, 10);
    expect(result[1]).toBeCloseTo(2, 10);
    expect(result[2]).toBeCloseTo(3, 10);
  });

  it('should multiply correctly with lower triangular matrix', () => {
    const L = [
      [1, 0],
      [0.5, 0.866],  // Cholesky of [[1, 0.5], [0.5, 1]]
    ];
    const Z = [1, 1];
    
    const result = matrixVectorMultiply(L, Z);
    
    expect(result[0]).toBeCloseTo(1, 3);
    expect(result[1]).toBeCloseTo(1.366, 3);  // 0.5 * 1 + 0.866 * 1
  });

  it('should preserve independence transformation structure', () => {
    // For independent assets (identity correlation), 
    // L is identity, so output equals input
    const L = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const Z = [0.5, -0.3, 1.2];
    
    const epsilon = matrixVectorMultiply(L, Z);
    
    expect(epsilon[0]).toBe(Z[0]);
    expect(epsilon[1]).toBe(Z[1]);
    expect(epsilon[2]).toBe(Z[2]);
  });
});

// ============================================
// COVARIANCE MATRIX TESTS
// ============================================
describe('Covariance Matrix Building', () => {
  it('should build covariance from volatilities and correlations', () => {
    const vols = [0.20, 0.30];  // 20% and 30% vol
    const corr = [
      [1.0, 0.5],
      [0.5, 1.0],
    ];
    
    const cov = buildCovarianceMatrix(vols, corr);
    
    // Cov(1,1) = σ1 × σ1 × 1 = 0.04
    expect(cov[0][0]).toBeCloseTo(0.04, 10);
    
    // Cov(2,2) = σ2 × σ2 × 1 = 0.09
    expect(cov[1][1]).toBeCloseTo(0.09, 10);
    
    // Cov(1,2) = σ1 × σ2 × ρ = 0.20 × 0.30 × 0.5 = 0.03
    expect(cov[0][1]).toBeCloseTo(0.03, 10);
    expect(cov[1][0]).toBeCloseTo(0.03, 10);
  });

  it('should be symmetric', () => {
    const vols = [0.15, 0.25, 0.35];
    const corr = [
      [1.0, 0.3, 0.2],
      [0.3, 1.0, 0.4],
      [0.2, 0.4, 1.0],
    ];
    
    const cov = buildCovarianceMatrix(vols, corr);
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(cov[i][j]).toBeCloseTo(cov[j][i], 10);
      }
    }
  });
});

// ============================================
// STATISTICS CALCULATION TESTS
// ============================================
describe('Statistics Calculation', () => {
  it('should calculate mean correctly', () => {
    const returns = [0.01, 0.02, -0.01, 0.015, 0.005];
    const stats = calculateStatistics(returns);
    
    const expectedMean = returns.reduce((a, b) => a + b, 0) / returns.length;
    expect(stats.mean).toBeCloseTo(expectedMean, 10);
  });

  it('should calculate standard deviation with sample formula (n-1)', () => {
    const returns = [0.01, 0.02, -0.01, 0.015, 0.005];
    const stats = calculateStatistics(returns);
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const expectedStd = Math.sqrt(variance);
    
    expect(stats.std).toBeCloseTo(expectedStd, 10);
  });

  it('should handle empty array', () => {
    const stats = calculateStatistics([]);
    expect(stats.mean).toBe(0);
    expect(stats.std).toBe(0);
  });

  it('should handle single value', () => {
    const stats = calculateStatistics([0.05]);
    expect(stats.mean).toBe(0.05);
    expect(stats.std).toBe(0);  // No variance with single value
  });
});

// ============================================
// CORRELATION CALCULATION TESTS
// ============================================
describe('Correlation Calculation', () => {
  it('should return 1 for perfectly correlated series', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];  // y = 2x
    
    const corr = calculateCorrelation(x, y);
    expect(corr).toBeCloseTo(1, 6);
  });

  it('should return -1 for perfectly negatively correlated series', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];  // y = 12 - 2x
    
    const corr = calculateCorrelation(x, y);
    expect(corr).toBeCloseTo(-1, 6);
  });

  it('should return ~0 for uncorrelated series', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8];
    const y = [5, 3, 7, 1, 8, 2, 6, 4];  // Random-ish
    
    const corr = calculateCorrelation(x, y);
    // Should be close to zero for uncorrelated data
    expect(Math.abs(corr)).toBeLessThan(0.5);
  });

  it('should handle short series', () => {
    const corr = calculateCorrelation([1], [2]);
    expect(corr).toBe(0);  // Not enough data
  });
});

// ============================================
// DATA QUALITY ASSESSMENT TESTS
// ============================================
describe('Data Quality Assessment', () => {
  it('should classify 12+ months as high quality', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 24 },
      { ticker: 'B', name: 'B', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 12 },
    ];
    
    const quality = assessDataQuality(assets);
    expect(quality.level).toBe('high');
    expect(quality.minMonths).toBe(12);
  });

  it('should classify 6-11 months as medium quality', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 24 },
      { ticker: 'B', name: 'B', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 8 },
    ];
    
    const quality = assessDataQuality(assets);
    expect(quality.level).toBe('medium');
  });

  it('should classify 3-5 months as low quality', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 12 },
      { ticker: 'B', name: 'B', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 4 },
    ];
    
    const quality = assessDataQuality(assets);
    expect(quality.level).toBe('low');
  });

  it('should classify <3 months as insufficient', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 12 },
      { ticker: 'B', name: 'B', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 2 },
    ];
    
    const quality = assessDataQuality(assets);
    expect(quality.level).toBe('insufficient');
  });

  it('should handle empty assets array', () => {
    const quality = assessDataQuality([]);
    expect(quality.level).toBe('insufficient');
  });
});

// ============================================
// SIMULATION MODE DETERMINATION TESTS
// ============================================
describe('Simulation Mode Determination', () => {
  const validCorrelation = [[1, 0.5], [0.5, 1]];

  it('should use univariate for single asset', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 1, meanReturn: 0.1, volatility: 0.2, monthsOfData: 24 },
    ];
    
    const mode = determineSimulationMode(assets, null);
    expect(mode.type).toBe('univariate');
  });

  it('should use multivariate for high quality data', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 24 },
      { ticker: 'B', name: 'B', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 12 },
    ];
    
    const mode = determineSimulationMode(assets, validCorrelation);
    expect(mode.type).toBe('multivariate');
  });

  it('should fallback to univariate for low quality data', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 24 },
      { ticker: 'B', name: 'B', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 4 },
    ];
    
    const mode = determineSimulationMode(assets, validCorrelation);
    expect(mode.type).toBe('univariate');
    expect(mode.reason).toContain('Low data quality');
  });

  it('should fallback when no correlation matrix', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'A', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 24 },
      { ticker: 'B', name: 'B', weight: 0.5, meanReturn: 0.1, volatility: 0.2, monthsOfData: 24 },
    ];
    
    const mode = determineSimulationMode(assets, null);
    expect(mode.type).toBe('univariate');
  });
});

// ============================================
// MULTIVARIATE SIMULATION TESTS
// ============================================
describe('Multivariate Simulation', () => {
  const createTestConfig = (): { config: ReturnType<typeof buildMultivariateConfig>; assets: AssetParameters[] } => {
    const assets: AssetParameters[] = [
      { ticker: 'SPY', name: 'S&P 500', weight: 0.6, meanReturn: 0.10, volatility: 0.18, monthsOfData: 24 },
      { ticker: 'TLT', name: 'Bonds', weight: 0.4, meanReturn: 0.04, volatility: 0.12, monthsOfData: 24 },
    ];
    
    const correlation = [
      [1.0, -0.2],
      [-0.2, 1.0],
    ];
    
    const config = buildMultivariateConfig(assets, correlation, 'constant');
    return { config, assets };
  };

  it('should generate correct number of simulations', () => {
    const { config } = createTestConfig();
    expect(config).not.toBeNull();
    
    const result = runMultivariateSimulation(config!, 100000, 1, 100, 12);
    expect(result).not.toBeNull();
    if (result && !isStructuredError(result)) {
      expect(result.finalValues).toHaveLength(100);
    }
  });

  it('should return sorted final values', () => {
    const { config } = createTestConfig();
    const result = runMultivariateSimulation(config!, 100000, 5, 500, 12);
    
    if (result && !isStructuredError(result)) {
      for (let i = 1; i < result.finalValues.length; i++) {
        expect(result.finalValues[i]).toBeGreaterThanOrEqual(result.finalValues[i - 1]);
      }
    }
  });

  it('should produce all positive values (log-normal)', () => {
    const { config } = createTestConfig();
    const result = runMultivariateSimulation(config!, 100000, 10, 500, 12);
    
    if (result && !isStructuredError(result)) {
      result.finalValues.forEach(v => {
        expect(v).toBeGreaterThan(0);
      });
    }
  });

  it('should calculate risk metrics', () => {
    const { config } = createTestConfig();
    const result = runMultivariateSimulation(config!, 100000, 10, 1000, 12);
    
    if (result && !isStructuredError(result)) {
      expect(result.riskMetrics.probGain + result.riskMetrics.probLoss).toBeCloseTo(100, 1);
      expect(result.riskMetrics.cvar95).toBeLessThanOrEqual(result.riskMetrics.var95 + 0.1);
    }
  });

  it('should show diversification benefit for negatively correlated assets', () => {
    const { config } = createTestConfig();
    const result = runMultivariateSimulation(config!, 100000, 10, 2000, 12);
    
    // With negative correlation, diversification benefit should be positive
    if (result && !isStructuredError(result)) {
      expect(result.diversificationBenefit).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================
// UNIVARIATE SIMULATION TESTS
// ============================================
describe('Univariate Simulation', () => {
  it('should generate correct number of simulations', () => {
    const result = runUnivariateSimulation(100000, 0.08, 0.15, 5, 100, 12);
    expect(result.finalValues).toHaveLength(100);
  });

  it('should produce all positive values', () => {
    const result = runUnivariateSimulation(100000, 0.05, 0.30, 10, 500, 12);
    
    result.finalValues.forEach(v => {
      expect(v).toBeGreaterThan(0);
    });
  });

  it('should have median grow approximately at drift rate', () => {
    const initialValue = 100000;
    const annualReturn = 0.08;
    const years = 10;
    
    const result = runUnivariateSimulation(initialValue, annualReturn, 0.15, years, 5000, 12);
    
    // Expected median ≈ S0 × exp((μ - 0.5σ²) × t)
    const expectedMedian = initialValue * Math.exp((annualReturn - 0.5 * 0.15 * 0.15) * years);
    
    // Allow 25% tolerance due to randomness
    expect(result.percentiles.p50).toBeGreaterThan(expectedMedian * 0.75);
    expect(result.percentiles.p50).toBeLessThan(expectedMedian * 1.25);
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================
describe('Config Building Integration', () => {
  it('should build valid config from assets and correlation', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'Asset A', weight: 0.5, meanReturn: 0.10, volatility: 0.20, monthsOfData: 24 },
      { ticker: 'B', name: 'Asset B', weight: 0.5, meanReturn: 0.05, volatility: 0.15, monthsOfData: 24 },
    ];
    
    const correlation = [
      [1.0, 0.3],
      [0.3, 1.0],
    ];
    
    const config = buildMultivariateConfig(assets, correlation, 'constant');
    
    expect(config).not.toBeNull();
    expect(config!.choleskyL).not.toBeNull();
    expect(config!.covarianceMatrix).toHaveLength(2);
    expect(config!.rebalancing).toBe('constant');
  });

  it('should return null for insufficient assets', () => {
    const assets: AssetParameters[] = [
      { ticker: 'A', name: 'Asset A', weight: 1, meanReturn: 0.10, volatility: 0.20, monthsOfData: 24 },
    ];
    
    const config = buildMultivariateConfig(assets, [[1]], 'constant');
    expect(config).toBeNull();
  });
});
