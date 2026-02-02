import { Transaction, MonthlyValuation, PortfolioSettings, CashBalances, PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { FactorModelResults, validateFactorModel } from '@/lib/factorModel';

export type DataIssueSeverity = "info" | "warning" | "error";

export type DataIssue = {
  id: string;
  severity: DataIssueSeverity;
  section: "Holdings" | "Transactions" | "Cash" | "Risk" | "MonteCarlo" | "Settings" | "FactorModel";
  message: string;
  details?: string;
  route?: string;
};

export type DataValidationResult = {
  ok: boolean;
  issues: DataIssue[];
  timestamp: Date;
};

// Monte Carlo result types for validation
export interface MonteCarloHorizonResult {
  horizon: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  probGain: number;
  probLoss: number;
  var95: number;
  cvar95: number;
  expectedValue: number;
}

export interface MonteCarloValidationInput {
  numSimulations: number;
  horizonYears: number;
  horizonResults: MonteCarloHorizonResult[];
  distribution?: { count: number; percentage: number; midpoint: number }[];
}

// Lightweight Monte Carlo simulation for watchdog validation
function generateNormalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function getPercentile(sortedValues: number[], percentile: number): number {
  const index = Math.floor((percentile / 100) * sortedValues.length);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

export function runLightweightMonteCarlo(
  monthlyReturns: number[],
  currentValue: number,
  numSimulations: number = 1000,
  horizonYears: number = 5
): MonteCarloValidationInput | null {
  if (monthlyReturns.length < 3 || currentValue <= 0) {
    return null;
  }

  // Convert to log returns
  const logReturns = monthlyReturns.map(r => Math.log(1 + r / 100));
  
  // Calculate stats
  const n = logReturns.length;
  const mean = logReturns.reduce((a, b) => a + b, 0) / n;
  const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);

  const totalSteps = horizonYears * 12;
  const finalValues: number[] = [];

  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    let value = currentValue;
    
    for (let step = 0; step < totalSteps; step++) {
      const z = generateNormalRandom();
      const logReturn = mean - 0.5 * std * std + std * z;
      value = value * Math.exp(logReturn);
    }
    
    finalValues.push(value);
  }

  finalValues.sort((a, b) => a - b);

  // Calculate metrics
  const p5 = getPercentile(finalValues, 5);
  const p25 = getPercentile(finalValues, 25);
  const p50 = getPercentile(finalValues, 50);
  const p75 = getPercentile(finalValues, 75);
  const p95 = getPercentile(finalValues, 95);
  
  const probGain = (finalValues.filter(v => v > currentValue).length / finalValues.length) * 100;
  const probLoss = 100 - probGain;
  
  const cutoffIndex = Math.floor(0.05 * numSimulations);
  const var95 = ((p5 - currentValue) / currentValue) * 100;
  const tailValues = finalValues.slice(0, cutoffIndex + 1);
  const avgTailValue = tailValues.reduce((a, b) => a + b, 0) / tailValues.length;
  const cvar95 = ((avgTailValue - currentValue) / currentValue) * 100;
  const expectedValue = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;

  return {
    numSimulations,
    horizonYears,
    horizonResults: [{
      horizon: horizonYears,
      p5, p25, p50, p75, p95,
      probGain, probLoss,
      var95, cvar95,
      expectedValue
    }]
  };
}

