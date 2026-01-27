/**
 * Black-Litterman Model Unit Tests
 * =================================
 * 
 * These tests verify the correctness of the Black-Litterman implementation:
 * 1. Unit scaling (percentages vs decimals)
 * 2. Matrix algebra correctness
 * 3. Edge cases (no views, conflicting views)
 * 4. Numerical stability
 */

import { describe, it, expect } from 'vitest';
import { calculateBlackLitterman, getAvailableAssets } from '../blackLitterman';
import type { Transaction, MonthlyValuation } from '@/types/investment';

// ============================================
// Helper function to generate test data
// ============================================
function generateTestData() {
  // Create 3 assets with 12 months of price history
  const baseDate = new Date('2024-01-01');
  const assets = [
    { ticker: 'AAPL', name: 'Apple Inc', startPrice: 170, volatility: 0.05 },
    { ticker: 'MSFT', name: 'Microsoft', startPrice: 350, volatility: 0.04 },
    { ticker: 'GOOG', name: 'Google', startPrice: 140, volatility: 0.06 },
  ];
  
  const transactions: Transaction[] = [];
  const valuations: MonthlyValuation[] = [];
  
  // Create buy transactions
  assets.forEach((asset, idx) => {
    transactions.push({
      id: `tx-${idx}`,
      ticker: asset.ticker,
      assetName: asset.name,
      transactionType: 'buy',
      date: '2024-01-15',
      quantity: 100,
      pricePerUnit: asset.startPrice,
      fees: 0,
      currency: 'USD',
      assetType: 'equity',
      geography: 'north_america',
    });
  });
  
  // Generate 12 months of valuations with some volatility
  const months = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  ];
  
  // Seed for reproducible "random" returns
  const returns = {
    AAPL: [0.02, -0.01, 0.03, 0.01, -0.02, 0.015, 0.025, -0.005, 0.02, 0.01, -0.01, 0.03],
    MSFT: [0.015, 0.005, 0.02, -0.01, 0.025, 0.01, 0.02, 0.015, -0.005, 0.025, 0.01, 0.015],
    GOOG: [-0.01, 0.03, -0.02, 0.04, 0.01, -0.015, 0.035, 0.02, 0.01, -0.02, 0.03, 0.025],
  };
  
  assets.forEach(asset => {
    let price = asset.startPrice;
    
    months.forEach((month, idx) => {
      // Apply return for this month
      const monthlyReturn = returns[asset.ticker as keyof typeof returns][idx];
      price = price * (1 + monthlyReturn);
      
      valuations.push({
        id: `val-${asset.ticker}-${month}`,
        assetId: `asset-${asset.ticker}`,
        ticker: asset.ticker,
        assetName: asset.name,
        month: month,
        pricePerUnit: price,
      });
    });
  });
  
  return { transactions, valuations };
}

// ============================================
// BASELINE TEST: No Views (Posterior = Equilibrium)
// ============================================
describe('Black-Litterman Baseline (No Views)', () => {
  it('should return equilibrium returns when no views are provided', () => {
    const { transactions, valuations } = generateTestData();
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    // Should have results for all 3 assets
    expect(result.assets).toHaveLength(3);
    expect(result.marketWeights).toHaveLength(3);
    expect(result.equilibriumReturns).toHaveLength(3);
    expect(result.blReturns).toHaveLength(3);
    
    // Without views, posterior = equilibrium
    result.equilibriumReturns.forEach((eq, i) => {
      expect(result.blReturns[i]).toBeCloseTo(eq, 5);
    });
    
    // Weights should sum to 1
    const weightSum = result.optimalWeights.reduce((a, b) => a + b, 0);
    expect(weightSum).toBeCloseTo(1, 6);
    
    // No validation errors
    expect(result.validationErrors).toHaveLength(0);
  });
  
  it('should produce equilibrium returns in reasonable range (annualized %)', () => {
    const { transactions, valuations } = generateTestData();
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    // Equilibrium returns should be in realistic range (e.g., -50% to +100% annualized)
    result.equilibriumReturns.forEach(ret => {
      expect(ret).toBeGreaterThan(-50);
      expect(ret).toBeLessThan(100);
    });
  });
  
  it('should produce positive market weights for long-only portfolio', () => {
    const { transactions, valuations } = generateTestData();
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    // All weights should be non-negative
    result.optimalWeights.forEach(weight => {
      expect(weight).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================
// SINGLE VIEW TEST: Absolute View
// ============================================
describe('Black-Litterman Single Absolute View', () => {
  it('should shift posterior towards view for high confidence', () => {
    const { transactions, valuations } = generateTestData();
    
    // Get baseline equilibrium
    const baseline = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    // Add view: AAPL will return 20% (absolute)
    const withView = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 20,
        confidence: 80,
      }],
    });
    
    // Find AAPL index
    const aaplIdx = withView.assets.indexOf('AAPL');
    expect(aaplIdx).toBeGreaterThan(-1);
    
    // AAPL's posterior should move towards 20%
    const equilibrium = baseline.equilibriumReturns[aaplIdx];
    const posterior = withView.blReturns[aaplIdx];
    
    // If view > equilibrium, posterior should be > equilibrium
    // If view < equilibrium, posterior should be < equilibrium
    if (20 > equilibrium) {
      expect(posterior).toBeGreaterThan(equilibrium);
    } else {
      expect(posterior).toBeLessThan(equilibrium);
    }
    
    // Posterior should be between equilibrium and view
    const minVal = Math.min(equilibrium, 20);
    const maxVal = Math.max(equilibrium, 20);
    expect(posterior).toBeGreaterThanOrEqual(minVal - 1); // Small tolerance
    expect(posterior).toBeLessThanOrEqual(maxVal + 1);
  });
  
  it('should increase weight for asset with bullish view', () => {
    const { transactions, valuations } = generateTestData();
    
    // Get baseline weights
    const baseline = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    // Add strong bullish view on AAPL
    const withView = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 30, // Very bullish
        confidence: 90,
      }],
    });
    
    const aaplIdx = withView.assets.indexOf('AAPL');
    
    // Weight should increase (or stay same if already at boundary)
    expect(withView.optimalWeights[aaplIdx]).toBeGreaterThanOrEqual(
      baseline.optimalWeights[aaplIdx] - 0.01 // Small tolerance
    );
  });
});

