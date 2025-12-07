// Scenario Lab - Data Model and Presets

export type ScenarioType = "historical" | "macroShock" | "equityCrash" | "ratesShock" | "fxShock" | "liquidityShock" | "custom";

export type ScenarioShockTarget =
  | "global_equity"
  | "us_equity"
  | "tech_equity"
  | "em_equity"
  | "financials_equity"
  | "energy_equity"
  | "rates_parallel"
  | "rates_short_end"
  | "rates_long_end"
  | "credit_ig_spreads"
  | "credit_hy_spreads"
  | "credit_spreads"
  | "usd_fx"
  | "eur_fx"
  | "gbp_fx"
  | "jpy_fx"
  | "ils_fx"
  | "em_fx"
  | "fx_volatility"
  | "inflation"
  | "volatility"
  | "alternatives"
  | "illiquid_haircut";

export type ScenarioShockUnit = "percent" | "bps";

export type ScenarioHorizon = "1d" | "1w" | "1m" | "6m" | "1y";

export interface ScenarioShock {
  id: string;
  target: ScenarioShockTarget;
  label: string;
  value: number;
  unit: ScenarioShockUnit;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  type: ScenarioType;
  description?: string;
  horizon: ScenarioHorizon;
  shocks: ScenarioShock[];
  isSystemPreset?: boolean;
}

// Shock target metadata for UI
export const shockTargetMeta: Record<ScenarioShockTarget, { label: string; defaultUnit: ScenarioShockUnit; category: string }> = {
  global_equity: { label: "Global Equity", defaultUnit: "percent", category: "Equity" },
  us_equity: { label: "US Equity", defaultUnit: "percent", category: "Equity" },
  tech_equity: { label: "Tech/Growth Equity", defaultUnit: "percent", category: "Equity" },
  em_equity: { label: "Emerging Markets Equity", defaultUnit: "percent", category: "Equity" },
  financials_equity: { label: "Financials Sector", defaultUnit: "percent", category: "Equity" },
  energy_equity: { label: "Energy Sector", defaultUnit: "percent", category: "Equity" },
  rates_parallel: { label: "Rates (Parallel)", defaultUnit: "bps", category: "Rates" },
  rates_short_end: { label: "Rates (Short End)", defaultUnit: "bps", category: "Rates" },
  rates_long_end: { label: "Rates (Long End)", defaultUnit: "bps", category: "Rates" },
  credit_spreads: { label: "Credit Spreads", defaultUnit: "bps", category: "Credit" },
  credit_ig_spreads: { label: "IG Credit Spreads", defaultUnit: "bps", category: "Credit" },
  credit_hy_spreads: { label: "HY Credit Spreads", defaultUnit: "bps", category: "Credit" },
  usd_fx: { label: "USD (DXY)", defaultUnit: "percent", category: "FX" },
  eur_fx: { label: "EUR/USD", defaultUnit: "percent", category: "FX" },
  gbp_fx: { label: "GBP/USD", defaultUnit: "percent", category: "FX" },
  jpy_fx: { label: "USD/JPY", defaultUnit: "percent", category: "FX" },
  ils_fx: { label: "USD/ILS", defaultUnit: "percent", category: "FX" },
  em_fx: { label: "EM FX Basket", defaultUnit: "percent", category: "FX" },
  fx_volatility: { label: "FX Implied Vol", defaultUnit: "percent", category: "FX" },
  inflation: { label: "Inflation", defaultUnit: "percent", category: "Macro" },
  volatility: { label: "Volatility (VIX)", defaultUnit: "percent", category: "Macro" },
  alternatives: { label: "Alternatives", defaultUnit: "percent", category: "Alternatives" },
  illiquid_haircut: { label: "Illiquid Asset Haircut", defaultUnit: "percent", category: "Liquidity" },
};

