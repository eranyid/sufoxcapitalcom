// Scenario Engine - Apply shocks to portfolio holdings

import { Transaction, MonthlyValuation, AssetType, Geography } from '@/types/investment';
import { ScenarioDefinition, ScenarioShock, ScenarioShockTarget } from '@/data/scenarios';
import { calculatePositions, getLatestValuations } from './calculations';

// Result types
export interface ScenarioResultPerHolding {
  ticker: string;
  name: string;
  assetType: AssetType;
  geography: Geography;
  valueBefore: number;
  valueAfter: number;
  pnlAbs: number;
  pnlPct: number;
  appliedShocks: string[];
}

export interface ScenarioResultByCategory {
  pnlAbs: number;
  pnlPct: number;
  valueBefore: number;
  valueAfter: number;
}

export interface ScenarioResultSummary {
  scenarioId: string;
  scenarioName: string;
  totalBefore: number;
  totalAfter: number;
  totalPnlAbs: number;
  totalPnlPct: number;
  byAssetType: Record<string, ScenarioResultByCategory>;
  byGeography: Record<string, ScenarioResultByCategory>;
}

export interface ScenarioResult {
  definition: ScenarioDefinition;
  perHolding: ScenarioResultPerHolding[];
  summary: ScenarioResultSummary;
  timestamp: string;
}

// Mapping asset types to shock targets
const assetTypeToShockMapping: Record<AssetType, ScenarioShockTarget[]> = {
  equity: ['global_equity', 'us_equity'],
  etf: ['global_equity', 'us_equity'],
  mutual_fund: ['global_equity'],
  bond: ['rates_parallel', 'rates_long_end', 'credit_spreads'],
  commodity: [],
  crypto: ['global_equity', 'tech_equity', 'volatility'],
  real_estate: ['rates_long_end'],
  cash: [],
  alternative: ['global_equity', 'volatility'],
  private_equity: ['global_equity', 'us_equity', 'credit_spreads'],
  private_debt: ['rates_parallel', 'credit_spreads'],
  hedge_fund: ['global_equity', 'volatility'],
};

// Geography to shock mapping
const geographyToShockMapping: Record<Geography, ScenarioShockTarget[]> = {
  north_america: ['us_equity', 'usd_fx'],
  europe: ['global_equity', 'eur_fx'],
  asia_pacific: ['global_equity'],
  emerging_markets: ['em_equity'],
  global: ['global_equity'],
  other: ['global_equity'],
};

// Sensitivity factors for different asset types
const assetSensitivity: Record<AssetType, Record<string, number>> = {
  equity: { equity: 1.0, rates: -0.1, credit: -0.2, fx: 0.3, volatility: -0.1 },
  etf: { equity: 1.0, rates: -0.1, credit: -0.2, fx: 0.3, volatility: -0.1 },
  mutual_fund: { equity: 0.8, rates: -0.1, credit: -0.15, fx: 0.2, volatility: -0.08 },
  bond: { equity: 0.0, rates: -5.0, credit: -0.3, fx: 0.1, volatility: 0.0 }, // Duration ~5
  commodity: { equity: 0.3, rates: 0.0, credit: 0.0, fx: -0.5, volatility: 0.2 },
  crypto: { equity: 1.5, rates: -0.2, credit: 0.0, fx: 0.0, volatility: -0.3 },
  real_estate: { equity: 0.6, rates: -3.0, credit: -0.2, fx: 0.1, volatility: -0.1 },
  cash: { equity: 0.0, rates: 0.0, credit: 0.0, fx: 0.0, volatility: 0.0 },
  alternative: { equity: 0.5, rates: -0.1, credit: -0.1, fx: 0.1, volatility: 0.1 },
  private_equity: { equity: 1.2, rates: -0.15, credit: -0.3, fx: 0.2, volatility: -0.15 },
  private_debt: { equity: 0.1, rates: -3.0, credit: -0.5, fx: 0.1, volatility: -0.05 },
  hedge_fund: { equity: 0.5, rates: -0.05, credit: -0.1, fx: 0.15, volatility: 0.05 },
};

