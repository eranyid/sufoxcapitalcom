import { describe, it, expect, vi } from 'vitest';

// Must stub localStorage before any module that imports supabase client is evaluated.
// vi.hoisted runs before all imports are resolved.
vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
});

import { getDefaultFxRate, getSupportedCurrencies } from '../fxService';

describe('getDefaultFxRate', () => {
  it('returns 1 for same currency', () => {
    expect(getDefaultFxRate('USD', 'USD')).toBe(1);
    expect(getDefaultFxRate('EUR', 'EUR')).toBe(1);
    expect(getDefaultFxRate('ILS', 'ILS')).toBe(1);
  });

  it('returns direct rate from table', () => {
    const rate = getDefaultFxRate('USD', 'EUR');
    expect(rate).toBe(0.92);
  });

  it('returns inverse rate when only reverse pair exists', () => {
    expect(getDefaultFxRate('GBP', 'USD')).toBe(1.27);
  });

  it('produces cross rate through USD for unlisted pair', () => {
    const rate = getDefaultFxRate('ILS', 'GBP');
    expect(rate).toBe(0.21);
  });

  it('inverse is approximately reciprocal', () => {
    const usdToEur = getDefaultFxRate('USD', 'EUR');
    const eurToUsd = getDefaultFxRate('EUR', 'USD');
    expect(usdToEur).toBeGreaterThan(0);
    expect(eurToUsd).toBeGreaterThan(0);
    expect(usdToEur * eurToUsd).toBeCloseTo(1, 0);
  });

  it('USD to ILS is 3.70', () => {
    expect(getDefaultFxRate('USD', 'ILS')).toBe(3.70);
  });

  it('ILS to USD is 0.27', () => {
    expect(getDefaultFxRate('ILS', 'USD')).toBe(0.27);
  });

  it('JPY rates are large (149.5 per USD)', () => {
    expect(getDefaultFxRate('USD', 'JPY')).toBe(149.5);
  });
});

describe('getSupportedCurrencies', () => {
  it('returns array of currency codes', () => {
    const currencies = getSupportedCurrencies();
    expect(currencies).toContain('USD');
    expect(currencies).toContain('EUR');
    expect(currencies).toContain('ILS');
    expect(currencies).toContain('GBP');
    expect(currencies).toContain('CHF');
    expect(currencies).toContain('JPY');
  });

  it('has at least 6 currencies', () => {
    expect(getSupportedCurrencies().length).toBeGreaterThanOrEqual(6);
  });
});