// Built-in scenario presets
export const systemScenarios: ScenarioDefinition[] = [
  // Rate Shock Scenarios
  {
    id: "rates-200-up",
    name: "Rates +200 bps",
    type: "ratesShock",
    description: "Parallel yield curve shift up by 200 basis points",
    horizon: "1m",
    shocks: [
      { id: "r1", target: "rates_parallel", label: "Rates Parallel", value: 200, unit: "bps" }
    ],
    isSystemPreset: true
  },
  {
    id: "rates-500-up",
    name: "Rates +500 bps (Extreme)",
    type: "ratesShock",
    description: "Large parallel shock – extreme hawkish scenario",
    horizon: "6m",
    shocks: [
      { id: "r2", target: "rates_parallel", label: "Rates Parallel", value: 500, unit: "bps" }
    ],
    isSystemPreset: true
  },
  {
    id: "short-end-250",
    name: "Short End +250 bps",
    type: "ratesShock",
    description: "Front-end rate shock – Fed aggressive tightening",
    horizon: "1m",
    shocks: [
      { id: "r3", target: "rates_short_end", label: "Short End Rates", value: 250, unit: "bps" }
    ],
    isSystemPreset: true
  },
  {
    id: "long-end-150",
    name: "Long End +150 bps",
    type: "ratesShock",
    description: "Duration sell-off in long bonds",
    horizon: "1m",
    shocks: [
      { id: "r4", target: "rates_long_end", label: "Long End Rates", value: 150, unit: "bps" }
    ],
    isSystemPreset: true
  },

  // Equity Crash Scenarios
  {
    id: "equity-10-drop",
    name: "Equity -10% Fast Drop",
    type: "equityCrash",
    description: "Quick correction across global equity markets",
    horizon: "1w",
    shocks: [
      { id: "e1", target: "global_equity", label: "Global Equity", value: -10, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "equity-25-crash",
    name: "Equity -25% Crash",
    type: "equityCrash",
    description: "Major equity market crash scenario",
    horizon: "1m",
    shocks: [
      { id: "e2", target: "global_equity", label: "Global Equity", value: -25, unit: "percent" },
      { id: "e2v", target: "volatility", label: "Volatility", value: 50, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "tech-bust-40",
    name: "Tech Bust -40%",
    type: "equityCrash",
    description: "Technology sector collapse with broader market impact",
    horizon: "6m",
    shocks: [
      { id: "e3", target: "tech_equity", label: "Tech Equity", value: -40, unit: "percent" },
      { id: "e3b", target: "global_equity", label: "Global Equity", value: -15, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "slow-grind-30",
    name: "Slow Grind -30%",
    type: "equityCrash",
    description: "Gradual bear market over 6 months",
    horizon: "6m",
    shocks: [
      { id: "e4", target: "global_equity", label: "Global Equity", value: -30, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "em-crisis",
    name: "EM Crisis -35%",
    type: "equityCrash",
    description: "Emerging markets crisis with contagion",
    horizon: "1m",
    shocks: [
      { id: "em1", target: "em_equity", label: "EM Equity", value: -35, unit: "percent" },
      { id: "em2", target: "global_equity", label: "Global Equity", value: -10, unit: "percent" },
      { id: "em3", target: "usd_fx", label: "USD Strength", value: 8, unit: "percent" }
    ],
    isSystemPreset: true
  },

  // Macro / Regime Scenarios
  {
    id: "stagflation",
    name: "Stagflation",
    type: "macroShock",
    description: "High inflation with economic stagnation – worst for 60/40",
    horizon: "1y",
    shocks: [
      { id: "s1", target: "global_equity", label: "Global Equity", value: -20, unit: "percent" },
      { id: "s2", target: "rates_parallel", label: "Rates", value: 150, unit: "bps" },
      { id: "s3", target: "inflation", label: "Inflation", value: 3, unit: "percent" },
      { id: "s4", target: "credit_spreads", label: "Credit Spreads", value: 150, unit: "bps" }
    ],
    isSystemPreset: true
  },
  {
    id: "flight-to-quality",
    name: "Flight to Quality",
    type: "macroShock",
    description: "Risk-off: equities down, bonds rally, spreads widen",
    horizon: "1m",
    shocks: [
      { id: "f1", target: "global_equity", label: "Global Equity", value: -15, unit: "percent" },
      { id: "f2", target: "rates_parallel", label: "Rates", value: -100, unit: "bps" },
      { id: "f3", target: "credit_spreads", label: "Credit Spreads", value: 200, unit: "bps" },
      { id: "f4", target: "volatility", label: "Volatility", value: 40, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "strong-dollar",
    name: "Strong Dollar Rally",
    type: "fxShock",
    description: "Dollar strength hurts EM and international holdings",
    horizon: "6m",
    shocks: [
      { id: "d1", target: "usd_fx", label: "USD", value: 10, unit: "percent" },
      { id: "d2", target: "em_equity", label: "EM Equity", value: -15, unit: "percent" },
      { id: "d3", target: "eur_fx", label: "EUR", value: -8, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "fx-regime-shift",
    name: "FX Regime Shift",
    type: "fxShock",
    description: "Multi-currency stress event with sharp dislocations due to geopolitical uncertainty, rate divergence, and liquidity pressures. Models rapid USD strengthening, EM currency selloff, and cross-asset spillover.",
    horizon: "1m",
    shocks: [
      // Major Currencies
      { id: "fx1", target: "usd_fx", label: "USD Index (DXY)", value: 7, unit: "percent" },
      { id: "fx2", target: "eur_fx", label: "EUR/USD", value: -5, unit: "percent" },
      { id: "fx3", target: "gbp_fx", label: "GBP/USD", value: -4, unit: "percent" },
      { id: "fx4", target: "jpy_fx", label: "USD/JPY (Yen Weakening)", value: 6, unit: "percent" },
      // Emerging Markets
      { id: "fx5", target: "em_fx", label: "EM FX Basket", value: -10, unit: "percent" },
      // Israeli Shekel
      { id: "fx6", target: "ils_fx", label: "USD/ILS", value: 8, unit: "percent" },
      // FX Volatility
      { id: "fx7", target: "fx_volatility", label: "FX Implied Volatility", value: 55, unit: "percent" },
      // Cross-asset spillover
      { id: "fx8", target: "em_equity", label: "EM Equity (FX Contagion)", value: -12, unit: "percent" },
      { id: "fx9", target: "global_equity", label: "Global Equity (Spillover)", value: -5, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "ai-bubble-burst",
    name: "AI Bubble Burst",
    type: "equityCrash",
    description: "AI/Tech bubble collapse similar to dot-com",
    horizon: "6m",
    shocks: [
      { id: "ai1", target: "tech_equity", label: "Tech Equity", value: -40, unit: "percent" },
      { id: "ai2", target: "global_equity", label: "Global Equity", value: -10, unit: "percent" },
      { id: "ai3", target: "volatility", label: "Volatility", value: 30, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "credit-crunch",
    name: "Credit Crunch",
    type: "macroShock",
    description: "Banking stress with credit spread blowout",
    horizon: "1m",
    shocks: [
      { id: "c1", target: "credit_spreads", label: "Credit Spreads", value: 300, unit: "bps" },
      { id: "c2", target: "global_equity", label: "Global Equity", value: -12, unit: "percent" },
      { id: "c3", target: "rates_short_end", label: "Short Rates", value: -75, unit: "bps" }
    ],
    isSystemPreset: true
  },
  {
    id: "goldilocks",
    name: "Goldilocks Rally",
    type: "macroShock",
    description: "Perfect soft landing: equities up, rates down, spreads tight",
    horizon: "1y",
    shocks: [
      { id: "g1", target: "global_equity", label: "Global Equity", value: 15, unit: "percent" },
      { id: "g2", target: "rates_parallel", label: "Rates", value: -50, unit: "bps" },
      { id: "g3", target: "credit_spreads", label: "Credit Spreads", value: -50, unit: "bps" },
      { id: "g4", target: "volatility", label: "Volatility", value: -20, unit: "percent" }
    ],
    isSystemPreset: true
  },

  // Historical Replays
  {
    id: "historical-2008",
    name: "2008 Financial Crisis",
    type: "historical",
    description: "Replay of 2008 GFC market conditions",
    horizon: "6m",
    shocks: [
      { id: "h08a", target: "global_equity", label: "Global Equity", value: -50, unit: "percent" },
      { id: "h08b", target: "credit_spreads", label: "Credit Spreads", value: 600, unit: "bps" },
      { id: "h08c", target: "rates_parallel", label: "Rates", value: -200, unit: "bps" },
      { id: "h08d", target: "volatility", label: "Volatility", value: 100, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "historical-covid",
    name: "COVID-19 Crash (Mar 2020)",
    type: "historical",
    description: "Fast crash and recovery pattern",
    horizon: "1m",
    shocks: [
      { id: "hc1", target: "global_equity", label: "Global Equity", value: -34, unit: "percent" },
      { id: "hc2", target: "credit_spreads", label: "Credit Spreads", value: 400, unit: "bps" },
      { id: "hc3", target: "volatility", label: "Volatility", value: 200, unit: "percent" }
    ],
    isSystemPreset: true
  },
  {
    id: "historical-2022",
    name: "2022 Rate Shock",
    type: "historical",
    description: "Fed tightening cycle – bonds and equities both down",
    horizon: "1y",
    shocks: [
      { id: "h22a", target: "global_equity", label: "Global Equity", value: -20, unit: "percent" },
      { id: "h22b", target: "tech_equity", label: "Tech Equity", value: -35, unit: "percent" },
      { id: "h22c", target: "rates_parallel", label: "Rates", value: 350, unit: "bps" }
    ],
    isSystemPreset: true
  },

  // Liquidity Shock Scenarios
  {
    id: "global-liquidity-shock",
    name: "Global Liquidity Shock",
    type: "liquidityShock",
    description: "Global funding-pressure event with liquidity dry-up, spread widening, and rapid risk-asset repricing due to deleveraging. Emulates March 2020 or 2008 liquidity freeze conditions.",
    horizon: "1m",
    shocks: [
      // Rates: curve inversion (short up, long down)
      { id: "liq1", target: "rates_short_end", label: "Short-Term Rates (Funding Spike)", value: 150, unit: "bps" },
      { id: "liq2", target: "rates_long_end", label: "Long-Term Rates (Flight to Quality)", value: -50, unit: "bps" },
      // Credit spreads blowout
      { id: "liq3", target: "credit_ig_spreads", label: "IG Credit Spreads", value: 120, unit: "bps" },
      { id: "liq4", target: "credit_hy_spreads", label: "HY Credit Spreads", value: 350, unit: "bps" },
      // Equity sector impacts
      { id: "liq5", target: "global_equity", label: "Global Equity", value: -18, unit: "percent" },
      { id: "liq6", target: "tech_equity", label: "Tech Sector", value: -25, unit: "percent" },
      { id: "liq7", target: "financials_equity", label: "Financials", value: -14, unit: "percent" },
      { id: "liq8", target: "energy_equity", label: "Energy", value: -10, unit: "percent" },
      // FX: USD surge, EM collapse
      { id: "liq9", target: "usd_fx", label: "USD (DXY)", value: 6, unit: "percent" },
      { id: "liq10", target: "em_fx", label: "EM Currencies", value: -12, unit: "percent" },
      // Volatility spike
      { id: "liq11", target: "volatility", label: "VIX", value: 60, unit: "percent" },
      // Liquidity haircuts
      { id: "liq12", target: "illiquid_haircut", label: "Illiquid Assets Haircut", value: -8, unit: "percent" },
      { id: "liq13", target: "alternatives", label: "Alternatives", value: -5, unit: "percent" }
    ],
    isSystemPreset: true
  }
];

// Helper to get scenario type color
export function getScenarioTypeColor(type: ScenarioType): string {
  switch (type) {
    case "historical": return "text-blue-400";
    case "macroShock": return "text-purple-400";
    case "equityCrash": return "text-red-400";
    case "ratesShock": return "text-yellow-400";
    case "fxShock": return "text-cyan-400";
    case "liquidityShock": return "text-orange-400";
    case "custom": return "text-primary";
    default: return "text-muted-foreground";
  }
}

// Helper to get horizon label
export function getHorizonLabel(horizon: ScenarioHorizon): string {
  switch (horizon) {
    case "1d": return "1 Day";
    case "1w": return "1 Week";
    case "1m": return "1 Month";
    case "6m": return "6 Months";
    case "1y": return "1 Year";
    default: return horizon;
  }
}
