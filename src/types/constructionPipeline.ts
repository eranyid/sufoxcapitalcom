/**
 * Types for the unified Construction Pipeline
 * Phase 1: Target Allocation (existing wizard)
 * Phase 2: Scenario-Based Expected Return
 * Phase 3: Allocation Builder
 */

// ============= Phase 2: Scenario-Based Expected Return =============

export type ScenarioKey = 'large_growth' | 'normal_growth' | 'mild_recession' | 'severe_recession';

export interface ScenarioProbabilities {
  large_growth: number;   // probability (0-1)
  normal_growth: number;
  mild_recession: number;
  severe_recession: number;
}

export interface AssetScenarioReturns {
  assetClass: string;
  returns: Record<ScenarioKey, number>; // HPR per scenario (%)
}

export interface AssetERResult {
  assetClass: string;
  expectedReturn: number;         // E(r) = Σ p(s)·r(s)
  variance: number;               // σ² = Σ p(s)·[r(s) - E(r)]²
  standardDeviation: number;      // σ = √variance
  sharpeRatio: number;            // (E(r) - Rf) / σ
  scenarioReturns: Record<ScenarioKey, number>;
}

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  large_growth: 'Large Growth',
  normal_growth: 'Normal Growth',
  mild_recession: 'Mild Recession',
  severe_recession: 'Severe Recession',
};

export const SCENARIO_COLORS: Record<ScenarioKey, string> = {
  large_growth: 'hsl(142, 71%, 45%)',    // green
  normal_growth: 'hsl(210, 80%, 55%)',   // blue
  mild_recession: 'hsl(38, 92%, 50%)',   // amber
  severe_recession: 'hsl(0, 72%, 51%)',  // red
};

export const DEFAULT_PROBABILITIES: ScenarioProbabilities = {
  large_growth: 0.25,
  normal_growth: 0.45,
  mild_recession: 0.25,
  severe_recession: 0.05,
};

export const SCENARIO_KEYS: ScenarioKey[] = [
  'large_growth',
  'normal_growth',
  'mild_recession',
  'severe_recession',
];

// ============= Pipeline State =============

export type PipelinePhase = 1 | 2 | 3 | 4; // 1=Target, 2=ER, 3=Allocation, 4=Summary

export interface PipelineState {
  currentPhase: PipelinePhase;
  phase1Complete: boolean;
  phase2Complete: boolean;
  phase3Complete: boolean;
}

// ============= Calculation Functions =============

/**
 * E(r) = Σ p(s) × r(s)
 */
export function calculateExpectedReturn(
  returns: Record<ScenarioKey, number>,
  probabilities: ScenarioProbabilities
): number {
  return SCENARIO_KEYS.reduce((sum, key) => {
    return sum + probabilities[key] * returns[key];
  }, 0);
}

/**
 * Var(r) = Σ p(s) × [r(s) - E(r)]²
 */
export function calculateVariance(
  returns: Record<ScenarioKey, number>,
  probabilities: ScenarioProbabilities,
  expectedReturn: number
): number {
  return SCENARIO_KEYS.reduce((sum, key) => {
    const deviation = returns[key] - expectedReturn;
    return sum + probabilities[key] * deviation * deviation;
  }, 0);
}

/**
 * Calculate full ER result for an asset
 */
export function calculateAssetER(
  asset: AssetScenarioReturns,
  probabilities: ScenarioProbabilities,
  riskFreeRate: number
): AssetERResult {
  const er = calculateExpectedReturn(asset.returns, probabilities);
  const variance = calculateVariance(asset.returns, probabilities, er);
  const sd = Math.sqrt(variance);
  const sharpe = sd > 0 ? (er - riskFreeRate) / sd : 0;

  return {
    assetClass: asset.assetClass,
    expectedReturn: er,
    variance,
    standardDeviation: sd,
    sharpeRatio: sharpe,
    scenarioReturns: asset.returns,
  };
}

/**
 * Calculate portfolio-level E(r) given asset weights and ER results
 */
export function calculatePortfolioER(
  results: AssetERResult[],
  weights: Record<string, number> // assetClass -> weight (%)
): { expectedReturn: number; weightedVolatility: number } {
  let portfolioER = 0;
  let weightedVol = 0;
  
  results.forEach(r => {
    const w = (weights[r.assetClass] || 0) / 100;
    portfolioER += w * r.expectedReturn;
    weightedVol += w * r.standardDeviation;
  });

  return { expectedReturn: portfolioER, weightedVolatility: weightedVol };
}