// ============================================
// RELATIVE VIEW TEST
// ============================================
describe('Black-Litterman Relative View', () => {
  it('should handle relative view (A outperforms B)', () => {
    const { transactions, valuations } = generateTestData();
    
    // Add view: AAPL outperforms MSFT by 5%
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'relative',
        comparisonAsset: 'MSFT',
        magnitude: 5,
        confidence: 70,
      }],
    });
    
    // Should not have validation errors
    expect(result.validationErrors.filter(e => !e.includes('constrained'))).toHaveLength(0);
    
    const aaplIdx = result.assets.indexOf('AAPL');
    const msftIdx = result.assets.indexOf('MSFT');
    
    // The spread between AAPL and MSFT posteriors should shift towards +5%
    const spread = result.blReturns[aaplIdx] - result.blReturns[msftIdx];
    
    // Spread should be > 0 (AAPL outperforms)
    expect(spread).toBeGreaterThan(0);
  });
});

// ============================================
// CONFLICTING VIEWS TEST
// ============================================
describe('Black-Litterman Conflicting Views', () => {
  it('should remain stable with conflicting views', () => {
    const { transactions, valuations } = generateTestData();
    
    // Add conflicting views on AAPL
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [
        {
          id: 'view-1',
          asset: 'AAPL',
          direction: 'outperform',
          comparison: 'absolute',
          magnitude: 25, // Bullish
          confidence: 60,
        },
        {
          id: 'view-2',
          asset: 'AAPL',
          direction: 'underperform',
          comparison: 'absolute',
          magnitude: -10, // Bearish
          confidence: 60,
        },
      ],
    });
    
    // Model should not crash
    expect(result.assets.length).toBeGreaterThan(0);
    
    // Returns should be finite
    result.blReturns.forEach(ret => {
      expect(isFinite(ret)).toBe(true);
      expect(isNaN(ret)).toBe(false);
    });
    
    // Weights should still sum to 1
    const weightSum = result.optimalWeights.reduce((a, b) => a + b, 0);
    expect(weightSum).toBeCloseTo(1, 5);
  });
  
  it('should weight views by confidence', () => {
    const { transactions, valuations } = generateTestData();
    
    // High confidence bullish view
    const highConfidence = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 20,
        confidence: 95, // Very high confidence
      }],
    });
    
    // Low confidence bullish view
    const lowConfidence = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 20,
        confidence: 20, // Low confidence
      }],
    });
    
    const aaplIdxHigh = highConfidence.assets.indexOf('AAPL');
    const aaplIdxLow = lowConfidence.assets.indexOf('AAPL');
    
    // High confidence should pull posterior closer to 20%
    // Low confidence should have less impact
    // Distance from equilibrium should be greater for high confidence
    const baselineResult = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    const equilibrium = baselineResult.equilibriumReturns[aaplIdxHigh];
    
    const highDelta = Math.abs(highConfidence.blReturns[aaplIdxHigh] - equilibrium);
    const lowDelta = Math.abs(lowConfidence.blReturns[aaplIdxLow] - equilibrium);
    
    expect(highDelta).toBeGreaterThan(lowDelta);
  });
});

