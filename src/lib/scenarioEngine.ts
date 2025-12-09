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
  equity: ['global_equity', 'us_equity', 'financials_equity', 'energy_equity'],
  etf: ['global_equity', 'us_equity'],
  mutual_fund: ['global_equity'],
  bond: ['rates_parallel', 'rates_long_end', 'credit_spreads', 'credit_ig_spreads', 'credit_hy_spreads'],
  commodity: ['energy_equity'],
  crypto: ['global_equity', 'tech_equity', 'volatility'],
  real_estate: ['rates_long_end', 'illiquid_haircut'],
  cash: [],
  alternative: ['global_equity', 'volatility', 'alternatives', 'illiquid_haircut'],
  private_equity: ['global_equity', 'us_equity', 'credit_spreads', 'illiquid_haircut'],
  private_debt: ['rates_parallel', 'credit_spreads', 'credit_ig_spreads', 'credit_hy_spreads', 'illiquid_haircut'],
  hedge_fund: ['global_equity', 'volatility', 'alternatives'],
};

// Geography to shock mapping
const geographyToShockMapping: Record<Geography, ScenarioShockTarget[]> = {
  north_america: ['us_equity', 'usd_fx'],
  europe: ['global_equity', 'eur_fx'],
  israel: ['global_equity'],
  emerging_markets: ['em_equity', 'em_fx'],
  global: ['global_equity'],
  other: ['global_equity'],
};

