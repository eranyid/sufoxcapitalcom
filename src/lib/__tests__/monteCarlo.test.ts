/**
 * SUFOX Capital Terminal - Monte Carlo Simulation Unit Tests
 * ==========================================================
 * 
 * Comprehensive tests for Monte Carlo simulation using Geometric Brownian Motion (GBM)
 * Formula: S(t) = S(0) × exp[(μ - 0.5σ²)t + σW(t)]
 * 
 * Tests cover:
 * - GBM formula correctness
 * - Log returns conversion
 * - Statistics calculation
 * - Percentile calculations
 * - VaR/CVaR risk metrics
 * - Full simulation engine
 */

import { describe, it, expect } from 'vitest';

// ============================================
// HELPER FUNCTIONS (matching component logic)
// ============================================

// Convert simple returns to log returns
function toLogReturns(simpleReturns: number[]): number[] {
  return simpleReturns.map(r => Math.log(1 + r / 100));
}

// Calculate statistics from log returns
function calculateStats(logReturns: number[]): { mean: number; std: number } {
  const n = logReturns.length;
  if (n === 0) return { mean: 0, std: 0 };
  
  const mean = logReturns.reduce((a, b) => a + b, 0) / n;
  const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  return { mean, std };
}

// Box-Muller transform for generating standard normal random numbers
function generateNormalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Seeded random for deterministic tests
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

// GBM step function
function gbmStep(
  currentValue: number,
  stepMean: number,
  stepStd: number,
  randomZ: number
): number {
  const logReturn = stepMean - 0.5 * stepStd * stepStd + stepStd * randomZ;
  return currentValue * Math.exp(logReturn);
}

// Get percentile from sorted array
function getPercentile(sortedValues: number[], percentile: number): number {
  const index = Math.floor((percentile / 100) * sortedValues.length);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

// Calculate VaR and CVaR
function calculateRiskMetrics(sortedFinalValues: number[], initialValue: number): { var95: number; cvar95: number } {
  const n = sortedFinalValues.length;
  const cutoffIndex = Math.floor(0.05 * n);
  
  const p5Value = sortedFinalValues[cutoffIndex];
  const var95 = ((p5Value - initialValue) / initialValue) * 100;
  
  const tailValues = sortedFinalValues.slice(0, cutoffIndex + 1);
  const avgTailValue = tailValues.reduce((a, b) => a + b, 0) / tailValues.length;
  const cvar95 = ((avgTailValue - initialValue) / initialValue) * 100;
  
  return { var95, cvar95 };
}

// Validate inputs
function validateManualInputs(inputs: { cagr: number; volatility: number; currentValue: number }): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (inputs.cagr < -50 || inputs.cagr > 100) {
    errors.cagr = 'CAGR must be between -50% and +100%';
  }
  
  if (inputs.volatility < 0 || inputs.volatility > 100) {
    errors.volatility = 'Volatility must be between 0% and 100%';
  }
  
  if (inputs.currentValue <= 0) {
    errors.currentValue = 'Current value must be greater than 0';
  }
  
  return errors;
}

// Run Monte Carlo simulation
function runMonteCarloSimulation(
  initialValue: number,
  yearsToSimulate: number,
  annualReturn: number,
  annualVol: number,
  numSimulations: number,
  stepsPerYear: number = 12
): { paths: number[][]; finalValues: number[] } {
  const totalSteps = yearsToSimulate * stepsPerYear;
  const stepMean = annualReturn / stepsPerYear;
  const stepStd = annualVol / Math.sqrt(stepsPerYear);
  
  const paths: number[][] = [];
  const finalValues: number[] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [initialValue];
    let value = initialValue;
    
    for (let step = 0; step < totalSteps; step++) {
      const z = generateNormalRandom();
      value = gbmStep(value, stepMean, stepStd, z);
      
      if ((step + 1) % stepsPerYear === 0) {
        path.push(value);
      }
    }
    
    paths.push(path);
    finalValues.push(value);
  }
  
  return { paths, finalValues: finalValues.sort((a, b) => a - b) };
}

