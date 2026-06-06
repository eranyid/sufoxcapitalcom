import { describe, it, expect } from 'vitest';
import type { Position } from '@/types/allocationBuilder';
import {
  calculateTotalAllocation,
  validateAllocation,
  groupPositionsBy,
  calculateConcentration,
  calculateDiversification,
  calculateLiquidityExposure,
  calculateCurrencyExposure,
  detectImbalances,
  generateStructuralInsights,
  generateSankeyData,
} from '../allocationAnalytics';

// --------------- helpers ---------------

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'Test Asset',
    assetType: 'equity',
    allocation: 25,
    region: 'north_america',
    country: 'US',
    sector: 'Technology',
    industry: 'Software',
    currency: 'USD',
    liquidityBucket: 'highly_liquid',
    styleTags: ['growth'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  };
}

function equalWeightPortfolio(n: number): Position[] {
  const alloc = 100 / n;
  return Array.from({ length: n }, (_, i) =>
    makePosition({ id: String(i), name: `Asset ${i}`, allocation: alloc }),
  );
}

// --------------- calculateTotalAllocation ---------------

describe('calculateTotalAllocation', () => {
  it('sums allocations', () => {
    const positions = [makePosition({ allocation: 40 }), makePosition({ allocation: 60 })];
    expect(calculateTotalAllocation(positions)).toBe(100);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalAllocation([])).toBe(0);
  });
});

// --------------- validateAllocation ---------------

describe('validateAllocation', () => {
  it('valid when total is 100', () => {
    const result = validateAllocation([makePosition({ allocation: 60 }), makePosition({ allocation: 40 })]);
    expect(result.isValid).toBe(true);
    expect(result.total).toBe(100);
    expect(result.deviation).toBeCloseTo(0);
  });

  it('invalid when total deviates from 100', () => {
    const result = validateAllocation([makePosition({ allocation: 80 })]);
    expect(result.isValid).toBe(false);
    expect(result.deviation).toBeCloseTo(-20);
  });
});

// --------------- groupPositionsBy ---------------

describe('groupPositionsBy', () => {
  it('groups by assetType', () => {
    const positions = [
      makePosition({ assetType: 'equity', allocation: 50 }),
      makePosition({ assetType: 'equity', allocation: 20 }),
      makePosition({ assetType: 'crypto', allocation: 30 }),
    ];
    const groups = groupPositionsBy(positions, 'assetType');
    expect(groups.length).toBe(2);
    const equityGroup = groups.find((g) => g.key === 'equity');
    expect(equityGroup!.allocation).toBe(70);
    expect(equityGroup!.count).toBe(2);
  });

  it('sorts groups descending by allocation', () => {
    const positions = [
      makePosition({ region: 'europe', allocation: 10 }),
      makePosition({ region: 'north_america', allocation: 90 }),
    ];
    const groups = groupPositionsBy(positions, 'region');
    expect(groups[0].key).toBe('north_america');
  });

  it('uses label maps for known dimensions', () => {
    const positions = [makePosition({ assetType: 'equity', allocation: 100 })];
    const groups = groupPositionsBy(positions, 'assetType');
    expect(groups[0].label).toBe('Equity');
  });
});

// --------------- calculateConcentration ---------------

describe('calculateConcentration', () => {
  it('returns zeros for empty positions', () => {
    const c = calculateConcentration([]);
    expect(c.herfindahlIndex).toBe(0);
    expect(c.top3Concentration).toBe(0);
    expect(c.effectivePositions).toBe(0);
  });

  it('HHI is 10000 for a single position', () => {
    const c = calculateConcentration([makePosition({ allocation: 100 })]);
    expect(c.herfindahlIndex).toBe(10000);
    expect(c.largestPosition).toBe(100);
    expect(c.effectivePositions).toBe(1);
  });

  it('HHI decreases with more equal positions', () => {
    const single = calculateConcentration(equalWeightPortfolio(1));
    const four = calculateConcentration(equalWeightPortfolio(4));
    const ten = calculateConcentration(equalWeightPortfolio(10));
    expect(four.herfindahlIndex).toBeLessThan(single.herfindahlIndex);
    expect(ten.herfindahlIndex).toBeLessThan(four.herfindahlIndex);
  });

  it('top3 and top5 are correct', () => {
    const positions = [
      makePosition({ allocation: 40 }),
      makePosition({ allocation: 30 }),
      makePosition({ allocation: 20 }),
      makePosition({ allocation: 10 }),
    ];
    const c = calculateConcentration(positions);
    expect(c.top3Concentration).toBe(90);
    expect(c.top5Concentration).toBe(100);
  });
});

// --------------- calculateDiversification ---------------

describe('calculateDiversification', () => {
  it('returns zeros for empty positions', () => {
    const d = calculateDiversification([]);
    expect(d.overall).toBe(0);
    expect(d.assetTypeDiversity).toBe(0);
  });

  it('returns 0 for single-category portfolio', () => {
    const positions = equalWeightPortfolio(3);
    const d = calculateDiversification(positions);
    // All same assetType, region, sector, currency -> entropy is 0
    expect(d.assetTypeDiversity).toBe(0);
  });

  it('higher diversity with more asset types', () => {
    const mono = [makePosition({ assetType: 'equity', allocation: 100 })];
    const diverse = [
      makePosition({ assetType: 'equity', allocation: 50 }),
      makePosition({ assetType: 'crypto', allocation: 50 }),
    ];
    const d1 = calculateDiversification(mono);
    const d2 = calculateDiversification(diverse);
    expect(d2.assetTypeDiversity).toBeGreaterThan(d1.assetTypeDiversity);
  });
});