// Sensitivity factors for different asset types
const assetSensitivity: Record<AssetType, Record<string, number>> = {
  equity: { equity: 1.0, rates: -0.1, credit: -0.2, fx: 0.3, volatility: -0.1, liquidity: 0.0 },
  etf: { equity: 1.0, rates: -0.1, credit: -0.2, fx: 0.3, volatility: -0.1, liquidity: 0.0 },
  mutual_fund: { equity: 0.8, rates: -0.1, credit: -0.15, fx: 0.2, volatility: -0.08, liquidity: 0.0 },
  bond: { equity: 0.0, rates: -5.0, credit: -0.3, fx: 0.1, volatility: 0.0, liquidity: 0.0 }, // Duration ~5
  commodity: { equity: 0.3, rates: 0.0, credit: 0.0, fx: -0.5, volatility: 0.2, liquidity: 0.0 },
  crypto: { equity: 1.5, rates: -0.2, credit: 0.0, fx: 0.0, volatility: -0.3, liquidity: -0.1 },
  real_estate: { equity: 0.6, rates: -3.0, credit: -0.2, fx: 0.1, volatility: -0.1, liquidity: 1.0 },
  cash: { equity: 0.0, rates: 0.0, credit: 0.0, fx: 0.0, volatility: 0.0, liquidity: 0.0 },
  alternative: { equity: 0.5, rates: -0.1, credit: -0.1, fx: 0.1, volatility: 0.1, liquidity: 1.0 },
  private_equity: { equity: 1.2, rates: -0.15, credit: -0.3, fx: 0.2, volatility: -0.15, liquidity: 1.0 },
  private_debt: { equity: 0.1, rates: -3.0, credit: -0.5, fx: 0.1, volatility: -0.05, liquidity: 1.0 },
  hedge_fund: { equity: 0.5, rates: -0.05, credit: -0.1, fx: 0.15, volatility: 0.05, liquidity: 0.5 },
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

    // Equity shocks (including sector-specific)
    if (['global_equity', 'us_equity', 'tech_equity', 'em_equity', 'financials_equity', 'energy_equity'].includes(shock.target)) {
      const relevantTargets = [
        ...assetTypeToShockMapping[assetType],
        ...geographyToShockMapping[geography]
      ];

      if (relevantTargets.includes(shock.target)) {
        // Different betas for different sectors/types
        let beta = sensitivities.equity;
        if (shock.target === 'tech_equity' && (assetType === 'crypto' || assetType === 'equity')) {
          beta = assetType === 'crypto' ? 1.8 : 1.2;
        }
        if (shock.target === 'em_equity' && geography === 'emerging_markets') {
          beta = 1.0;
        }
        if (shock.target === 'financials_equity') {
          beta = assetType === 'equity' ? 1.0 : 0.3; // Direct impact on equities
        }
        if (shock.target === 'energy_equity') {
          beta = assetType === 'commodity' ? 0.8 : (assetType === 'equity' ? 1.0 : 0.2);
        }
        impact = shockValuePct * beta;
        appliedShocks.push(`${shock.label}: ${shockValuePct > 0 ? '+' : ''}${shockValuePct.toFixed(1)}%`);
      }
    }

    // Rate shocks (for bonds)
    if (['rates_parallel', 'rates_short_end', 'rates_long_end'].includes(shock.target)) {
      if (assetType === 'bond' || assetType === 'real_estate' || assetType === 'private_debt') {
        // Duration-based impact: ΔPrice ≈ -Duration × ΔYield
        let duration = assetType === 'bond' ? 5 : (assetType === 'private_debt' ? 3 : 3);
        if (shock.target === 'rates_short_end') duration = 2;
        if (shock.target === 'rates_long_end') duration = 8;
        
        impact = -duration * shockValuePct;
        appliedShocks.push(`${shock.label}: ${shock.value > 0 ? '+' : ''}${shock.value} bps → ${impact.toFixed(1)}%`);
      }
    }

    // Credit spread shocks (generic)
    if (shock.target === 'credit_spreads') {
      if (assetType === 'bond' || assetType === 'private_debt') {
        const spreadDuration = 4;
        impact = -spreadDuration * shockValuePct;
        appliedShocks.push(`Credit: +${shock.value} bps → ${impact.toFixed(1)}%`);
      }
    }

    // IG Credit spread shocks
    if (shock.target === 'credit_ig_spreads') {
      if (assetType === 'bond' || assetType === 'private_debt') {
        const spreadDuration = 4;
        impact = -spreadDuration * shockValuePct * 0.8; // IG less volatile
        appliedShocks.push(`IG Spreads: +${shock.value} bps → ${impact.toFixed(1)}%`);
      }
    }

    // HY Credit spread shocks
    if (shock.target === 'credit_hy_spreads') {
      if (assetType === 'bond' || assetType === 'private_debt') {
        const spreadDuration = 3; // Shorter duration for HY
        impact = -spreadDuration * shockValuePct;
        appliedShocks.push(`HY Spreads: +${shock.value} bps → ${impact.toFixed(1)}%`);
      }
    }

    // FX shocks (all currency pairs)
    if (['usd_fx', 'eur_fx', 'gbp_fx', 'jpy_fx', 'ils_fx', 'em_fx'].includes(shock.target)) {
      const relevantGeo = geographyToShockMapping[geography];
      
      // USD strength impacts all non-USD assets
      if (shock.target === 'usd_fx') {
        // Strong USD hurts international holdings (for USD-based portfolios)
        if (geography !== 'north_america') {
          impact = shockValuePct * -0.3;
          appliedShocks.push(`USD: +${shockValuePct.toFixed(0)}% → ${impact.toFixed(1)}%`);
        }
      }
      // EUR weakness impacts European assets
      else if (shock.target === 'eur_fx' && geography === 'europe') {
        impact = shockValuePct * sensitivities.fx;
        appliedShocks.push(`EUR: ${shockValuePct.toFixed(0)}% → ${impact.toFixed(1)}%`);
      }
      // GBP for UK assets (treated as Europe)
      else if (shock.target === 'gbp_fx' && geography === 'europe') {
        impact = shockValuePct * sensitivities.fx * 0.8;
        appliedShocks.push(`GBP: ${shockValuePct.toFixed(0)}% → ${impact.toFixed(1)}%`);
      }
      // JPY for Asia Pacific
      else if (shock.target === 'jpy_fx' && geography === 'israel') {
        impact = shockValuePct * sensitivities.fx * 0.7;
        appliedShocks.push(`JPY: ${shockValuePct.toFixed(0)}% → ${impact.toFixed(1)}%`);
      }
      // ILS for Israeli assets (other category or global with ILS currency)
      else if (shock.target === 'ils_fx') {
        // Assume some sensitivity for international portfolios
        impact = shockValuePct * sensitivities.fx * 0.4;
        if (Math.abs(impact) > 0.3) {
          appliedShocks.push(`ILS: ${shockValuePct.toFixed(0)}% → ${impact.toFixed(1)}%`);
        }
      }
      // EM FX basket
      else if (shock.target === 'em_fx' && (geography === 'emerging_markets' || relevantGeo.includes('em_fx'))) {
        impact = shockValuePct * 0.6; // Direct EM exposure
        appliedShocks.push(`EM FX: ${shockValuePct.toFixed(0)}% → ${impact.toFixed(1)}%`);
      }
    }

    // FX Volatility shock
    if (shock.target === 'fx_volatility') {
      // FX vol spike hurts carry trades, EM, and adds uncertainty
      if (['emerging_markets', 'israel', 'europe'].includes(geography)) {
        impact = shockValuePct * -0.08; // Mild negative impact from vol spike
        if (Math.abs(impact) > 0.3) {
          appliedShocks.push(`FX Vol: +${shockValuePct.toFixed(0)}% → ${impact.toFixed(1)}%`);
        }
      }
    }

    // Volatility shocks (VIX)
    if (shock.target === 'volatility') {
      // Higher vol generally bad for risk assets
      impact = shockValuePct * sensitivities.volatility;
      if (Math.abs(impact) > 0.5) {
        appliedShocks.push(`Vol: ${impact > 0 ? '+' : ''}${impact.toFixed(1)}%`);
      }
    }

    // Alternatives shock (direct)
    if (shock.target === 'alternatives') {
      if (['alternative', 'hedge_fund', 'private_equity'].includes(assetType)) {
        impact = shockValuePct * 1.0; // Direct 1:1 impact
        appliedShocks.push(`Alts: ${shockValuePct > 0 ? '+' : ''}${shockValuePct.toFixed(1)}%`);
      }
    }

    // Illiquid haircut shock
    if (shock.target === 'illiquid_haircut') {
      const liquiditySensitivity = sensitivities.liquidity || 0;
      if (liquiditySensitivity > 0) {
        impact = shockValuePct * liquiditySensitivity;
        appliedShocks.push(`Liquidity Haircut: ${shockValuePct.toFixed(1)}%`);
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