// Calculate shock impact on a single holding
function calculateHoldingImpact(
  assetType: AssetType,
  geography: Geography,
  shocks: ScenarioShock[]
): { totalImpactPct: number; appliedShocks: string[] } {
  let totalImpactPct = 0;
  const appliedShocks: string[] = [];
  const sensitivities = assetSensitivity[assetType] || assetSensitivity.equity;

  for (const shock of shocks) {
    let impact = 0;
    const shockValuePct = shock.unit === 'bps' ? shock.value / 100 : shock.value;

    // Equity shocks
    if (['global_equity', 'us_equity', 'tech_equity', 'em_equity'].includes(shock.target)) {
      const relevantTargets = [
        ...assetTypeToShockMapping[assetType],
        ...geographyToShockMapping[geography]
      ];

      if (relevantTargets.includes(shock.target)) {
        // Tech equity has higher beta for crypto and certain equities
        let beta = sensitivities.equity;
        if (shock.target === 'tech_equity' && (assetType === 'crypto' || assetType === 'equity')) {
          beta = assetType === 'crypto' ? 1.8 : 1.2;
        }
        if (shock.target === 'em_equity' && geography === 'emerging_markets') {
          beta = 1.0;
        }
        impact = shockValuePct * beta;
        appliedShocks.push(`${shock.label}: ${shockValuePct > 0 ? '+' : ''}${shockValuePct.toFixed(1)}%`);
      }
    }

    // Rate shocks (for bonds)
    if (['rates_parallel', 'rates_short_end', 'rates_long_end'].includes(shock.target)) {
      if (assetType === 'bond' || assetType === 'real_estate') {
        // Duration-based impact: ΔPrice ≈ -Duration × ΔYield
        let duration = assetType === 'bond' ? 5 : 3;
        if (shock.target === 'rates_short_end') duration = 2;
        if (shock.target === 'rates_long_end') duration = 8;
        
        impact = -duration * shockValuePct;
        appliedShocks.push(`${shock.label}: ${shock.value > 0 ? '+' : ''}${shock.value} bps → ${impact.toFixed(1)}%`);
      }
    }

    // Credit spread shocks
    if (shock.target === 'credit_spreads') {
      if (assetType === 'bond') {
        // Credit spread widening hurts bond prices
        const spreadDuration = 4; // Credit duration
        impact = -spreadDuration * shockValuePct;
        appliedShocks.push(`Credit: +${shock.value} bps → ${impact.toFixed(1)}%`);
      }
    }

    // FX shocks
    if (['usd_fx', 'eur_fx'].includes(shock.target)) {
      const relevantGeo = geographyToShockMapping[geography];
      if (relevantGeo.includes(shock.target)) {
        // USD strength hurts non-USD assets when base is USD
        impact = shockValuePct * sensitivities.fx * (shock.target === 'usd_fx' ? -1 : 1);
        if (geography === 'emerging_markets' && shock.target === 'usd_fx') {
          impact = shockValuePct * -0.5; // EM more sensitive to USD
        }
        appliedShocks.push(`FX: ${shockValuePct > 0 ? '+' : ''}${shockValuePct.toFixed(1)}%`);
      }
    }

    // Volatility shocks
    if (shock.target === 'volatility') {
      // Higher vol generally bad for risk assets
      impact = shockValuePct * sensitivities.volatility;
      if (Math.abs(impact) > 0.5) {
        appliedShocks.push(`Vol: ${impact > 0 ? '+' : ''}${impact.toFixed(1)}%`);
      }
    }

    totalImpactPct += impact;
  }

  return { totalImpactPct, appliedShocks };
}

// Main scenario engine function
export function runScenario(
  scenario: ScenarioDefinition,
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): ScenarioResult {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  const perHolding: ScenarioResultPerHolding[] = [];
  const byAssetType: Record<string, ScenarioResultByCategory> = {};
  const byGeography: Record<string, ScenarioResultByCategory> = {};
  
  let totalBefore = 0;
  let totalAfter = 0;

  // Process each holding
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;

    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;

    const valueBefore = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    const { totalImpactPct, appliedShocks } = calculateHoldingImpact(
      tx.assetType,
      tx.geography,
      scenario.shocks
    );

    const valueAfter = valueBefore * (1 + totalImpactPct / 100);
    const pnlAbs = valueAfter - valueBefore;
    const pnlPct = valueBefore > 0 ? (pnlAbs / valueBefore) * 100 : 0;

    perHolding.push({
      ticker,
      name: tx.assetName,
      assetType: tx.assetType,
      geography: tx.geography,
      valueBefore,
      valueAfter,
      pnlAbs,
      pnlPct,
      appliedShocks
    });

    totalBefore += valueBefore;
    totalAfter += valueAfter;

    // Aggregate by asset type
    const assetKey = tx.assetType;
    if (!byAssetType[assetKey]) {
      byAssetType[assetKey] = { pnlAbs: 0, pnlPct: 0, valueBefore: 0, valueAfter: 0 };
    }
    byAssetType[assetKey].valueBefore += valueBefore;
    byAssetType[assetKey].valueAfter += valueAfter;
    byAssetType[assetKey].pnlAbs += pnlAbs;

    // Aggregate by geography
    const geoKey = tx.geography;
    if (!byGeography[geoKey]) {
      byGeography[geoKey] = { pnlAbs: 0, pnlPct: 0, valueBefore: 0, valueAfter: 0 };
    }
    byGeography[geoKey].valueBefore += valueBefore;
    byGeography[geoKey].valueAfter += valueAfter;
    byGeography[geoKey].pnlAbs += pnlAbs;
  }

  // Calculate percentages for aggregates
  for (const cat of Object.values(byAssetType)) {
    cat.pnlPct = cat.valueBefore > 0 ? (cat.pnlAbs / cat.valueBefore) * 100 : 0;
  }
  for (const cat of Object.values(byGeography)) {
    cat.pnlPct = cat.valueBefore > 0 ? (cat.pnlAbs / cat.valueBefore) * 100 : 0;
  }

  return {
    definition: scenario,
    perHolding: perHolding.sort((a, b) => a.pnlAbs - b.pnlAbs), // Sort by worst impact first
    summary: {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      totalBefore,
      totalAfter,
      totalPnlAbs: totalAfter - totalBefore,
      totalPnlPct: totalBefore > 0 ? ((totalAfter - totalBefore) / totalBefore) * 100 : 0,
      byAssetType,
      byGeography
    },
    timestamp: new Date().toISOString()
  };
}

// Compare multiple scenarios
export function compareScenarios(
  scenarios: ScenarioDefinition[],
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): ScenarioResult[] {
  return scenarios.map(scenario => runScenario(scenario, transactions, valuations));
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Format percentage with sign
export function formatPctWithSign(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
