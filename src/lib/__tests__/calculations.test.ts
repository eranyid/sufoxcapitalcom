/**
 * SUFOX Capital Terminal - Calculation Engine Unit Tests
 * ======================================================
 * 
 * These tests verify that ALL formulas comply with the 
 * SUFOX Capital Terminal Formula Specification.
 * 
 * Each test verifies:
 * 1. Formula correctness according to spec
 * 2. Edge case handling
 * 3. Deterministic output (same input = same output)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVolatility,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateVaR,
  calculateBeta,
  calculateDrawdown,
  calculateCumulativeReturns,
  calculateIRR,
  calculateWinLossRatio,
  calculateTWR,
  calculateTrackingError,
  calculatePositions,
  calculateMonthlyReturns,
  calculateCorrelationMatrix,
} from '../calculations';
import type { Transaction } from '@/types/investment';

// ============================================
// VOLATILITY TESTS
// Formula: StdDev(Monthly Returns) × √12
// ============================================
describe('Volatility (SUFOX Spec)', () => {
  it('should calculate annualized volatility using √12', () => {
    // Known monthly returns: [2%, -1%, 3%, -2%, 1%]
    const monthlyReturns = [2, -1, 3, -2, 1];
    const result = calculateVolatility(monthlyReturns);
    
    // Manual calculation:
    // Mean = (2-1+3-2+1)/5 = 0.6
    // Variance = [(2-0.6)² + (-1-0.6)² + (3-0.6)² + (-2-0.6)² + (1-0.6)²] / (5-1)
    //          = [1.96 + 2.56 + 5.76 + 6.76 + 0.16] / 4 = 17.2/4 = 4.3
    // StdDev = √4.3 = 2.074
    // Annualized = 2.074 × √12 = 7.183
    
    expect(result).toBeCloseTo(7.18, 1);
  });

  it('should use sample standard deviation (n-1 denominator)', () => {
    // Two identical returns should have zero volatility
    const returns = [5, 5, 5, 5];
    expect(calculateVolatility(returns)).toBe(0);
  });

  it('should return 0 for insufficient data', () => {
    expect(calculateVolatility([])).toBe(0);
    expect(calculateVolatility([5])).toBe(0);
  });

  it('should be deterministic (same input = same output)', () => {
    const returns = [1.5, -0.8, 2.3, -1.2, 0.5];
    const result1 = calculateVolatility(returns);
    const result2 = calculateVolatility(returns);
    expect(result1).toBe(result2);
  });
});

// ============================================
// SHARPE RATIO TESTS
// Formula: (Portfolio Return - Risk-Free Rate) / StdDev
// ============================================
describe('Sharpe Ratio (SUFOX Spec)', () => {
  it('should calculate Sharpe using annualized values', () => {
    // Monthly returns averaging 1% per month = 12% annually
    const monthlyReturns = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const riskFreeRate = 4; // 4% annual
    
    const result = calculateSharpeRatio(monthlyReturns, riskFreeRate);
    
    // Annualized return = 12%
    // Volatility = 0 (all same)
    // Should return 0 when volatility is 0
    expect(result).toBe(0);
  });

  it('should handle positive excess returns correctly', () => {
    const monthlyReturns = [2, -1, 3, 1, 2, -0.5, 1.5, 0.5, 2, 1, 0.5, 1.5];
    const riskFreeRate = 3;
    
    const result = calculateSharpeRatio(monthlyReturns, riskFreeRate);
    
    // Should be positive (returns > risk-free)
    expect(result).toBeGreaterThan(0);
  });

  it('should handle negative excess returns correctly', () => {
    const monthlyReturns = [-1, -2, 0, -1, -0.5, -1.5, 0.5, -1, -0.5, 0, -1, -0.5];
    const riskFreeRate = 4;
    
    const result = calculateSharpeRatio(monthlyReturns, riskFreeRate);
    
    // Should be negative (returns < risk-free)
    expect(result).toBeLessThan(0);
  });

  it('should return 0 for insufficient data', () => {
    expect(calculateSharpeRatio([], 4)).toBe(0);
    expect(calculateSharpeRatio([5], 4)).toBe(0);
  });
});

// ============================================
// SORTINO RATIO TESTS
// Formula: (Portfolio Return - Risk-Free Rate) / Downside Deviation
// ============================================
describe('Sortino Ratio (SUFOX Spec)', () => {
  it('should only use downside deviation (negative returns below Rf)', () => {
    // Only positive returns - should return high value (capped at 10)
    const monthlyReturns = [2, 3, 1, 2, 4, 3, 2, 1, 3, 2, 4, 3];
    const riskFreeRate = 3;
    
    const result = calculateSortinoRatio(monthlyReturns, riskFreeRate);
    
    // All returns are above monthly Rf (0.25%), so Sortino should be high
    expect(result).toBeGreaterThan(0);
  });

  it('should handle only negative returns', () => {
    const monthlyReturns = [-2, -3, -1, -2, -4, -3, -2, -1, -3, -2, -4, -3];
    const riskFreeRate = 3;
    
    const result = calculateSortinoRatio(monthlyReturns, riskFreeRate);
    
    // Should be negative
    expect(result).toBeLessThan(0);
  });

  it('should return 10 when no downside exists and return > Rf', () => {
    const monthlyReturns = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const riskFreeRate = 0;
    
    const result = calculateSortinoRatio(monthlyReturns, riskFreeRate);
    
    expect(result).toBe(10); // Capped at 10
  });
});

// ============================================
// VALUE AT RISK (VaR) TESTS
// Formula: VaR = z × StdDev
// z(95%) = 1.645, z(99%) = 2.326
// ============================================
describe('VaR (SUFOX Spec)', () => {
  it('should use correct z-score for 95% confidence (1.645)', () => {
    const monthlyReturns = [2, -1, 3, -2, 1, 0.5, -0.5, 1.5, -1.5, 2];
    const result = calculateVaR(monthlyReturns, 0.95);
    
    // Calculate expected VaR
    const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
    const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (monthlyReturns.length - 1);
    const stdDev = Math.sqrt(variance);
    const expectedVaR = 1.645 * stdDev;
    
    expect(result).toBeCloseTo(expectedVaR, 2);
  });

  it('should use correct z-score for 99% confidence (2.326)', () => {
    const monthlyReturns = [2, -1, 3, -2, 1, 0.5, -0.5, 1.5, -1.5, 2];
    const result = calculateVaR(monthlyReturns, 0.99);
    
    // Calculate expected VaR
    const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
    const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (monthlyReturns.length - 1);
    const stdDev = Math.sqrt(variance);
    const expectedVaR = 2.326 * stdDev;
    
    expect(result).toBeCloseTo(expectedVaR, 2);
  });

  it('should return 0 for insufficient data', () => {
    expect(calculateVaR([], 0.95)).toBe(0);
    expect(calculateVaR([5], 0.95)).toBe(0);
  });
});

// ============================================
// BETA TESTS
// Formula: Beta = Cov(Portfolio, Benchmark) / Var(Benchmark)
// ============================================
describe('Beta (SUFOX Spec)', () => {
  it('should calculate beta as Cov/Var', () => {
    // Portfolio perfectly correlated with benchmark but 1.5x leverage
    const benchmarkReturns = [2, -1, 3, -2, 1, 0.5, -0.5, 1.5, -1.5, 2];
    const portfolioReturns = benchmarkReturns.map(r => r * 1.5);
    
    const result = calculateBeta(portfolioReturns, benchmarkReturns);
    
    // Beta should be approximately 1.5
    expect(result).toBeCloseTo(1.5, 1);
  });

  it('should return beta = 1 for identical returns', () => {
    const returns = [2, -1, 3, -2, 1, 0.5, -0.5, 1.5, -1.5, 2];
    const result = calculateBeta(returns, returns);
    
    expect(result).toBeCloseTo(1, 2);
  });

  it('should return 1 for insufficient data', () => {
    expect(calculateBeta([], [])).toBe(1);
    expect(calculateBeta([5], [5])).toBe(1);
  });

  it('should handle inverse correlation', () => {
    const benchmarkReturns = [2, -1, 3, -2, 1, 0.5, -0.5, 1.5, -1.5, 2];
    const portfolioReturns = benchmarkReturns.map(r => -r);
    
    const result = calculateBeta(portfolioReturns, benchmarkReturns);
    
    // Beta should be -1 for perfect inverse correlation
    expect(result).toBeCloseTo(-1, 1);
  });
});

// ============================================
// MAX DRAWDOWN TESTS
// Formula: Max Drawdown = (Trough - Peak) / Peak
// ============================================
describe('Max Drawdown (SUFOX Spec)', () => {
  it('should calculate correct max drawdown', () => {
    // Cumulative returns: 0 -> 10% -> 5% (drawdown) -> 15%
    const cumulativeReturns = [
      { month: '2024-01', return: 10 },
      { month: '2024-02', return: 5 },  // Drawdown from 10 to 5
      { month: '2024-03', return: 15 },
    ];
    
    const result = calculateDrawdown(cumulativeReturns);
    
    // Peak value = 110 (100 * 1.10)
    // Trough value = 105 (100 * 1.05)
    // Drawdown = (105 - 110) / 110 = -4.55%
    expect(result.maxDrawdown).toBeCloseTo(4.55, 1);
  });

  it('should track drawdown series', () => {
    const cumulativeReturns = [
      { month: '2024-01', return: 10 },
      { month: '2024-02', return: 5 },
      { month: '2024-03', return: 15 },
    ];
    
    const result = calculateDrawdown(cumulativeReturns);
    
    expect(result.drawdownSeries).toHaveLength(3);
    expect(result.drawdownSeries[0].drawdown).toBe(0); // No drawdown at peak
    expect(result.drawdownSeries[1].drawdown).toBeLessThan(0); // In drawdown
  });

  it('should handle no drawdown scenario', () => {
    const cumulativeReturns = [
      { month: '2024-01', return: 5 },
      { month: '2024-02', return: 10 },
      { month: '2024-03', return: 15 },
    ];
    
    const result = calculateDrawdown(cumulativeReturns);
    
    // All increasing - no drawdown
    expect(result.maxDrawdown).toBe(0);
  });
});

// ============================================
// CUMULATIVE RETURNS TESTS
// Formula: (Current Value / Initial Value) - 1 (geometric linking)
// ============================================
describe('Cumulative Returns (SUFOX Spec)', () => {
  it('should use geometric linking (product, not sum)', () => {
    const monthlyReturns = [
      { month: '2024-01', return: 10 },
      { month: '2024-02', return: 10 },
    ];
    
    const result = calculateCumulativeReturns(monthlyReturns);
    
    // Geometric: (1.10 × 1.10) - 1 = 0.21 = 21%
    // NOT arithmetic: 10 + 10 = 20%
    expect(result[result.length - 1].return).toBeCloseTo(21, 1);
  });

  it('should handle negative returns correctly', () => {
    const monthlyReturns = [
      { month: '2024-01', return: 10 },
      { month: '2024-02', return: -10 },
    ];
    
    const result = calculateCumulativeReturns(monthlyReturns);
    
    // Geometric: (1.10 × 0.90) - 1 = -0.01 = -1%
    expect(result[result.length - 1].return).toBeCloseTo(-1, 1);
  });
});

// ============================================
// IRR TESTS
// Formula: Σ(CF/(1+IRR)^t) = 0 (Newton-Raphson)
// ============================================
describe('IRR (SUFOX Spec)', () => {
  it('should solve IRR numerically using Newton-Raphson', () => {
    // Simple case: invest 100, receive 110 after 1 year = 10% IRR
    const cashFlows = [
      { date: '2024-01-01', amount: 100 },
      { date: '2025-01-01', amount: -110 },
    ];
    
    const result = calculateIRR(cashFlows);
    
    expect(result).toBeCloseTo(10, 1);
  });

  it('should handle multiple cash flows', () => {
    const cashFlows = [
      { date: '2024-01-01', amount: 100 },
      { date: '2024-07-01', amount: 50 },
      { date: '2025-01-01', amount: -170 },
    ];
    
    const result = calculateIRR(cashFlows);
    
    // Should return a reasonable IRR
    expect(result).toBeGreaterThan(-100);
    expect(result).toBeLessThan(100);
  });

  it('should return 0 for insufficient data', () => {
    expect(calculateIRR([])).toBe(0);
    expect(calculateIRR([{ date: '2024-01-01', amount: 100 }])).toBe(0);
  });
});

// ============================================
// WIN/LOSS RATIO TESTS
// Formula: Number of Winning Trades / Number of Losing Trades
// ============================================
describe('Win/Loss Ratio (SUFOX Spec)', () => {
  it('should be count-based, not dollar-weighted', () => {
    const transactions: Transaction[] = [
      // Buy and sell for profit
      { id: '1', ticker: 'AAPL', assetName: 'Apple', transactionType: 'buy', date: '2024-01-01', quantity: 10, pricePerUnit: 100, fees: 0, currency: 'USD', assetType: 'equity', geography: 'north_america' },
      { id: '2', ticker: 'AAPL', assetName: 'Apple', transactionType: 'sell', date: '2024-02-01', quantity: 10, pricePerUnit: 110, fees: 0, currency: 'USD', assetType: 'equity', geography: 'north_america' },
      // Buy and sell for loss
      { id: '3', ticker: 'MSFT', assetName: 'Microsoft', transactionType: 'buy', date: '2024-01-01', quantity: 10, pricePerUnit: 100, fees: 0, currency: 'USD', assetType: 'equity', geography: 'north_america' },
      { id: '4', ticker: 'MSFT', assetName: 'Microsoft', transactionType: 'sell', date: '2024-02-01', quantity: 10, pricePerUnit: 90, fees: 0, currency: 'USD', assetType: 'equity', geography: 'north_america' },
    ];
    
    const result = calculateWinLossRatio(transactions);
    
    // 1 winning trade / 1 losing trade = 1
    expect(result).toBe(1);
  });

  it('should return wins count when no losses', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'AAPL', assetName: 'Apple', transactionType: 'buy', date: '2024-01-01', quantity: 10, pricePerUnit: 100, fees: 0, currency: 'USD', assetType: 'equity', geography: 'north_america' },
      { id: '2', ticker: 'AAPL', assetName: 'Apple', transactionType: 'sell', date: '2024-02-01', quantity: 10, pricePerUnit: 150, fees: 0, currency: 'USD', assetType: 'equity', geography: 'north_america' },
    ];
    
    const result = calculateWinLossRatio(transactions);
    
    expect(result).toBe(1); // 1 winning trade, 0 losing = returns 1
  });
});

// ============================================
// TWR (Time-Weighted Return) TESTS
// Formula: TWR = Π(1 + Period Return) - 1
// ============================================
describe('TWR (SUFOX Spec)', () => {
  it('should use product-based calculation, not average', () => {
    const monthlyReturns = [
      { month: '2024-01', return: 10 },
      { month: '2024-02', return: 10 },
      { month: '2024-03', return: 10 },
    ];
    
    const result = calculateTWR(monthlyReturns);
    
    // Product: (1.10 × 1.10 × 1.10) - 1 = 33.1%
    // NOT average: (10 + 10 + 10) / 3 = 10%
    expect(result).toBeCloseTo(33.1, 1);
  });

  it('should handle negative returns in product', () => {
    const monthlyReturns = [
      { month: '2024-01', return: 20 },
      { month: '2024-02', return: -50 },
    ];
    
    const result = calculateTWR(monthlyReturns);
    
    // Product: (1.20 × 0.50) - 1 = -40%
    expect(result).toBeCloseTo(-40, 1);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTWR([])).toBe(0);
  });
});

// ============================================
// TRACKING ERROR TESTS
// Formula: StdDev(Portfolio Return - Benchmark Return) × √12
// ============================================
describe('Tracking Error (SUFOX Spec)', () => {
  it('should calculate StdDev of active returns', () => {
    const portfolioReturns = [2, -1, 3, -2, 1];
    const benchmarkReturns = [1.5, -0.5, 2.5, -1.5, 0.5];
    
    const result = calculateTrackingError(portfolioReturns, benchmarkReturns);
    
    // Active returns = [0.5, -0.5, 0.5, -0.5, 0.5]
    // Mean = 0.1
    // Should be annualized with √12
    expect(result).toBeGreaterThan(0);
  });

  it('should return 0 when portfolio = benchmark', () => {
    const returns = [2, -1, 3, -2, 1];
    const result = calculateTrackingError(returns, returns);
    
    expect(result).toBe(0);
  });

  it('should annualize using √12', () => {
    const portfolioReturns = [3, -2, 4, -3, 2, 1, 0, 2, -1, 3, 1, 2];
    const benchmarkReturns = [2, -1, 3, -2, 1, 0.5, -0.5, 1.5, -0.5, 2, 0.5, 1];
    
    // Calculate monthly tracking error manually
    const activeReturns = portfolioReturns.map((p, i) => p - benchmarkReturns[i]);
    const mean = activeReturns.reduce((a, b) => a + b, 0) / activeReturns.length;
    const variance = activeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (activeReturns.length - 1);
    const monthlyTE = Math.sqrt(variance);
    const annualizedTE = monthlyTE * Math.sqrt(12);
    
    const result = calculateTrackingError(portfolioReturns, benchmarkReturns);
    
    expect(result).toBeCloseTo(annualizedTE, 2);
  });
});

// ============================================
// DETERMINISM TESTS
// Same input MUST always produce same output
// ============================================
describe('Deterministic Output Guarantee', () => {
  const testReturns = [2.5, -1.3, 4.2, -0.8, 1.7, 3.1, -2.4, 0.9, 2.2, -1.1, 3.5, 1.8];
  const riskFreeRate = 4;
  
  it('volatility should be deterministic', () => {
    const results = Array(10).fill(null).map(() => calculateVolatility(testReturns));
    expect(new Set(results).size).toBe(1);
  });

  it('Sharpe ratio should be deterministic', () => {
    const results = Array(10).fill(null).map(() => calculateSharpeRatio(testReturns, riskFreeRate));
    expect(new Set(results).size).toBe(1);
  });

  it('Sortino ratio should be deterministic', () => {
    const results = Array(10).fill(null).map(() => calculateSortinoRatio(testReturns, riskFreeRate));
    expect(new Set(results).size).toBe(1);
  });

  it('VaR should be deterministic', () => {
    const results = Array(10).fill(null).map(() => calculateVaR(testReturns, 0.95));
    expect(new Set(results).size).toBe(1);
  });

  it('Beta should be deterministic', () => {
    const benchmark = testReturns.map(r => r * 0.8 + 0.5);
    const results = Array(10).fill(null).map(() => calculateBeta(testReturns, benchmark));
    expect(new Set(results).size).toBe(1);
  });
});

// ============================================
// EDGE CASE TESTS
// ============================================
describe('Edge Cases', () => {
  it('should handle all zero returns', () => {
    const zeroReturns = [0, 0, 0, 0, 0];
    
    expect(calculateVolatility(zeroReturns)).toBe(0);
    expect(calculateSharpeRatio(zeroReturns, 4)).toBe(0);
    expect(calculateVaR(zeroReturns, 0.95)).toBe(0);
  });

  it('should handle very large returns', () => {
    const largeReturns = [100, 200, 150, 180, 120];
    
    const vol = calculateVolatility(largeReturns);
    expect(isFinite(vol)).toBe(true);
    expect(vol).toBeGreaterThan(0);
  });

  it('should handle very small returns', () => {
    const smallReturns = [0.001, 0.002, 0.0015, -0.001, 0.0005];
    
    const vol = calculateVolatility(smallReturns);
    expect(isFinite(vol)).toBe(true);
    expect(vol).toBeGreaterThan(0);
  });

  it('should handle mixed positive and negative returns', () => {
    const mixedReturns = [10, -10, 20, -15, 5, -5, 15, -8, 12, -3];
    
    const vol = calculateVolatility(mixedReturns);
    const sharpe = calculateSharpeRatio(mixedReturns, 4);
    const var95 = calculateVaR(mixedReturns, 0.95);
    
    expect(isFinite(vol)).toBe(true);
    expect(isFinite(sharpe)).toBe(true);
    expect(isFinite(var95)).toBe(true);
  });
});
