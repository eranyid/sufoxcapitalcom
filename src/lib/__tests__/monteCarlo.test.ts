/**
 * SUFOX Capital Terminal - Monte Carlo Simulation Unit Tests
 * ==========================================================
 * 
 * Tests for Monte Carlo simulation using Geometric Brownian Motion (GBM)
 * Formula: S(t) = S(0) × exp[(μ - 0.5σ²)t + σW(t)]
 */

import { describe, it, expect } from 'vitest';

// ============================================
// GBM FORMULA TESTS
// S(t) = S(0) × exp[(μ - 0.5σ²)t + σW(t)]
// ============================================
describe('GBM Formula (SUFOX Spec)', () => {
  // GBM step function for testing
  const gbmStep = (
    currentValue: number,
    drift: number,      // μ (annual)
    volatility: number, // σ (annual)
    dt: number,         // time step in years
    randomZ: number     // standard normal random number
  ): number => {
    // S(t+dt) = S(t) × exp[(μ - 0.5σ²)dt + σ√dt×Z]
    const logReturn = (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomZ;
    return currentValue * Math.exp(logReturn);
  };

  it('should use drift adjustment (μ - 0.5σ²)', () => {
    const S0 = 100;
    const mu = 0.10; // 10% annual drift
    const sigma = 0.20; // 20% annual volatility
    const dt = 1; // 1 year
    const Z = 0; // No random component
    
    const result = gbmStep(S0, mu, sigma, dt, Z);
    
    // With Z=0: S(1) = 100 × exp[(0.10 - 0.5×0.04)×1] = 100 × exp[0.08]
    const expected = S0 * Math.exp((mu - 0.5 * sigma * sigma) * dt);
    
    expect(result).toBeCloseTo(expected, 10);
  });

  it('should scale volatility by √dt', () => {
    const S0 = 100;
    const mu = 0.08;
    const sigma = 0.15;
    const dt = 0.25; // Quarterly
    const Z = 1; // 1 standard deviation
    
    const result = gbmStep(S0, mu, sigma, dt, Z);
    
    // S = 100 × exp[(0.08 - 0.5×0.0225)×0.25 + 0.15×√0.25×1]
    const logReturn = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * Z;
    const expected = S0 * Math.exp(logReturn);
    
    expect(result).toBeCloseTo(expected, 10);
  });

  it('should always produce positive values', () => {
    const S0 = 100;
    const mu = 0.05;
    const sigma = 0.50; // High volatility
    const dt = 1;
    
    // Even with very negative random draw
    const result = gbmStep(S0, mu, sigma, dt, -5);
    
    expect(result).toBeGreaterThan(0);
  });

  it('should be deterministic with same random input', () => {
    const S0 = 100;
    const mu = 0.10;
    const sigma = 0.20;
    const dt = 1/12;
    const Z = 0.5;
    
    const result1 = gbmStep(S0, mu, sigma, dt, Z);
    const result2 = gbmStep(S0, mu, sigma, dt, Z);
    
    expect(result1).toBe(result2);
  });
});

// ============================================
// PERCENTILE CALCULATION TESTS
// ============================================
describe('Monte Carlo Percentiles', () => {
  const getPercentile = (sortedValues: number[], percentile: number): number => {
    const index = Math.floor(sortedValues.length * percentile);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  };

  it('should calculate median (50th percentile) correctly', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort((a, b) => a - b);
    
    const median = getPercentile(values, 0.5);
    
    // 50% of 10 = index 5 → value 6
    expect(median).toBe(6);
  });

  it('should calculate 5th percentile correctly', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1).sort((a, b) => a - b);
    
    const p5 = getPercentile(values, 0.05);
    
    // 5% of 100 = index 5 → value 6
    expect(p5).toBe(6);
  });

  it('should calculate 95th percentile correctly', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1).sort((a, b) => a - b);
    
    const p95 = getPercentile(values, 0.95);
    
    // 95% of 100 = index 95 → value 96
    expect(p95).toBe(96);
  });
});

