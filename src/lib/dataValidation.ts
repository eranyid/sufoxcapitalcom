import { Transaction, MonthlyValuation, PortfolioSettings, CashBalances, PerformanceMetrics, RiskMetrics } from '@/types/investment';

export type DataIssueSeverity = "info" | "warning" | "error";

export type DataIssue = {
  id: string;
  severity: DataIssueSeverity;
  section: "Holdings" | "Transactions" | "Cash" | "Risk" | "MonteCarlo" | "Settings";
  message: string;
  details?: string;
  route?: string;
};

export type DataValidationResult = {
  ok: boolean;
  issues: DataIssue[];
  timestamp: Date;
};

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
  const positions: Record<string, { quantity: number; ticker: string; name: string }> = {};
  
  transactions.forEach(tx => {
    if (!positions[tx.ticker]) {
      positions[tx.ticker] = { quantity: 0, ticker: tx.ticker, name: tx.assetName };
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

  let totalValue = 0;
  const holdingValues: { ticker: string; value: number }[] = [];

  Object.entries(positions).forEach(([ticker, pos]) => {
    if (pos.quantity > 0) {
      const price = latestValuations[ticker]?.price || 0;
      
      if (price <= 0 && pos.quantity > 0) {
        issues.push({
          id: generateId(),
          severity: 'warning',
          section: 'Holdings',
          message: `${ticker} has no valid price data`,
          details: `Missing or zero price for active holding.`,
          route: '/valuations'
        });
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

export interface ValidationInput {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  settings: PortfolioSettings;
  cashBalances: CashBalances;
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
}

export function validatePortfolioData(input: ValidationInput): DataValidationResult {
  const issues: DataIssue[] = [];

  // Run all validations
  issues.push(...validateHoldings(input.transactions, input.valuations));
  issues.push(...validateTransactions(input.transactions));
  issues.push(...validateCashBalances(input.cashBalances));
  issues.push(...validateRiskMetrics(input.riskMetrics, input.performanceMetrics));
  issues.push(...validateSettings(input.settings));

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