// --------------- calculateLiquidityExposure ---------------

describe('calculateLiquidityExposure', () => {
  it('returns zeros for empty positions', () => {
    const liq = calculateLiquidityExposure([]);
    expect(liq.highlyLiquid).toBe(0);
    expect(liq.weightedLiquidityScore).toBe(0);
  });

  it('100% highly liquid', () => {
    const positions = [makePosition({ allocation: 100, liquidityBucket: 'highly_liquid' })];
    const liq = calculateLiquidityExposure(positions);
    expect(liq.highlyLiquid).toBeCloseTo(100);
    expect(liq.weightedLiquidityScore).toBe(100);
  });

  it('correctly splits across buckets', () => {
    const positions = [
      makePosition({ allocation: 50, liquidityBucket: 'highly_liquid' }),
      makePosition({ allocation: 30, liquidityBucket: 'liquid' }),
      makePosition({ allocation: 20, liquidityBucket: 'illiquid' }),
    ];
    const liq = calculateLiquidityExposure(positions);
    expect(liq.highlyLiquid).toBeCloseTo(50);
    expect(liq.liquid).toBeCloseTo(30);
    expect(liq.illiquid).toBeCloseTo(20);
  });

  it('locked positions have 0 liquidity score contribution', () => {
    const positions = [makePosition({ allocation: 100, liquidityBucket: 'locked' })];
    const liq = calculateLiquidityExposure(positions);
    expect(liq.locked).toBeCloseTo(100);
    expect(liq.weightedLiquidityScore).toBe(0);
  });
});

// --------------- calculateCurrencyExposure ---------------

describe('calculateCurrencyExposure', () => {
  it('groups by currency', () => {
    const positions = [
      makePosition({ currency: 'USD', allocation: 60 }),
      makePosition({ currency: 'EUR', allocation: 40 }),
    ];
    const exposure = calculateCurrencyExposure(positions);
    expect(exposure.length).toBe(2);
    const usd = exposure.find((e) => e.currency === 'USD');
    expect(usd!.allocation).toBe(60);
    expect(usd!.positionCount).toBe(1);
  });
});

// --------------- detectImbalances ---------------

describe('detectImbalances', () => {
  it('warns when total is not 100%', () => {
    const positions = [makePosition({ allocation: 80 })];
    const warnings = detectImbalances(positions);
    expect(warnings.some((w) => w.includes('100%'))).toBe(true);
  });

  it('warns when largest position exceeds 25%', () => {
    const positions = [
      makePosition({ allocation: 50 }),
      makePosition({ allocation: 50 }),
    ];
    const warnings = detectImbalances(positions);
    expect(warnings.some((w) => w.includes('25%'))).toBe(true);
  });

  it('returns no warnings for well-balanced portfolio', () => {
    const positions = [
      makePosition({ allocation: 20, assetType: 'equity', currency: 'USD', region: 'north_america' }),
      makePosition({ allocation: 20, assetType: 'crypto', currency: 'EUR', region: 'europe' }),
      makePosition({ allocation: 20, assetType: 'cash', currency: 'GBP', region: 'asia_pacific' }),
      makePosition({ allocation: 20, assetType: 'commodities', currency: 'JPY', region: 'middle_east' }),
      makePosition({ allocation: 20, assetType: 'fixed_income', currency: 'CHF', region: 'latin_america' }),
    ];
    const warnings = detectImbalances(positions);
    expect(warnings.length).toBe(0);
  });
});

// --------------- generateStructuralInsights ---------------

describe('generateStructuralInsights', () => {
  it('returns complete insights object', () => {
    const positions = [
      makePosition({ allocation: 50 }),
      makePosition({ allocation: 50 }),
    ];
    const insights = generateStructuralInsights(positions);
    expect(insights).toHaveProperty('concentration');
    expect(insights).toHaveProperty('diversification');
    expect(insights).toHaveProperty('liquidity');
    expect(insights).toHaveProperty('currencies');
    expect(insights).toHaveProperty('imbalances');
  });
});

// --------------- generateSankeyData ---------------

describe('generateSankeyData', () => {
  it('creates nodes and links for positions', () => {
    const positions = [
      makePosition({ allocation: 60, assetType: 'equity', sector: 'Technology', name: 'Apple' }),
      makePosition({ allocation: 40, assetType: 'crypto', sector: 'Crypto', name: 'Bitcoin' }),
    ];
    const sankey = generateSankeyData(positions);
    expect(sankey.nodes.length).toBeGreaterThan(0);
    expect(sankey.links.length).toBeGreaterThan(0);
    expect(sankey.nodes.find((n) => n.id === 'portfolio')).toBeDefined();
  });

  it('handles empty positions', () => {
    const sankey = generateSankeyData([]);
    expect(sankey.nodes).toEqual([{ id: 'portfolio', label: 'Portfolio' }]);
    expect(sankey.links).toEqual([]);
  });
});
