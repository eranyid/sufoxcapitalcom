// Family Office Grade Needs Profile - Ultra HNW (~₪1B+)

export interface CapitalObjectives {
  primaryPurpose: 'preservation' | 'real_growth' | 'income_generation' | 'mixed';
  mixedWeights?: {
    preservation: number;
    growth: number;
    income: number;
  };
  hasFutureCommitments: boolean;
  commitmentDetails?: string;
  hasRealReturnTarget: boolean;
  realReturnTarget?: number; // e.g., CPI + X%
}

export interface WealthStructure {
  liquidAssets: number; // percentage
  illiquidAssets: number; // percentage
  assetBreakdown: {
    publicMarkets: number;
    privateEquity: number;
    realAssets: number;
    operatingBusinesses: number;
    cash: number;
  };
  totalLeverageRatio: number; // percentage
  hasConcentrationRisk: boolean;
  concentrationDetails?: string;
}

export interface LiquidityProfile {
  liquidityNeeds: {
    t1: number; // T+1 percentage
    days30: number; // 30 days percentage
    months12: number; // 12 months percentage
  };
  requiresAnnualCashflow: boolean;
  annualCashflowPercent?: number;
  hasUpcomingLiquidityEvents: boolean;
  liquidityEventDetails?: string;
}

export interface DrawdownTolerance {
  quarterlyDrawdownReaction: 'no_change' | 'reduce_risk' | 'rebalance' | 'strategic_change';
  maxAcceptableDrawdown: '10' | '20' | '30' | '40_plus';
  riskPriority: 'minimize_volatility' | 'maximize_return' | 'tail_risk_control';
}

export interface InvestmentHorizon {
  effectiveHorizon: '5_10' | '10_20' | '20_plus';
  hasIntergenerationalPolicy: boolean;
  policyDetails?: string;
  hasBeneficiaryDiversity: boolean;
  beneficiaryDetails?: string;
}

export interface RegulatoryTax {
  primaryTaxJurisdictions: string[];
  hasInvestmentRestrictions: boolean;
  restrictionDetails?: string;
  hasHoldingStructures: boolean;
  structureDetails?: string;
  requiresTaxAwareAllocation: boolean;
}

export interface GeographicCurrency {
  baseCurrency: 'ILS' | 'USD' | 'EUR' | 'CHF' | 'GBP';
  geographicPreferences: {
    israel: number;
    us: number;
    europe: number;
    emergingMarkets: number;
    other: number;
  };
  hedgeRatio: number; // percentage
}

export interface InvestmentPhilosophy {
  beliefs: {
    marketEfficiency: boolean;
    activeAlpha: boolean;
    factorInvesting: boolean;
    illiquidityPremium: boolean;
  };
  blackBoxAllocationPercent: number;
}

export interface AlternativesPolicy {
  targetAllocations: {
    privateEquity: number;
    ventureCapital: number;
    privateCredit: number;
    infrastructure: number;
    realEstate: number;
  };
  maxLockupYears: number;
  minimumIRR: number;
  coInvestmentRatio: number; // percentage vs funds
}

export interface ESGPolicy {
  sectorExclusions: string[];
  requiresImpactAllocation: boolean;
  impactAllocationPercent?: number;
  valuesVsFinancialWeight: 'values_first' | 'balanced' | 'financial_first';
}

export interface Governance {
  decisionMaker: 'principal' | 'family_office' | 'investment_committee' | 'external_advisor';
  rebalancingFrequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'opportunistic';
  hasInvestmentCommittee: boolean;
  hasSeparateRiskOfficer: boolean;
}

export interface CrisisScenarios {
  market40PercentDrop: 'buy' | 'hold' | 'reduce';
  highInflationResponse: 'change_allocation' | 'no_change';
  geopoliticalCrisisResponse: 'reduce_israel' | 'maintain';
}

export interface BenchmarkingPreferences {
  primaryBenchmark: 'sp500' | '60_40' | 'cpi_plus' | 'custom_policy';
  cpiPlusTarget?: number;
  successMetric: 'vs_market' | 'vs_real_target' | 'vs_peers';
  maxTrackingError: number; // standard deviation
}

export interface BehavioralProfile {
  covidPeriodBehavior: 'bought_dip' | 'held_steady' | 'reduced_exposure' | 'panicked';
  at15PercentLoss: 'bought_more' | 'held' | 'reduced' | 'sold_all';
  selfAssessment: 'rational' | 'reactive' | 'opportunistic';
}