// ============================================
// GBM FORMULA TESTS
// S(t) = S(0) × exp[(μ - 0.5σ²)t + σW(t)]
// ============================================
describe('GBM Formula (SUFOX Spec)', () => {
  it('should apply drift adjustment (μ - 0.5σ²)', () => {
    const currentValue = 100;
    const stepMean = 0.10 / 12; // 10% annual / 12 months
    const stepStd = 0.20 / Math.sqrt(12); // 20% annual vol
    const Z = 0; // No random component
    
    const result = gbmStep(currentValue, stepMean, stepStd, Z);
    
    // Expected: 100 × exp[(0.10/12 - 0.5×(0.20/√12)²)]
    const logReturn = stepMean - 0.5 * stepStd * stepStd;
    const expected = currentValue * Math.exp(logReturn);
    
    expect(result).toBeCloseTo(expected, 10);
  });

  it('should correctly scale volatility by √dt', () => {
    const currentValue = 100;
    const annualVol = 0.20;
    const stepsPerYear = 12;
    const stepStd = annualVol / Math.sqrt(stepsPerYear);
    
    // Expected monthly vol = 20% / √12 ≈ 5.77%
    expect(stepStd).toBeCloseTo(0.0577, 3);
  });

  it('should always produce positive values (log-normal property)', () => {
    const currentValue = 100;
    const stepMean = 0.01;
    const stepStd = 0.10;
    
    // Even with extreme negative Z values
    for (let z = -10; z <= 10; z += 0.5) {
      const result = gbmStep(currentValue, stepMean, stepStd, z);
      expect(result).toBeGreaterThan(0);
    }
  });

  it('should be multiplicative (path independent)', () => {
    const S0 = 100;
    const stepMean = 0.01;
    const stepStd = 0.05;
    
    // Path 1: 100 -> S1 -> S2
    const S1 = gbmStep(S0, stepMean, stepStd, 0.5);
    const S2 = gbmStep(S1, stepMean, stepStd, -0.3);
    
    // Path 2: Direct calculation with combined effect
    const logReturn1 = stepMean - 0.5 * stepStd * stepStd + stepStd * 0.5;
    const logReturn2 = stepMean - 0.5 * stepStd * stepStd + stepStd * (-0.3);
    const directS2 = S0 * Math.exp(logReturn1) * Math.exp(logReturn2);
    
    expect(S2).toBeCloseTo(directS2, 10);
  });
});

// ============================================
// LOG RETURNS CONVERSION TESTS
// ============================================
describe('Log Returns Conversion', () => {
  it('should convert simple returns to log returns correctly', () => {
    const simpleReturns = [10, -5, 15, -10, 8]; // percentage returns
    const logReturns = toLogReturns(simpleReturns);
    
    // Manual calculation: ln(1 + r/100)
    expect(logReturns[0]).toBeCloseTo(Math.log(1.10), 10);
    expect(logReturns[1]).toBeCloseTo(Math.log(0.95), 10);
    expect(logReturns[2]).toBeCloseTo(Math.log(1.15), 10);
    expect(logReturns[3]).toBeCloseTo(Math.log(0.90), 10);
    expect(logReturns[4]).toBeCloseTo(Math.log(1.08), 10);
  });

  it('should handle zero return', () => {
    const logReturns = toLogReturns([0]);
    expect(logReturns[0]).toBe(0); // ln(1) = 0
  });

  it('should handle negative returns correctly', () => {
    const logReturns = toLogReturns([-20]);
    expect(logReturns[0]).toBeCloseTo(Math.log(0.80), 10);
    expect(logReturns[0]).toBeLessThan(0);
  });
});

// ============================================
// STATISTICS CALCULATION TESTS
// ============================================
describe('Statistics Calculation', () => {
  it('should calculate mean correctly', () => {
    const logReturns = [0.01, 0.02, -0.01, 0.015, 0.005];
    const stats = calculateStats(logReturns);
    
    const expectedMean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    expect(stats.mean).toBeCloseTo(expectedMean, 10);
  });

  it('should use sample standard deviation (n-1)', () => {
    const logReturns = [0.01, 0.02, -0.01, 0.015, 0.005];
    const stats = calculateStats(logReturns);
    
    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (logReturns.length - 1);
    const expectedStd = Math.sqrt(variance);
    
    expect(stats.std).toBeCloseTo(expectedStd, 10);
  });

  it('should return zero for empty array', () => {
    const stats = calculateStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.std).toBe(0);
  });

  it('should handle single value (std = 0 or NaN handled)', () => {
    const stats = calculateStats([0.05]);
    expect(stats.mean).toBe(0.05);
    // Standard deviation with n=1 leads to division by 0
    expect(isNaN(stats.std) || stats.std === 0 || !isFinite(stats.std)).toBe(true);
  });
});