const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'ILS', 'OTHER'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function validateHoldings(
  transactions: Transaction[],
  valuations: MonthlyValuation[]
): DataIssue[] {
  const issues: DataIssue[] = [];

  // Calculate current positions
  const positions: Record<string, { quantity: number; ticker: string; name: string; currency: string }> = {};
  
  transactions.forEach(tx => {
    if (!positions[tx.ticker]) {
      positions[tx.ticker] = { quantity: 0, ticker: tx.ticker, name: tx.assetName, currency: tx.currency };
    }
    if (tx.transactionType === 'buy') {
      positions[tx.ticker].quantity += tx.quantity;
    } else {
      positions[tx.ticker].quantity -= tx.quantity;
    }
  });

  // Check for negative quantities
  Object.entries(positions).forEach(([ticker, pos]) => {
    if (pos.quantity < 0) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Holdings',
        message: `${ticker} has negative quantity (${pos.quantity.toFixed(2)})`,
        details: `Holding ${pos.name} shows negative shares, which may indicate transaction errors.`,
        route: '/transactions'
      });
    }
  });

  // Get latest valuations and calculate weights
  const latestValuations: Record<string, { price: number; month: string }> = {};
  valuations.forEach(v => {
    if (!latestValuations[v.ticker] || v.month > latestValuations[v.ticker].month) {
      latestValuations[v.ticker] = { price: v.pricePerUnit, month: v.month };
    }
  });

  // Get current month for comparison
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thirtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const staleThresholdMonth = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}`;

  // Track holdings with missing or stale valuations
  const holdingsWithoutValuation: string[] = [];
  const holdingsWithStaleValuation: { ticker: string; lastMonth: string }[] = [];

  let totalValue = 0;
  const holdingValues: { ticker: string; value: number }[] = [];

  Object.entries(positions).forEach(([ticker, pos]) => {
    if (pos.quantity > 0) {
      const valuation = latestValuations[ticker];
      const price = valuation?.price || 0;
      
      // Check for MISSING valuation (no price data at all)
      if (!valuation) {
        holdingsWithoutValuation.push(ticker);
        issues.push({
          id: generateId(),
          severity: 'error',
          section: 'Holdings',
          message: `${ticker} has no valuation data`,
          details: `Missing price data causes incorrect P/L calculations. Add monthly valuation for this asset.`,
          route: '/valuations'
        });
      } else {
        // Check for STALE valuation (older than 60 days)
        if (valuation.month < staleThresholdMonth) {
          holdingsWithStaleValuation.push({ ticker, lastMonth: valuation.month });
          issues.push({
            id: generateId(),
            severity: 'warning',
            section: 'Holdings',
            message: `${ticker} valuation is outdated (last: ${valuation.month})`,
            details: `Valuation data is over 60 days old. Update with current price.`,
            route: '/valuations'
          });
        }
        
        if (price <= 0) {
          issues.push({
            id: generateId(),
            severity: 'warning',
            section: 'Holdings',
            message: `${ticker} has zero or negative price`,
            details: `Missing or zero price for active holding.`,
            route: '/valuations'
          });
        }
      }

      if (isNaN(price) || !isFinite(price)) {
        issues.push({
          id: generateId(),
          severity: 'error',
          section: 'Holdings',
          message: `${ticker} price is NaN or Infinity`,
          details: `Invalid price value detected.`,
          route: '/valuations'
        });
      }

      const value = pos.quantity * price;
      if (!isNaN(value) && isFinite(value)) {
        totalValue += value;
        holdingValues.push({ ticker, value });
      }
    }
  });

  // Summary issue if multiple holdings missing valuations
  if (holdingsWithoutValuation.length > 1) {
    issues.unshift({
      id: generateId(),
      severity: 'error',
      section: 'Holdings',
      message: `${holdingsWithoutValuation.length} holdings missing current valuations`,
      details: `Assets without prices: ${holdingsWithoutValuation.join(', ')}. Unrealized P/L will be incorrect.`,
      route: '/valuations'
    });
  }

  // Check weights sum
  if (totalValue > 0 && holdingValues.length > 0) {
    const weightSum = holdingValues.reduce((sum, h) => sum + (h.value / totalValue) * 100, 0);
    if (Math.abs(weightSum - 100) > 0.5) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'Holdings',
        message: `Weights sum to ${weightSum.toFixed(1)}% (expected ~100%)`,
        details: `Portfolio weights should sum to approximately 100%.`,
        route: '/xray'
      });
    }
  }

  return issues;
}

function validateTransactions(transactions: Transaction[]): DataIssue[] {
  const issues: DataIssue[] = [];
  const today = new Date().toISOString().split('T')[0];
  let futureDatesCount = 0;

  transactions.forEach(tx => {
    // Check for future dates
    if (tx.date > today) {
      futureDatesCount++;
    }

    // Check price validity
    if (tx.pricePerUnit <= 0) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Transactions',
        message: `Transaction for ${tx.ticker} has invalid price (${tx.pricePerUnit})`,
        details: `Price per unit must be positive.`,
        route: '/transactions'
      });
    }

    // Check quantity validity
    if (tx.quantity <= 0) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Transactions',
        message: `Transaction for ${tx.ticker} has invalid quantity (${tx.quantity})`,
        details: `Quantity must be positive.`,
        route: '/transactions'
      });
    }

    // Check currency
    if (!ALLOWED_CURRENCIES.includes(tx.currency)) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'Transactions',
        message: `Transaction for ${tx.ticker} has unrecognized currency (${tx.currency})`,
        details: `Expected one of: ${ALLOWED_CURRENCIES.join(', ')}`,
        route: '/transactions'
      });
    }

    // Check for NaN/Infinity values
    if (isNaN(tx.quantity) || !isFinite(tx.quantity)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Transactions',
        message: `Transaction for ${tx.ticker} has NaN/Infinity quantity`,
        route: '/transactions'
      });
    }

    if (isNaN(tx.pricePerUnit) || !isFinite(tx.pricePerUnit)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Transactions',
        message: `Transaction for ${tx.ticker} has NaN/Infinity price`,
        route: '/transactions'
      });
    }
  });

  if (futureDatesCount > 0) {
    issues.push({
      id: generateId(),
      severity: 'error',
      section: 'Transactions',
      message: `${futureDatesCount} trade(s) have future dates`,
      details: `Transactions should not be dated in the future.`,
      route: '/transactions'
    });
  }

  return issues;
}

function validateCashBalances(cashBalances: CashBalances): DataIssue[] {
  const issues: DataIssue[] = [];

  Object.entries(cashBalances).forEach(([currency, balance]) => {
    if (isNaN(balance)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Cash',
        message: `${currency} balance is NaN`,
        details: `Cash balance should be a valid number.`,
        route: '/'
      });
    }

    if (!isFinite(balance)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Cash',
        message: `${currency} balance is Infinity`,
        route: '/'
      });
    }

    if (balance < 0) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'Cash',
        message: `${currency} has negative balance (${balance.toLocaleString()})`,
        details: `Negative cash may indicate margin usage or data entry error.`,
        route: '/'
      });
    }
  });

  return issues;
}

function validateRiskMetrics(riskMetrics: RiskMetrics | null, performanceMetrics: PerformanceMetrics | null): DataIssue[] {
  const issues: DataIssue[] = [];

  if (riskMetrics) {
    // Volatility check (0% - 300% reasonable range)
    if (isNaN(riskMetrics.volatility)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Risk',
        message: `Volatility is NaN`,
        route: '/risk'
      });
    } else if (riskMetrics.volatility < 0 || riskMetrics.volatility > 300) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'Risk',
        message: `Volatility (${riskMetrics.volatility.toFixed(1)}%) outside reasonable range (0-300%)`,
        route: '/risk'
      });
    }

    // Sharpe ratio check
    if (isNaN(riskMetrics.sharpeRatio) || !isFinite(riskMetrics.sharpeRatio)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Risk',
        message: `Sharpe ratio is ${isNaN(riskMetrics.sharpeRatio) ? 'NaN' : 'Infinity'}`,
        route: '/risk'
      });
    }

    // Sortino ratio check
    if (isNaN(riskMetrics.sortinoRatio) || !isFinite(riskMetrics.sortinoRatio)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Risk',
        message: `Sortino ratio is ${isNaN(riskMetrics.sortinoRatio) ? 'NaN' : 'Infinity'}`,
        route: '/risk'
      });
    }

    // Tracking error check
    if (isNaN(riskMetrics.trackingError)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Risk',
        message: `Tracking error is NaN`,
        route: '/risk'
      });
    } else if (riskMetrics.trackingError < 0) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Risk',
        message: `Tracking error is negative (${riskMetrics.trackingError.toFixed(2)}%)`,
        route: '/risk'
      });
    }

    // Beta check
    if (isNaN(riskMetrics.beta) || !isFinite(riskMetrics.beta)) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'Risk',
        message: `Beta is ${isNaN(riskMetrics.beta) ? 'NaN' : 'Infinity'}`,
        route: '/risk'
      });
    }

    // VaR checks
    if (isNaN(riskMetrics.var95) || !isFinite(riskMetrics.var95)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Risk',
        message: `VaR 95% is invalid`,
        route: '/risk'
      });
    }
  }

  if (performanceMetrics) {
    // Check max drawdown
    if (isNaN(performanceMetrics.maxDrawdown) || !isFinite(performanceMetrics.maxDrawdown)) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'Risk',
        message: `Max drawdown is ${isNaN(performanceMetrics.maxDrawdown) ? 'NaN' : 'Infinity'}`,
        route: '/risk'
      });
    }

    // Check for NaN in monthly returns
    const nanReturns = performanceMetrics.monthlyReturns.filter(r => isNaN(r.return) || !isFinite(r.return));
    if (nanReturns.length > 0) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'Risk',
        message: `${nanReturns.length} monthly return(s) contain invalid values`,
        route: '/performance'
      });
    }
  }

  return issues;
}

function validateSettings(settings: PortfolioSettings): DataIssue[] {
  const issues: DataIssue[] = [];

  if (isNaN(settings.riskFreeRate)) {
    issues.push({
      id: generateId(),
      severity: 'error',
      section: 'Settings',
      message: `Risk-free rate is NaN`,
      route: '/settings'
    });
  } else if (settings.riskFreeRate < 0 || settings.riskFreeRate > 50) {
    issues.push({
      id: generateId(),
      severity: 'warning',
      section: 'Settings',
      message: `Risk-free rate (${settings.riskFreeRate}%) outside typical range (0-50%)`,
      route: '/settings'
    });
  }

  if (!ALLOWED_CURRENCIES.includes(settings.baseCurrency)) {
    issues.push({
      id: generateId(),
      severity: 'warning',
      section: 'Settings',
      message: `Base currency (${settings.baseCurrency}) not recognized`,
      route: '/settings'
    });
  }

  return issues;
}

function validateMonteCarlo(monteCarloInput: MonteCarloValidationInput | null): DataIssue[] {
  const issues: DataIssue[] = [];

  if (!monteCarloInput) {
    return issues;
  }

  const { numSimulations, horizonYears, horizonResults, distribution } = monteCarloInput;

  // Validate configuration
  if (numSimulations <= 0) {
    issues.push({
      id: generateId(),
      severity: 'error',
      section: 'MonteCarlo',
      message: `Number of simulations must be positive (got ${numSimulations})`,
      route: '/risk'
    });
  }

  if (horizonYears <= 0) {
    issues.push({
      id: generateId(),
      severity: 'error',
      section: 'MonteCarlo',
      message: `Simulation horizon must be positive (got ${horizonYears} years)`,
      route: '/risk'
    });
  }

  // Validate horizon results
  horizonResults.forEach((result, idx) => {
    const invalidFields: string[] = [];

    // Check all numeric fields for NaN/Infinity
    const fieldsToCheck = [
      { name: 'p5', value: result.p5 },
      { name: 'p25', value: result.p25 },
      { name: 'p50', value: result.p50 },
      { name: 'p75', value: result.p75 },
      { name: 'p95', value: result.p95 },
      { name: 'probGain', value: result.probGain },
      { name: 'probLoss', value: result.probLoss },
      { name: 'VaR95', value: result.var95 },
      { name: 'CVaR95', value: result.cvar95 },
      { name: 'expectedValue', value: result.expectedValue },
    ];

    fieldsToCheck.forEach(({ name, value }) => {
      if (isNaN(value)) {
        invalidFields.push(`${name}=NaN`);
      } else if (!isFinite(value)) {
        invalidFields.push(`${name}=Infinity`);
      }
    });

    if (invalidFields.length > 0) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'MonteCarlo',
        message: `Simulation result for ${result.horizon}Y horizon contains invalid values`,
        details: `Invalid fields: ${invalidFields.join(', ')}`,
        route: '/risk'
      });
    }

    // Check for negative values where they shouldn't be
    if (result.p5 < 0 || result.p25 < 0 || result.p50 < 0 || result.p75 < 0 || result.p95 < 0) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'MonteCarlo',
        message: `${result.horizon}Y horizon shows negative portfolio values`,
        details: `This indicates potential total loss scenarios in the simulation.`,
        route: '/risk'
      });
    }

    // Check probability sanity
    if (result.probGain < 0 || result.probGain > 100 || result.probLoss < 0 || result.probLoss > 100) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'MonteCarlo',
        message: `${result.horizon}Y horizon has invalid probability values`,
        details: `Probabilities should be between 0% and 100%.`,
        route: '/risk'
      });
    }
  });

  // Validate distribution if provided
  if (distribution && distribution.length > 0) {
    let hasInvalidDistribution = false;
    let invalidCount = 0;

    distribution.forEach(bin => {
      if (isNaN(bin.count) || !isFinite(bin.count) ||
          isNaN(bin.percentage) || !isFinite(bin.percentage) ||
          isNaN(bin.midpoint) || !isFinite(bin.midpoint)) {
        hasInvalidDistribution = true;
        invalidCount++;
      }
    });

    if (hasInvalidDistribution) {
      issues.push({
        id: generateId(),
        severity: 'error',
        section: 'MonteCarlo',
        message: `Distribution histogram contains ${invalidCount} invalid bin(s)`,
        details: `NaN or Infinity values detected in distribution data.`,
        route: '/risk'
      });
    }

    // Check if percentages sum to ~100%
    const totalPercentage = distribution.reduce((sum, bin) => sum + bin.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 1) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'MonteCarlo',
        message: `Distribution percentages sum to ${totalPercentage.toFixed(1)}% (expected ~100%)`,
        route: '/risk'
      });
    }
  }

  return issues;
}

function validateFactorModelResults(factorModelResults: FactorModelResults | null): DataIssue[] {
  const issues: DataIssue[] = [];

  if (!factorModelResults) {
    return issues;
  }

  const validation = validateFactorModel(factorModelResults);
  
  if (!validation.isValid) {
    validation.issues.forEach(issue => {
      issues.push({
        id: generateId(),
        severity: issue.includes('NaN') || issue.includes('negative') ? 'error' : 'warning',
        section: 'FactorModel',
        message: issue,
        route: '/risk'
      });
    });
  }

  // Additional validations
  // Check for extreme betas
  factorModelResults.exposures.forEach(exp => {
    if (Math.abs(exp.beta) > 5) {
      issues.push({
        id: generateId(),
        severity: 'warning',
        section: 'FactorModel',
        message: `${exp.factorLabel} has extreme beta (${exp.beta.toFixed(2)})`,
        details: 'Beta values above 5 or below -5 may indicate data issues.',
        route: '/risk'
      });
    }
  });

  // Check for very low R² across all factors
  const avgR2 = factorModelResults.exposures.reduce((sum, e) => sum + e.r2, 0) / factorModelResults.exposures.length;
  if (avgR2 < 0.05) {
    issues.push({
      id: generateId(),
      severity: 'info',
      section: 'FactorModel',
      message: `Low average factor R² (${(avgR2 * 100).toFixed(1)}%)`,
      details: 'Portfolio returns have low correlation with standard factors.',
      route: '/risk'
    });
  }

  return issues;
}

export interface ValidationInput {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  settings: PortfolioSettings;
  cashBalances: CashBalances;
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  monteCarloInput?: MonteCarloValidationInput | null;
  factorModelResults?: FactorModelResults | null;
}

export function validatePortfolioData(input: ValidationInput): DataValidationResult {
  const issues: DataIssue[] = [];

  // Run all validations
  issues.push(...validateHoldings(input.transactions, input.valuations));
  issues.push(...validateTransactions(input.transactions));
  issues.push(...validateCashBalances(input.cashBalances));
  issues.push(...validateRiskMetrics(input.riskMetrics, input.performanceMetrics));
  issues.push(...validateSettings(input.settings));
  issues.push(...validateMonteCarlo(input.monteCarloInput || null));
  issues.push(...validateFactorModelResults(input.factorModelResults || null));

  // Sort by severity: error > warning > info
  const severityOrder: Record<DataIssueSeverity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const hasErrors = issues.some(i => i.severity === 'error');

  return {
    ok: !hasErrors,
    issues,
    timestamp: new Date()
  };
}