export interface FamilyOfficeProfile {
  capitalObjectives: CapitalObjectives;
  wealthStructure: WealthStructure;
  liquidityProfile: LiquidityProfile;
  drawdownTolerance: DrawdownTolerance;
  investmentHorizon: InvestmentHorizon;
  regulatoryTax: RegulatoryTax;
  geographicCurrency: GeographicCurrency;
  investmentPhilosophy: InvestmentPhilosophy;
  alternativesPolicy: AlternativesPolicy;
  esgPolicy: ESGPolicy;
  governance: Governance;
  crisisScenarios: CrisisScenarios;
  benchmarkingPreferences: BenchmarkingPreferences;
  behavioralProfile: BehavioralProfile;
}

export interface StrategicRecommendation {
  riskBand: 'conservative' | 'balanced' | 'growth' | 'aggressive';
  riskScore: number; // 0-100
  equityRange: { min: number; max: number };
  fixedIncomeRange: { min: number; max: number };
  alternativesRange: { min: number; max: number };
  cashRange: { min: number; max: number };
  illiquidityBudget: number; // max percentage in illiquid assets
  geographyTilt: {
    israel: number;
    us: number;
    europe: number;
    emergingMarkets: number;
  };
  hedgeBudget: number;
  liquidityBuffer: number;
  esgConstraints: string[];
  suggestedBenchmark: string;
  keyConsiderations: string[];
}