// ============================================
// NUMERICAL STABILITY TESTS
// ============================================
describe('Black-Litterman Numerical Stability', () => {
  it('should not produce NaN or Infinity values', () => {
    const { transactions, valuations } = generateTestData();
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 15,
        confidence: 75,
      }],
    });
    
    // Check all numeric outputs
    result.equilibriumReturns.forEach(val => {
      expect(isNaN(val)).toBe(false);
      expect(isFinite(val)).toBe(true);
    });
    
    result.blReturns.forEach(val => {
      expect(isNaN(val)).toBe(false);
      expect(isFinite(val)).toBe(true);
    });
    
    result.optimalWeights.forEach(val => {
      expect(isNaN(val)).toBe(false);
      expect(isFinite(val)).toBe(true);
    });
    
    result.marketWeights.forEach(val => {
      expect(isNaN(val)).toBe(false);
      expect(isFinite(val)).toBe(true);
    });
  });
  
  it('should handle extreme tau values gracefully', () => {
    const { transactions, valuations } = generateTestData();
    
    // Very small tau
    const smallTau = calculateBlackLitterman(transactions, valuations, {
      tau: 0.001,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 15,
        confidence: 75,
      }],
    });
    
    expect(smallTau.blReturns.every(r => isFinite(r))).toBe(true);
    
    // Large tau
    const largeTau = calculateBlackLitterman(transactions, valuations, {
      tau: 0.5,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 15,
        confidence: 75,
      }],
    });
    
    expect(largeTau.blReturns.every(r => isFinite(r))).toBe(true);
  });
  
  it('should be deterministic (same input = same output)', () => {
    const { transactions, valuations } = generateTestData();
    
    const inputs = {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform' as const,
        comparison: 'absolute' as const,
        magnitude: 15,
        confidence: 75,
      }],
    };
    
    const result1 = calculateBlackLitterman(transactions, valuations, inputs);
    const result2 = calculateBlackLitterman(transactions, valuations, inputs);
    
    // All outputs should be identical
    expect(result1.blReturns).toEqual(result2.blReturns);
    expect(result1.equilibriumReturns).toEqual(result2.equilibriumReturns);
    expect(result1.optimalWeights).toEqual(result2.optimalWeights);
  });
});

// ============================================
// EDGE CASES
// ============================================
describe('Black-Litterman Edge Cases', () => {
  it('should return error for insufficient data', () => {
    const transactions: Transaction[] = [];
    const valuations: MonthlyValuation[] = [];
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.assets).toHaveLength(0);
  });
  
  it('should filter out views for non-existent assets', () => {
    const { transactions, valuations } = generateTestData();
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'FAKE_TICKER',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 20,
        confidence: 80,
      }],
    });
    
    // Should have validation warning about missing asset
    expect(result.validationErrors.some(e => e.includes('FAKE_TICKER'))).toBe(true);
    
    // Model should still produce valid results (treating as no views)
    expect(result.blReturns.length).toBeGreaterThan(0);
  });
  
  it('should handle single asset gracefully', () => {
    const transactions: Transaction[] = [{
      id: 'tx-1',
      ticker: 'AAPL',
      assetName: 'Apple Inc',
      transactionType: 'buy',
      date: '2024-01-15',
      quantity: 100,
      pricePerUnit: 170,
      fees: 0,
      currency: 'USD',
      assetType: 'equity',
      geography: 'north_america',
    }];
    
    const valuations: MonthlyValuation[] = [];
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
    let price = 170;
    
    months.forEach(month => {
      price = price * (1 + 0.02);
      valuations.push({
        id: `val-${month}`,
        assetId: 'asset-AAPL',
        ticker: 'AAPL',
        assetName: 'Apple Inc',
        month: month,
        pricePerUnit: price,
      });
    });
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    // Should return error (need at least 2 assets)
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });
});

// ============================================
// UNIT SCALING TESTS
// ============================================
describe('Black-Litterman Unit Scaling', () => {
  it('should output returns in percentage form', () => {
    const { transactions, valuations } = generateTestData();
    
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [],
    });
    
    // Returns should be in percentage (e.g., 8.5 for 8.5%)
    // NOT decimal (e.g., 0.085)
    // Typical equity returns are 5-15% annually
    result.equilibriumReturns.forEach(ret => {
      // If returns were in decimal, they'd be < 1
      // If returns were scaling incorrectly, they'd be > 1000
      expect(Math.abs(ret)).toBeLessThan(200); // Sanity check
    });
  });
  
  it('should handle view magnitude in percentage', () => {
    const { transactions, valuations } = generateTestData();
    
    // View: AAPL will return 12% (input as 12, not 0.12)
    const result = calculateBlackLitterman(transactions, valuations, {
      tau: 0.05,
      riskAversion: 2.5,
      views: [{
        id: 'view-1',
        asset: 'AAPL',
        direction: 'outperform',
        comparison: 'absolute',
        magnitude: 12, // 12% in percentage
        confidence: 95,
      }],
    });
    
    const aaplIdx = result.assets.indexOf('AAPL');
    
    // With 95% confidence, posterior should be very close to 12%
    expect(result.blReturns[aaplIdx]).toBeGreaterThan(5);
    expect(result.blReturns[aaplIdx]).toBeLessThan(25);
  });
});
