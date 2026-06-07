import { describe, it, expect } from 'vitest';
import { runLightweightMonteCarlo } from '../dataValidation';

describe('runLightweightMonteCarlo', () => {
  it('returns null when fewer than 3 monthly returns', () => {
    expect(runLightweightMonteCarlo([1, 2], 100_000)).toBeNull();
  });

  it('returns null when currentValue is 0', () => {
    expect(runLightweightMonteCarlo([1, 2, 3, 4], 0)).toBeNull();
  });

  it('returns null when currentValue is negative', () => {
    expect(runLightweightMonteCarlo([1, 2, 3], -100)).toBeNull();
  });

  it('returns result with correct structure for valid input', () => {
    const returns = [2, -1, 3, 0.5, -0.5, 1, 2, -1, 1.5, 0, 1, -0.3];
    const result = runLightweightMonteCarlo(returns, 100_000, 500, 3);
    expect(result).not.toBeNull();
    expect(result!.numSimulations).toBe(500);
    expect(result!.horizonYears).toBe(3);
    expect(result!.horizonResults).toHaveLength(1);
  });

  it('horizon result has all required percentile fields', () => {
    const returns = [2, -1, 3, 0.5, -0.5, 1, 2, -1, 1.5, 0, 1, -0.3];
    const result = runLightweightMonteCarlo(returns, 100_000, 500, 5);
    const hr = result!.horizonResults[0];
    expect(hr).toHaveProperty('p5');
    expect(hr).toHaveProperty('p25');
    expect(hr).toHaveProperty('p50');
    expect(hr).toHaveProperty('p75');
    expect(hr).toHaveProperty('p95');
    expect(hr).toHaveProperty('probGain');
    expect(hr).toHaveProperty('probLoss');
    expect(hr).toHaveProperty('var95');
    expect(hr).toHaveProperty('cvar95');
    expect(hr).toHaveProperty('expectedValue');
  });

  it('percentiles are in ascending order', () => {
    const returns = [2, -1, 3, 0.5, -0.5, 1, 2, -1, 1.5, 0, 1, -0.3];
    const result = runLightweightMonteCarlo(returns, 100_000, 1000, 5);
    const hr = result!.horizonResults[0];
    expect(hr.p5).toBeLessThanOrEqual(hr.p25);
    expect(hr.p25).toBeLessThanOrEqual(hr.p50);
    expect(hr.p50).toBeLessThanOrEqual(hr.p75);
    expect(hr.p75).toBeLessThanOrEqual(hr.p95);
  });

  it('probGain + probLoss = 100', () => {
    const returns = [2, -1, 3, 0.5, -0.5, 1, 2, -1, 1.5, 0, 1, -0.3];
    const result = runLightweightMonteCarlo(returns, 100_000, 500, 5);
    const hr = result!.horizonResults[0];
    expect(hr.probGain + hr.probLoss).toBeCloseTo(100, 0);
  });

  it('VaR95 is a finite number', () => {
    const returns = [2, -1, 3, 0.5, -0.5, 1, 2, -1, 1.5, 0, 1, -0.3];
    const result = runLightweightMonteCarlo(returns, 100_000, 1000, 5);
    const hr = result!.horizonResults[0];
    expect(Number.isFinite(hr.var95)).toBe(true);
  });

  it('CVaR95 is less than or equal to VaR95', () => {
    const returns = [2, -1, 3, 0.5, -0.5, 1, 2, -1, 1.5, 0, 1, -0.3];
    const result = runLightweightMonteCarlo(returns, 100_000, 1000, 5);
    const hr = result!.horizonResults[0];
    expect(hr.cvar95).toBeLessThanOrEqual(hr.var95);
  });

  it('expectedValue is positive for positive-mean returns', () => {
    const returns = [5, 3, 4, 2, 6, 3, 4, 5, 3, 4, 5, 3];
    const result = runLightweightMonteCarlo(returns, 100_000, 500, 5);
    const hr = result!.horizonResults[0];
    expect(hr.expectedValue).toBeGreaterThan(0);
  });

  it('uses default params when not specified', () => {
    const returns = [1, 2, -1, 0.5, 1, -0.5, 2, 1, -1, 0, 1, 0.5];
    const result = runLightweightMonteCarlo(returns, 100_000);
    expect(result).not.toBeNull();
    expect(result!.numSimulations).toBe(1000);
    expect(result!.horizonYears).toBe(5);
  });
});