// Scoring functions
export function calculateRiskScore(profile: Partial<FamilyOfficeProfile>): number {
  let score = 50; // Base score

  // Capital Objectives
  if (profile.capitalObjectives) {
    switch (profile.capitalObjectives.primaryPurpose) {
      case 'preservation': score -= 15; break;
      case 'income_generation': score -= 5; break;
      case 'real_growth': score += 10; break;
      case 'mixed': score += 0; break;
    }
    if (profile.capitalObjectives.hasFutureCommitments) score -= 5;
  }

  // Drawdown Tolerance
  if (profile.drawdownTolerance) {
    switch (profile.drawdownTolerance.maxAcceptableDrawdown) {
      case '10': score -= 20; break;
      case '20': score -= 5; break;
      case '30': score += 10; break;
      case '40_plus': score += 20; break;
    }
    switch (profile.drawdownTolerance.quarterlyDrawdownReaction) {
      case 'strategic_change': score -= 15; break;
      case 'reduce_risk': score -= 5; break;
      case 'rebalance': score += 5; break;
      case 'no_change': score += 10; break;
    }
    switch (profile.drawdownTolerance.riskPriority) {
      case 'minimize_volatility': score -= 10; break;
      case 'tail_risk_control': score += 0; break;
      case 'maximize_return': score += 15; break;
    }
  }

  // Investment Horizon
  if (profile.investmentHorizon) {
    switch (profile.investmentHorizon.effectiveHorizon) {
      case '5_10': score -= 10; break;
      case '10_20': score += 5; break;
      case '20_plus': score += 15; break;
    }
    if (profile.investmentHorizon.hasIntergenerationalPolicy) score += 5;
  }

  // Liquidity Needs
  if (profile.liquidityProfile) {
    const t1Need = profile.liquidityProfile.liquidityNeeds.t1;
    if (t1Need > 30) score -= 15;
    else if (t1Need > 20) score -= 10;
    else if (t1Need > 10) score -= 5;
    
    if (profile.liquidityProfile.requiresAnnualCashflow) score -= 5;
  }

  // Investment Philosophy
  if (profile.investmentPhilosophy) {
    if (profile.investmentPhilosophy.beliefs.illiquidityPremium) score += 5;
    if (profile.investmentPhilosophy.beliefs.activeAlpha) score += 3;
    if (profile.investmentPhilosophy.blackBoxAllocationPercent > 20) score += 5;
  }

  // Crisis Behavior
  if (profile.crisisScenarios) {
    switch (profile.crisisScenarios.market40PercentDrop) {
      case 'buy': score += 15; break;
      case 'hold': score += 5; break;
      case 'reduce': score -= 10; break;
    }
  }

  // Behavioral Profile
  if (profile.behavioralProfile) {
    switch (profile.behavioralProfile.covidPeriodBehavior) {
      case 'bought_dip': score += 10; break;
      case 'held_steady': score += 5; break;
      case 'reduced_exposure': score -= 5; break;
      case 'panicked': score -= 15; break;
    }
    switch (profile.behavioralProfile.selfAssessment) {
      case 'opportunistic': score += 5; break;
      case 'rational': score += 0; break;
      case 'reactive': score -= 10; break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function generateRecommendation(profile: FamilyOfficeProfile): StrategicRecommendation {
  const riskScore = calculateRiskScore(profile);
  
  // Determine risk band
  let riskBand: StrategicRecommendation['riskBand'];
  if (riskScore <= 30) riskBand = 'conservative';
  else if (riskScore <= 50) riskBand = 'balanced';
  else if (riskScore <= 75) riskBand = 'growth';
  else riskBand = 'aggressive';

  // Calculate allocation ranges based on risk band
  const allocations = {
    conservative: {
      equity: { min: 20, max: 40 },
      fixedIncome: { min: 35, max: 55 },
      alternatives: { min: 10, max: 25 },
      cash: { min: 10, max: 20 },
    },
    balanced: {
      equity: { min: 40, max: 60 },
      fixedIncome: { min: 20, max: 35 },
      alternatives: { min: 15, max: 30 },
      cash: { min: 5, max: 15 },
    },
    growth: {
      equity: { min: 55, max: 75 },
      fixedIncome: { min: 10, max: 25 },
      alternatives: { min: 15, max: 30 },
      cash: { min: 3, max: 10 },
    },
    aggressive: {
      equity: { min: 65, max: 85 },
      fixedIncome: { min: 5, max: 15 },
      alternatives: { min: 15, max: 35 },
      cash: { min: 2, max: 8 },
    },
  };

  const alloc = allocations[riskBand];

  // Calculate illiquidity budget based on horizon and liquidity needs
  let illiquidityBudget = 30;
  if (profile.investmentHorizon.effectiveHorizon === '20_plus') illiquidityBudget += 15;
  else if (profile.investmentHorizon.effectiveHorizon === '10_20') illiquidityBudget += 5;
  if (profile.liquidityProfile.liquidityNeeds.t1 > 20) illiquidityBudget -= 10;
  if (profile.investmentPhilosophy.beliefs.illiquidityPremium) illiquidityBudget += 10;
  illiquidityBudget = Math.max(10, Math.min(60, illiquidityBudget));

  // Geography tilt from preferences
  const geographyTilt = { ...profile.geographicCurrency.geographicPreferences };

  // Hedge budget
  const hedgeBudget = profile.geographicCurrency.hedgeRatio;

  // Liquidity buffer from T+1 needs
  const liquidityBuffer = Math.max(profile.liquidityProfile.liquidityNeeds.t1, 5);

  // ESG constraints
  const esgConstraints = [...profile.esgPolicy.sectorExclusions];
  if (profile.esgPolicy.requiresImpactAllocation) {
    esgConstraints.push(`Impact allocation: ${profile.esgPolicy.impactAllocationPercent}%`);
  }

  // Suggested benchmark
  let suggestedBenchmark = 'Custom Policy Index';
  if (profile.benchmarkingPreferences.primaryBenchmark === 'sp500') suggestedBenchmark = 'S&P 500';
  else if (profile.benchmarkingPreferences.primaryBenchmark === '60_40') suggestedBenchmark = '60/40 Portfolio';
  else if (profile.benchmarkingPreferences.primaryBenchmark === 'cpi_plus') {
    suggestedBenchmark = `CPI + ${profile.benchmarkingPreferences.cpiPlusTarget || 3}%`;
  }

  // Key considerations
  const keyConsiderations: string[] = [];
  if (profile.capitalObjectives.hasFutureCommitments) {
    keyConsiderations.push('Account for future capital commitments in liquidity planning');
  }
  if (profile.wealthStructure.hasConcentrationRisk) {
    keyConsiderations.push('Address single-asset concentration risk through diversification');
  }
  if (profile.liquidityProfile.hasUpcomingLiquidityEvents) {
    keyConsiderations.push('Maintain elevated cash reserves for upcoming liquidity events');
  }
  if (profile.regulatoryTax.requiresTaxAwareAllocation) {
    keyConsiderations.push('Implement tax-efficient asset location strategy');
  }
  if (profile.investmentHorizon.hasBeneficiaryDiversity) {
    keyConsiderations.push('Consider mandate splitting for diverse beneficiary needs');
  }
  if (profile.governance.hasInvestmentCommittee) {
    keyConsiderations.push('Align recommendations with IC governance framework');
  }

  return {
    riskBand,
    riskScore,
    equityRange: alloc.equity,
    fixedIncomeRange: alloc.fixedIncome,
    alternativesRange: alloc.alternatives,
    cashRange: alloc.cash,
    illiquidityBudget,
    geographyTilt,
    hedgeBudget,
    liquidityBuffer,
    esgConstraints,
    suggestedBenchmark,
    keyConsiderations,
  };
}

// Default empty profile for initialization
export const defaultFamilyOfficeProfile: FamilyOfficeProfile = {
  capitalObjectives: {
    primaryPurpose: 'mixed',
    mixedWeights: { preservation: 33, growth: 34, income: 33 },
    hasFutureCommitments: false,
    hasRealReturnTarget: false,
  },
  wealthStructure: {
    liquidAssets: 60,
    illiquidAssets: 40,
    assetBreakdown: {
      publicMarkets: 40,
      privateEquity: 20,
      realAssets: 20,
      operatingBusinesses: 10,
      cash: 10,
    },
    totalLeverageRatio: 0,
    hasConcentrationRisk: false,
  },
  liquidityProfile: {
    liquidityNeeds: { t1: 5, days30: 15, months12: 30 },
    requiresAnnualCashflow: false,
    hasUpcomingLiquidityEvents: false,
  },
  drawdownTolerance: {
    quarterlyDrawdownReaction: 'rebalance',
    maxAcceptableDrawdown: '20',
    riskPriority: 'tail_risk_control',
  },
  investmentHorizon: {
    effectiveHorizon: '10_20',
    hasIntergenerationalPolicy: false,
    hasBeneficiaryDiversity: false,
  },
  regulatoryTax: {
    primaryTaxJurisdictions: ['Israel'],
    hasInvestmentRestrictions: false,
    hasHoldingStructures: false,
    requiresTaxAwareAllocation: false,
  },
  geographicCurrency: {
    baseCurrency: 'USD',
    geographicPreferences: { israel: 20, us: 50, europe: 20, emergingMarkets: 10, other: 0 },
    hedgeRatio: 50,
  },
  investmentPhilosophy: {
    beliefs: {
      marketEfficiency: false,
      activeAlpha: true,
      factorInvesting: true,
      illiquidityPremium: true,
    },
    blackBoxAllocationPercent: 10,
  },
  alternativesPolicy: {
    targetAllocations: {
      privateEquity: 10,
      ventureCapital: 5,
      privateCredit: 5,
      infrastructure: 5,
      realEstate: 10,
    },
    maxLockupYears: 7,
    minimumIRR: 15,
    coInvestmentRatio: 30,
  },
  esgPolicy: {
    sectorExclusions: [],
    requiresImpactAllocation: false,
    valuesVsFinancialWeight: 'balanced',
  },
  governance: {
    decisionMaker: 'family_office',
    rebalancingFrequency: 'quarterly',
    hasInvestmentCommittee: false,
    hasSeparateRiskOfficer: false,
  },
  crisisScenarios: {
    market40PercentDrop: 'hold',
    highInflationResponse: 'change_allocation',
    geopoliticalCrisisResponse: 'maintain',
  },
  benchmarkingPreferences: {
    primaryBenchmark: 'cpi_plus',
    cpiPlusTarget: 3,
    successMetric: 'vs_real_target',
    maxTrackingError: 8,
  },
  behavioralProfile: {
    covidPeriodBehavior: 'held_steady',
    at15PercentLoss: 'held',
    selfAssessment: 'rational',
  },
};

export const WIZARD_STEPS = [
  { id: 'objectives', title: 'Objectives & Horizon', icon: 'Target' },
  { id: 'risk', title: 'Risk & Behavior', icon: 'Shield' },
  { id: 'wealth', title: 'Wealth & Liquidity', icon: 'Wallet' },
  { id: 'alternatives', title: 'Alternatives & Currency', icon: 'Layers' },
  { id: 'governance', title: 'Governance & Scenarios', icon: 'Users' },
] as const;

export type WizardStep = typeof WIZARD_STEPS[number]['id'];
