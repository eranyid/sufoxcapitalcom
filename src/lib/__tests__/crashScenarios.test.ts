import { describe, it, expect } from 'vitest';
import {
  CRASH_SCENARIOS,
  KNOWN_INCEPTION_YEARS,
  assetExistedInScenario,
  getKnownInceptionYear,
  getCrashScenarioKeys,
} from '../crashScenarios';

describe('CRASH_SCENARIOS', () => {
  it('contains all four historical scenarios', () => {
    expect(Object.keys(CRASH_SCENARIOS)).toEqual(
      expect.arrayContaining(['DOT_COM', 'GFC_2008', 'COVID_2020', 'TECH_2022']),
    );
  });

  it('each scenario has drawdowns for all asset types', () => {
    const expectedTypes = [
      'equity', 'etf', 'mutual_fund', 'crypto', 'bond',
      'commodity', 'real_estate', 'cash', 'alternative',
      'private_equity', 'private_debt', 'hedge_fund',
    ];
    for (const scenario of Object.values(CRASH_SCENARIOS)) {
      for (const type of expectedTypes) {
        expect(scenario.drawdowns).toHaveProperty(type);
      }
    }
  });

  it('cash drawdown is always 0', () => {
    for (const scenario of Object.values(CRASH_SCENARIOS)) {
      expect(scenario.drawdowns.cash).toBe(0);
    }
  });

  it('GFC_2008 has the deepest equity drawdown', () => {
    const gfc = CRASH_SCENARIOS.GFC_2008.drawdowns.equity;
    const dotcom = CRASH_SCENARIOS.DOT_COM.drawdowns.equity;
    const covid = CRASH_SCENARIOS.COVID_2020.drawdowns.equity;
    const tech = CRASH_SCENARIOS.TECH_2022.drawdowns.equity;
    expect(gfc).toBeLessThan(dotcom);
    expect(gfc).toBeLessThan(covid);
    expect(gfc).toBeLessThan(tech);
  });
});

describe('assetExistedInScenario', () => {
  const dotcom = CRASH_SCENARIOS.DOT_COM;

  it('returns true when asset predates scenario', () => {
    expect(assetExistedInScenario(1990, dotcom)).toBe(true);
  });

  it('returns true when asset launched same year as scenario start', () => {
    expect(assetExistedInScenario(2000, dotcom)).toBe(true);
  });

  it('returns false when asset launched after scenario start', () => {
    expect(assetExistedInScenario(2001, dotcom)).toBe(false);
  });

  it('returns true when inception year is null/undefined', () => {
    expect(assetExistedInScenario(null, dotcom)).toBe(true);
    expect(assetExistedInScenario(undefined, dotcom)).toBe(true);
  });
});

describe('getKnownInceptionYear', () => {
  it('returns known year for AAPL', () => {
    expect(getKnownInceptionYear('AAPL')).toBe(1980);
  });

  it('is case-insensitive', () => {
    expect(getKnownInceptionYear('aapl')).toBe(1980);
  });

  it('returns undefined for unknown ticker', () => {
    expect(getKnownInceptionYear('ZZZZZ')).toBeUndefined();
  });

  it('returns known year for crypto (BTC)', () => {
    expect(getKnownInceptionYear('BTC')).toBe(2009);
  });

  it('returns known year for ETF (SPY)', () => {
    expect(getKnownInceptionYear('SPY')).toBe(1993);
  });
});

describe('getCrashScenarioKeys', () => {
  it('returns keys in chronological order', () => {
    expect(getCrashScenarioKeys()).toEqual([
      'DOT_COM', 'GFC_2008', 'COVID_2020', 'TECH_2022',
    ]);
  });
});

describe('KNOWN_INCEPTION_YEARS', () => {
  it('has reasonable year values', () => {
    for (const [ticker, year] of Object.entries(KNOWN_INCEPTION_YEARS)) {
      expect(year).toBeGreaterThanOrEqual(1890);
      expect(year).toBeLessThanOrEqual(new Date().getFullYear());
    }
  });
});
