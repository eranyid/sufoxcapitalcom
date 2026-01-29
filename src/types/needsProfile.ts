// Types for Needs-Based Portfolio Design

export type PurposeType = 'capital_growth' | 'income' | 'capital_preservation' | 'mixed';
export type TimeHorizonAnswer = 'less_than_1' | '1_to_3' | '3_to_7' | '7_plus';
export type LossReactionType = 'sell_all' | 'reduce_risk' | 'wait' | 'buy_more';
export type MaxDrawdownTolerance = '5' | '10' | '20' | '30_plus';
export type MonthsReserve = '0_to_3' | '3_to_6' | '6_to_12' | '12_plus';
export type BearMarketPatience = 'months' | '1_year' | 'few_years' | 'unlimited';
export type PreferenceType = 'liquidity' | 'stability' | 'max_return';
export type GeoPreference = 'israel_tilt' | 'global_only' | 'dollar_tilt' | 'shekel_tilt';
export type RiskProfileType = 'conservative' | 'balanced' | 'growth' | 'aggressive';

export interface NeedsAnswers {
  // A. Purpose
  purpose: PurposeType;
  timeHorizon: TimeHorizonAnswer;
  
  // B. Behavioral Risk
  lossReaction: LossReactionType;
  maxDrawdown: MaxDrawdownTolerance;
  
  // C. Financial Stability
  hasStableIncome: boolean;
  monthsReserve: MonthsReserve;
  
  // D. Psychological Time Horizon
  bearMarketPatience: BearMarketPatience;
  
  // E. Preferences
  primaryPreference: PreferenceType;
  geoPreference: GeoPreference;
}

export interface SystemRecommendation {
  riskProfile: RiskProfileType;
  riskScore: number;
  
  // Suggested ranges
  equityRange: { min: number; max: number };
  bondsRange: { min: number; max: number };
  hedgingRange: { min: number; max: number };
  alternativesRange: { min: number; max: number };
  cashRange: { min: number; max: number };
  
  // Geography tilt
  geographyTilt: {
    israel: { min: number; max: number };
    usa: { min: number; max: number };
    europe: { min: number; max: number };
    other: { min: number; max: number };
  };
  
  // Risk metrics
  maxDrawdownTolerance: number;
  volatilityBand: { min: number; max: number };
}