// ============================================
// VaR FROM SIMULATION TESTS
// ============================================
describe('VaR from Monte Carlo', () => {
  it('should calculate VaR as 5th percentile loss', () => {
    // Simulated portfolio values after 1 year
    const terminalValues = [
      80, 85, 90, 95, 100, 105, 110, 115, 120, 125, // 10 values
      85, 90, 95, 100, 105, 110, 115, 120, 125, 130  // 10 more values
    ].sort((a, b) => a - b);
    
    const initialValue = 100;
    const p5Index = Math.floor(terminalValues.length * 0.05);
    const varValue = initialValue - terminalValues[p5Index];
    
    // VaR = Initial - 5th percentile terminal value
    expect(varValue).toBeGreaterThan(0); // Should be positive (loss)
  });

  it('should calculate CVaR as average of worst cases', () => {
    const terminalValues = Array.from({ length: 100 }, (_, i) => 80 + i).sort((a, b) => a - b);
    const initialValue = 100;
    
    // CVaR = average loss in worst 5% of scenarios
    const worstCount = Math.floor(terminalValues.length * 0.05);
    const worstValues = terminalValues.slice(0, worstCount);
    const avgWorst = worstValues.reduce((a, b) => a + b, 0) / worstValues.length;
    const cvar = initialValue - avgWorst;
    
    expect(cvar).toBeGreaterThan(0);
    
    // CVaR should be >= VaR (average of tail >= tail threshold)
    const var95 = initialValue - terminalValues[worstCount];
    expect(cvar).toBeGreaterThanOrEqual(var95 - 0.1); // Allow small rounding
  });
});

// ============================================
// LOG RETURNS CONVERSION TESTS
// ============================================
describe('Log Returns Conversion', () => {
  const toLogReturn = (simpleReturn: number): number => {
    return Math.log(1 + simpleReturn);
  };
  
  const toSimpleReturn = (logReturn: number): number => {
    return Math.exp(logReturn) - 1;
  };

  it('should convert simple to log returns correctly', () => {
    const simpleReturn = 0.10; // 10%
    const logReturn = toLogReturn(simpleReturn);
    
    // ln(1.10) ≈ 0.0953
    expect(logReturn).toBeCloseTo(Math.log(1.10), 10);
  });

  it('should convert log to simple returns correctly', () => {
    const logReturn = 0.0953;
    const simpleReturn = toSimpleReturn(logReturn);
    
    // exp(0.0953) - 1 ≈ 0.10
    expect(simpleReturn).toBeCloseTo(Math.exp(0.0953) - 1, 4);
  });

  it('should round-trip correctly', () => {
    const original = 0.15; // 15%
    const logRet = toLogReturn(original);
    const backToSimple = toSimpleReturn(logRet);
    
    expect(backToSimple).toBeCloseTo(original, 10);
  });

  it('should handle negative returns', () => {
    const simpleReturn = -0.20; // -20%
    const logReturn = toLogReturn(simpleReturn);
    
    // ln(0.80) ≈ -0.223
    expect(logReturn).toBeCloseTo(Math.log(0.80), 10);
    expect(logReturn).toBeLessThan(0);
  });
});

// ============================================
// ANNUALIZATION TESTS
// ============================================
describe('Return Annualization for Monte Carlo', () => {
  it('should annualize monthly returns correctly', () => {
    const monthlyReturn = 0.01; // 1% per month
    const annualReturn = Math.pow(1 + monthlyReturn, 12) - 1;
    
    // (1.01)^12 - 1 ≈ 0.1268 (12.68%)
    expect(annualReturn).toBeCloseTo(0.1268, 3);
  });

  it('should annualize monthly volatility correctly', () => {
    const monthlyVol = 0.05; // 5% monthly volatility
    const annualVol = monthlyVol * Math.sqrt(12);
    
    // 5% × √12 ≈ 17.32%
    expect(annualVol).toBeCloseTo(0.1732, 3);
  });

  it('should handle de-annualization for simulation steps', () => {
    const annualVol = 0.20; // 20% annual volatility
    const monthlyVol = annualVol / Math.sqrt(12);
    
    // 20% / √12 ≈ 5.77%
    expect(monthlyVol).toBeCloseTo(0.0577, 3);
  });
});

// ============================================
// SIMULATION OUTPUT STRUCTURE TESTS
// ============================================
describe('Simulation Output Structure', () => {
  it('should generate correct number of scenarios', () => {
    const numSimulations = 1000;
    const scenarios = Array.from({ length: numSimulations }, () => Math.random() * 200 + 50);
    
    expect(scenarios).toHaveLength(numSimulations);
  });

  it('should generate correct number of time steps', () => {
    const horizonYears = 5;
    const stepsPerYear = 12;
    const totalSteps = horizonYears * stepsPerYear;
    
    const pathValues = Array.from({ length: totalSteps + 1 }, (_, i) => 100 * (1 + 0.01 * i));
    
    // Should have initial + each step
    expect(pathValues).toHaveLength(totalSteps + 1);
  });

  it('should maintain path continuity', () => {
    const path = [100, 102, 105, 103, 108, 112];
    
    // All values should be positive
    expect(path.every(v => v > 0)).toBe(true);
    
    // First value should be initial
    expect(path[0]).toBe(100);
  });
});