// ============================================
// PERCENTILE CALCULATION TESTS
// ============================================
describe('Percentile Calculation', () => {
  it('should calculate 5th percentile correctly', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1).sort((a, b) => a - b);
    const p5 = getPercentile(values, 5);
    
    // Index = floor(5/100 * 100) = 5 → value at index 5 = 6
    expect(p5).toBe(6);
  });

  it('should calculate median (50th percentile) correctly', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1).sort((a, b) => a - b);
    const p50 = getPercentile(values, 50);
    
    // Index = floor(50/100 * 100) = 50 → value at index 50 = 51
    expect(p50).toBe(51);
  });

  it('should calculate 95th percentile correctly', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1).sort((a, b) => a - b);
    const p95 = getPercentile(values, 95);
    
    // Index = floor(95/100 * 100) = 95 → value at index 95 = 96
    expect(p95).toBe(96);
  });

  it('should handle edge case at 100th percentile', () => {
    const values = [10, 20, 30, 40, 50].sort((a, b) => a - b);
    const p100 = getPercentile(values, 100);
    
    // Should return last value
    expect(p100).toBe(50);
  });

  it('should handle small arrays', () => {
    const values = [100, 200, 300].sort((a, b) => a - b);
    
    expect(getPercentile(values, 0)).toBe(100);
    expect(getPercentile(values, 50)).toBe(200);
    expect(getPercentile(values, 99)).toBe(300);
  });
});

// ============================================
// VaR AND CVaR TESTS
// ============================================
describe('VaR and CVaR Risk Metrics', () => {
  it('should calculate VaR95 as 5th percentile loss', () => {
    // Sorted final values (simulated)
    const finalValues = Array.from({ length: 1000 }, (_, i) => 80 + i * 0.1).sort((a, b) => a - b);
    const initialValue = 100;
    
    const metrics = calculateRiskMetrics(finalValues, initialValue);
    
    // VaR95 = (5th percentile value - initial) / initial × 100
    const cutoffIndex = Math.floor(0.05 * 1000);
    const expectedVar = ((finalValues[cutoffIndex] - initialValue) / initialValue) * 100;
    
    expect(metrics.var95).toBeCloseTo(expectedVar, 10);
  });

  it('should calculate CVaR95 as average of worst 5%', () => {
    const finalValues = Array.from({ length: 100 }, (_, i) => 80 + i).sort((a, b) => a - b);
    const initialValue = 100;
    
    const metrics = calculateRiskMetrics(finalValues, initialValue);
    
    // CVaR = average of bottom 5% values
    const cutoffIndex = Math.floor(0.05 * 100);
    const tailValues = finalValues.slice(0, cutoffIndex + 1);
    const avgTail = tailValues.reduce((a, b) => a + b, 0) / tailValues.length;
    const expectedCVar = ((avgTail - initialValue) / initialValue) * 100;
    
    expect(metrics.cvar95).toBeCloseTo(expectedCVar, 10);
  });

  it('should have CVaR95 >= VaR95 (in absolute terms)', () => {
    const finalValues = Array.from({ length: 1000 }, () => 
      50 + Math.random() * 100
    ).sort((a, b) => a - b);
    const initialValue = 100;
    
    const metrics = calculateRiskMetrics(finalValues, initialValue);
    
    // CVaR (average of tail) should be worse than VaR (threshold)
    // Since both are losses (negative), CVaR should be more negative
    expect(metrics.cvar95).toBeLessThanOrEqual(metrics.var95 + 0.01); // Small tolerance
  });

  it('should return negative values for losses', () => {
    // All values below initial
    const finalValues = Array.from({ length: 100 }, (_, i) => 50 + i * 0.4).sort((a, b) => a - b);
    const initialValue = 100;
    
    const metrics = calculateRiskMetrics(finalValues, initialValue);
    
    expect(metrics.var95).toBeLessThan(0);
    expect(metrics.cvar95).toBeLessThan(0);
  });
});