export interface NeedsProfile {
  id: string;
  user_id: string;
  answers_json: NeedsAnswers;
  risk_score: number;
  profile_type: RiskProfileType;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_NEEDS_ANSWERS: NeedsAnswers = {
  purpose: 'mixed',
  timeHorizon: '3_to_7',
  lossReaction: 'wait',
  maxDrawdown: '20',
  hasStableIncome: true,
  monthsReserve: '6_to_12',
  bearMarketPatience: 'few_years',
  primaryPreference: 'stability',
  geoPreference: 'global_only',
};

export const PURPOSE_LABELS: Record<PurposeType, string> = {
  capital_growth: 'Capital Growth',
  income: 'Income Generation',
  capital_preservation: 'Capital Preservation',
  mixed: 'Balanced / Mixed',
};

export const TIME_HORIZON_LABELS: Record<TimeHorizonAnswer, string> = {
  less_than_1: '< 1 Year',
  '1_to_3': '1–3 Years',
  '3_to_7': '3–7 Years',
  '7_plus': '7+ Years',
};

export const LOSS_REACTION_LABELS: Record<LossReactionType, string> = {
  sell_all: 'Sell Everything',
  reduce_risk: 'Reduce Risk',
  wait: 'Wait It Out',
  buy_more: 'Buy More',
};

export const MAX_DRAWDOWN_LABELS: Record<MaxDrawdownTolerance, string> = {
  '5': '5%',
  '10': '10%',
  '20': '20%',
  '30_plus': '30%+',
};

export const MONTHS_RESERVE_LABELS: Record<MonthsReserve, string> = {
  '0_to_3': '0–3 Months',
  '3_to_6': '3–6 Months',
  '6_to_12': '6–12 Months',
  '12_plus': '12+ Months',
};

export const BEAR_MARKET_LABELS: Record<BearMarketPatience, string> = {
  months: 'A Few Months',
  '1_year': 'About 1 Year',
  few_years: 'Several Years',
  unlimited: 'No Time Limit',
};

export const PREFERENCE_LABELS: Record<PreferenceType, string> = {
  liquidity: 'Liquidity',
  stability: 'Stability',
  max_return: 'Maximum Return',
};

export const GEO_PREFERENCE_LABELS: Record<GeoPreference, string> = {
  israel_tilt: 'Israel Tilt',
  global_only: 'Global Only',
  dollar_tilt: 'Dollar Tilt',
  shekel_tilt: 'Shekel Tilt',
};

export const RISK_PROFILE_LABELS: Record<RiskProfileType, string> = {
  conservative: 'Conservative',
  balanced: 'Balanced',
  growth: 'Growth',
  aggressive: 'Aggressive',
};

export const RISK_PROFILE_COLORS: Record<RiskProfileType, string> = {
  conservative: 'text-blue-400',
  balanced: 'text-emerald-400',
  growth: 'text-amber-400',
  aggressive: 'text-red-400',
};

// Scoring weights for risk calculation
export const SCORING_WEIGHTS = {
  purpose: {
    capital_growth: 20,
    income: 10,
    capital_preservation: 0,
    mixed: 15,
  },
  timeHorizon: {
    less_than_1: 0,
    '1_to_3': 10,
    '3_to_7': 20,
    '7_plus': 30,
  },
  lossReaction: {
    sell_all: 0,
    reduce_risk: 10,
    wait: 20,
    buy_more: 30,
  },
  maxDrawdown: {
    '5': 0,
    '10': 10,
    '20': 20,
    '30_plus': 30,
  },
  hasStableIncome: {
    true: 10,
    false: 0,
  },
  monthsReserve: {
    '0_to_3': 0,
    '3_to_6': 5,
    '6_to_12': 10,
    '12_plus': 15,
  },
  bearMarketPatience: {
    months: 0,
    '1_year': 10,
    few_years: 20,
    unlimited: 30,
  },
  primaryPreference: {
    liquidity: 5,
    stability: 10,
    max_return: 20,
  },
};

// Calculate risk score from answers (0-100)
export function calculateRiskScore(answers: NeedsAnswers): number {
  let score = 0;
  
  score += SCORING_WEIGHTS.purpose[answers.purpose];
  score += SCORING_WEIGHTS.timeHorizon[answers.timeHorizon];
  score += SCORING_WEIGHTS.lossReaction[answers.lossReaction];
  score += SCORING_WEIGHTS.maxDrawdown[answers.maxDrawdown];
  score += SCORING_WEIGHTS.hasStableIncome[String(answers.hasStableIncome) as 'true' | 'false'];
  score += SCORING_WEIGHTS.monthsReserve[answers.monthsReserve];
  score += SCORING_WEIGHTS.bearMarketPatience[answers.bearMarketPatience];
  score += SCORING_WEIGHTS.primaryPreference[answers.primaryPreference];
  
  // Normalize to 0-100 (max possible is ~165)
  return Math.min(100, Math.round((score / 165) * 100));
}

// Map score to risk profile
export function getRiskProfile(score: number): RiskProfileType {
  if (score <= 30) return 'conservative';
  if (score <= 55) return 'balanced';
  if (score <= 75) return 'growth';
  return 'aggressive';
}

// Generate system recommendation based on answers
export function generateRecommendation(answers: NeedsAnswers): SystemRecommendation {
  const riskScore = calculateRiskScore(answers);
  const riskProfile = getRiskProfile(riskScore);
  
  // Define recommendations based on profile
  const recommendations: Record<RiskProfileType, Omit<SystemRecommendation, 'riskProfile' | 'riskScore'>> = {
    conservative: {
      equityRange: { min: 20, max: 40 },
      bondsRange: { min: 30, max: 50 },
      hedgingRange: { min: 10, max: 20 },
      alternativesRange: { min: 5, max: 15 },
      cashRange: { min: 10, max: 20 },
      geographyTilt: {
        israel: { min: 15, max: 25 },
        usa: { min: 30, max: 45 },
        europe: { min: 15, max: 25 },
        other: { min: 5, max: 15 },
      },
      maxDrawdownTolerance: 10,
      volatilityBand: { min: 5, max: 10 },
    },
    balanced: {
      equityRange: { min: 45, max: 65 },
      bondsRange: { min: 15, max: 30 },
      hedgingRange: { min: 5, max: 15 },
      alternativesRange: { min: 10, max: 20 },
      cashRange: { min: 5, max: 10 },
      geographyTilt: {
        israel: { min: 20, max: 35 },
        usa: { min: 35, max: 50 },
        europe: { min: 15, max: 25 },
        other: { min: 5, max: 15 },
      },
      maxDrawdownTolerance: 20,
      volatilityBand: { min: 10, max: 15 },
    },
    growth: {
      equityRange: { min: 60, max: 80 },
      bondsRange: { min: 5, max: 20 },
      hedgingRange: { min: 5, max: 10 },
      alternativesRange: { min: 10, max: 25 },
      cashRange: { min: 3, max: 8 },
      geographyTilt: {
        israel: { min: 15, max: 30 },
        usa: { min: 40, max: 55 },
        europe: { min: 15, max: 25 },
        other: { min: 10, max: 20 },
      },
      maxDrawdownTolerance: 30,
      volatilityBand: { min: 15, max: 22 },
    },
    aggressive: {
      equityRange: { min: 75, max: 95 },
      bondsRange: { min: 0, max: 10 },
      hedgingRange: { min: 0, max: 10 },
      alternativesRange: { min: 15, max: 30 },
      cashRange: { min: 2, max: 5 },
      geographyTilt: {
        israel: { min: 10, max: 25 },
        usa: { min: 45, max: 65 },
        europe: { min: 10, max: 20 },
        other: { min: 15, max: 25 },
      },
      maxDrawdownTolerance: 40,
      volatilityBand: { min: 20, max: 30 },
    },
  };
  
  // Adjust based on geo preference
  let geoTilt = { ...recommendations[riskProfile].geographyTilt };
  if (answers.geoPreference === 'israel_tilt') {
    geoTilt.israel = { min: geoTilt.israel.min + 10, max: geoTilt.israel.max + 10 };
  } else if (answers.geoPreference === 'dollar_tilt') {
    geoTilt.usa = { min: geoTilt.usa.min + 10, max: geoTilt.usa.max + 10 };
  }
  
  return {
    riskProfile,
    riskScore,
    ...recommendations[riskProfile],
    geographyTilt: geoTilt,
  };
}