// ============================================
// INPUT VALIDATION TESTS
// ============================================
describe('Input Validation', () => {
  it('should reject CAGR outside -50% to +100% range', () => {
    expect(validateManualInputs({ cagr: -60, volatility: 20, currentValue: 100 })).toHaveProperty('cagr');
    expect(validateManualInputs({ cagr: 110, volatility: 20, currentValue: 100 })).toHaveProperty('cagr');
    expect(validateManualInputs({ cagr: 50, volatility: 20, currentValue: 100 })).not.toHaveProperty('cagr');
  });

  it('should reject volatility outside 0% to 100% range', () => {
    expect(validateManualInputs({ cagr: 10, volatility: -5, currentValue: 100 })).toHaveProperty('volatility');
    expect(validateManualInputs({ cagr: 10, volatility: 110, currentValue: 100 })).toHaveProperty('volatility');
    expect(validateManualInputs({ cagr: 10, volatility: 50, currentValue: 100 })).not.toHaveProperty('volatility');
  });

  it('should reject non-positive current value', () => {
    expect(validateManualInputs({ cagr: 10, volatility: 20, currentValue: 0 })).toHaveProperty('currentValue');
    expect(validateManualInputs({ cagr: 10, volatility: 20, currentValue: -100 })).toHaveProperty('currentValue');
    expect(validateManualInputs({ cagr: 10, volatility: 20, currentValue: 100 })).not.toHaveProperty('currentValue');
  });

  it('should accept valid inputs with no errors', () => {
    const errors = validateManualInputs({ cagr: 8, volatility: 15, currentValue: 100000 });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

// ============================================
// FULL SIMULATION ENGINE TESTS
// ============================================
describe('Monte Carlo Simulation Engine', () => {
  it('should generate correct number of simulations', () => {
    const numSims = 100;
    const { finalValues } = runMonteCarloSimulation(100, 1, 0.08, 0.15, numSims);
    
    expect(finalValues).toHaveLength(numSims);
  });

  it('should generate correct path length (years + 1)', () => {
    const years = 5;
    const { paths } = runMonteCarloSimulation(100, years, 0.08, 0.15, 10);
    
    // Each path should have initial value + one value per year
    expect(paths[0]).toHaveLength(years + 1);
  });

  it('should start all paths at initial value', () => {
    const initialValue = 100;
    const { paths } = runMonteCarloSimulation(initialValue, 3, 0.08, 0.15, 50);
    
    paths.forEach(path => {
      expect(path[0]).toBe(initialValue);
    });
  });

  it('should produce all positive values (log-normal)', () => {
    const { paths, finalValues } = runMonteCarloSimulation(100, 10, 0.05, 0.30, 100);
    
    paths.forEach(path => {
      path.forEach(value => {
        expect(value).toBeGreaterThan(0);
      });
    });
    
    finalValues.forEach(value => {
      expect(value).toBeGreaterThan(0);
    });
  });

  it('should return sorted final values', () => {
    const { finalValues } = runMonteCarloSimulation(100, 5, 0.08, 0.15, 500);
    
    for (let i = 1; i < finalValues.length; i++) {
      expect(finalValues[i]).toBeGreaterThanOrEqual(finalValues[i - 1]);
    }
  });

  it('should have median grow approximately at drift rate (large sample)', () => {
    const initialValue = 100;
    const annualReturn = 0.08; // 8%
    const years = 10;
    const { finalValues } = runMonteCarloSimulation(initialValue, years, annualReturn, 0.15, 5000);
    
    const median = getPercentile(finalValues, 50);
    
    // Expected median ≈ S0 × exp(μ × t) (for log-normal, median = exp(mean of log))
    // With drift adjustment: exp((μ - 0.5σ²) × t) = exp((0.08 - 0.5×0.0225)×10) = exp(0.6875)
    const expectedMedian = initialValue * Math.exp((annualReturn - 0.5 * 0.15 * 0.15) * years);
    
    // Allow 20% tolerance due to randomness
    expect(median).toBeGreaterThan(expectedMedian * 0.8);
    expect(median).toBeLessThan(expectedMedian * 1.2);
  });
});

// ============================================
// ANNUALIZATION TESTS
// ============================================
describe('Return and Volatility Annualization', () => {
  it('should annualize monthly returns correctly', () => {
    const monthlyReturn = 0.01; // 1% per month
    const annualReturn = Math.pow(1 + monthlyReturn, 12) - 1;
    
    // (1.01)^12 - 1 ≈ 12.68%
    expect(annualReturn).toBeCloseTo(0.1268, 3);
  });

  it('should annualize monthly volatility using √12', () => {
    const monthlyVol = 0.05; // 5% monthly
    const annualVol = monthlyVol * Math.sqrt(12);
    
    // 5% × √12 ≈ 17.32%
    expect(annualVol).toBeCloseTo(0.1732, 3);
  });

  it('should de-annualize for monthly simulation steps', () => {
    const annualVol = 0.20; // 20% annual
    const monthlyVol = annualVol / Math.sqrt(12);
    
    // 20% / √12 ≈ 5.77%
    expect(monthlyVol).toBeCloseTo(0.0577, 3);
  });

  it('should de-annualize for daily simulation steps', () => {
    const annualVol = 0.20; // 20% annual
    const dailyVol = annualVol / Math.sqrt(252);
    
    // 20% / √252 ≈ 1.26%
    expect(dailyVol).toBeCloseTo(0.0126, 3);
  });
});

// ============================================
// DISTRIBUTION PROPERTIES TESTS
// ============================================
describe('Simulation Distribution Properties', () => {
  it('should produce right-skewed distribution (positive skew for gains)', () => {
    const { finalValues } = runMonteCarloSimulation(100, 20, 0.08, 0.20, 5000);
    
    const mean = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
    const median = getPercentile(finalValues, 50);
    
    // For log-normal, mean > median (right-skewed)
    expect(mean).toBeGreaterThan(median);
  });

  it('should have higher volatility lead to wider distribution', () => {
    const { finalValues: lowVol } = runMonteCarloSimulation(100, 10, 0.08, 0.10, 1000);
    const { finalValues: highVol } = runMonteCarloSimulation(100, 10, 0.08, 0.30, 1000);
    
    const lowVolRange = getPercentile(lowVol, 95) - getPercentile(lowVol, 5);
    const highVolRange = getPercentile(highVol, 95) - getPercentile(highVol, 5);
    
    expect(highVolRange).toBeGreaterThan(lowVolRange);
  });

  it('should have longer horizon lead to wider distribution', () => {
    const { finalValues: short } = runMonteCarloSimulation(100, 5, 0.08, 0.15, 1000);
    const { finalValues: long } = runMonteCarloSimulation(100, 20, 0.08, 0.15, 1000);
    
    const shortRange = getPercentile(short, 95) - getPercentile(short, 5);
    const longRange = getPercentile(long, 95) - getPercentile(long, 5);
    
    expect(longRange).toBeGreaterThan(shortRange);
  });
});

// ============================================
// EDGE CASES TESTS
// ============================================
describe('Edge Cases', () => {
  it('should handle zero volatility (deterministic growth)', () => {
    const initialValue = 100;
    const annualReturn = 0.08;
    const { finalValues } = runMonteCarloSimulation(initialValue, 10, annualReturn, 0, 100);
    
    // All paths should be identical
    const expectedFinal = initialValue * Math.exp(annualReturn * 10);
    finalValues.forEach(value => {
      expect(value).toBeCloseTo(expectedFinal, 5);
    });
  });

  it('should handle zero return with volatility', () => {
    const { finalValues } = runMonteCarloSimulation(100, 5, 0, 0.20, 500);
    
    // Should still produce positive values
    finalValues.forEach(value => {
      expect(value).toBeGreaterThan(0);
    });
    
    // Median should be below initial (due to -0.5σ² drift adjustment)
    const median = getPercentile(finalValues, 50);
    expect(median).toBeLessThan(100);
  });

  it('should handle very high volatility', () => {
    const { finalValues } = runMonteCarloSimulation(100, 5, 0.05, 0.80, 500);
    
    // Should still produce all positive values
    finalValues.forEach(value => {
      expect(value).toBeGreaterThan(0);
    });
    
    // Should have very wide distribution
    const range = getPercentile(finalValues, 95) - getPercentile(finalValues, 5);
    expect(range).toBeGreaterThan(100); // Wider than initial value
  });

  it('should handle negative expected return', () => {
    const { finalValues } = runMonteCarloSimulation(100, 10, -0.05, 0.15, 500);
    
    // Should still produce positive values
    finalValues.forEach(value => {
      expect(value).toBeGreaterThan(0);
    });
    
    // Median should be below initial
    const median = getPercentile(finalValues, 50);
    expect(median).toBeLessThan(100);
  });

  it('should handle single year simulation', () => {
    const { paths } = runMonteCarloSimulation(100, 1, 0.08, 0.15, 50);
    
    // Path should have 2 values: initial and final
    expect(paths[0]).toHaveLength(2);
    expect(paths[0][0]).toBe(100);
  });
});

// ============================================
// DETERMINISM TESTS
// ============================================
describe('Determinism with Seeded Random', () => {
  it('should produce same GBM step with same random input', () => {
    const results = Array(10).fill(null).map(() => 
      gbmStep(100, 0.01, 0.05, 0.5)
    );
    
    expect(new Set(results).size).toBe(1);
  });

  it('should produce same statistics from same data', () => {
    const logReturns = [0.01, -0.02, 0.015, 0.005, -0.01];
    
    const results = Array(10).fill(null).map(() => calculateStats(logReturns));
    
    const means = results.map(r => r.mean);
    const stds = results.map(r => r.std);
    
    expect(new Set(means).size).toBe(1);
    expect(new Set(stds).size).toBe(1);
  });

  it('should produce same percentile from same sorted array', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    
    const results = Array(10).fill(null).map(() => getPercentile(values, 50));
    
    expect(new Set(results).size).toBe(1);
  });
});
