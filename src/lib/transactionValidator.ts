/**
 * TRANSACTION VALIDATOR
 * Prime-Broker Grade Trade Validation
 * 
 * Every trade must pass validation before execution.
 * No position may go negative. No cash may be created from nothing.
 */

import { supabase } from '@/integrations/supabase/client';
import { getFxRate, getDefaultFxRate } from './fxService';
import { CashBalances, Transaction } from '@/types/investment';

export interface TradeValidationInput {
  userId: string;
  ticker: string;
  transactionType: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
  fees: number;
  assetCurrency: string;
  baseCurrency: string;
  cashBalances: CashBalances;
  existingHoldings?: Map<string, number>;
}

export interface TradeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculatedValues: {
    costLocal: number;
    costBase: number;
    totalCostWithFees: number;
    fxRate: number;
    cashImpact: number;
    cashImpactCurrency: string;
    availableCash: number;
    currentHolding: number;
    newHolding: number;
  };
}

/**
 * Validate a trade before execution
 */
export async function validateTrade(input: TradeValidationInput): Promise<TradeValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get FX rate
  const fxRate = await getFxRate(
    input.userId,
    input.assetCurrency,
    input.baseCurrency,
    new Date().toISOString().slice(0, 10)
  );

  // Calculate costs
  const costLocal = input.quantity * input.pricePerUnit;
  const costBase = costLocal * fxRate;
  const totalCostWithFees = costBase + input.fees;

  // Determine which cash currency to use (prefer asset currency if available)
  const cashCurrency = getCashCurrency(input.assetCurrency, input.cashBalances);
  const availableCash = input.cashBalances[cashCurrency as keyof CashBalances] ?? 0;

  // Get current holding quantity
  const currentHolding = input.existingHoldings?.get(input.ticker) ?? 0;

  let cashImpact: number;
  let newHolding: number;

  if (input.transactionType === 'buy') {
    // BUY: Need to subtract from cash
    cashImpact = -totalCostWithFees;
    newHolding = currentHolding + input.quantity;

    // Validate sufficient cash
    if (availableCash < totalCostWithFees) {
      errors.push(
        `Insufficient cash. Required: ${formatCurrency(totalCostWithFees, cashCurrency)}, ` +
        `Available: ${formatCurrency(availableCash, cashCurrency)}`
      );
    }

    // Warning for large position
    if (totalCostWithFees > availableCash * 0.5) {
      warnings.push('This trade uses more than 50% of available cash in this currency');
    }
  } else {
    // SELL: Need to add to cash
    const proceedsBase = costBase - input.fees;
    cashImpact = proceedsBase;
    newHolding = currentHolding - input.quantity;

    // Validate sufficient holdings
    if (input.quantity > currentHolding) {
      errors.push(
        `Insufficient holdings. Trying to sell ${input.quantity.toLocaleString()} but only have ${currentHolding.toLocaleString()}`
      );
    }

    // No negative positions allowed
    if (newHolding < 0) {
      errors.push('Cannot create negative position. Short selling is not supported.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculatedValues: {
      costLocal,
      costBase,
      totalCostWithFees,
      fxRate,
      cashImpact,
      cashImpactCurrency: cashCurrency,
      availableCash,
      currentHolding,
      newHolding
    }
  };
}

/**
 * Synchronous validation with static FX rates (for immediate UI feedback)
 */
export function validateTradeSync(input: TradeValidationInput): TradeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get static FX rate
  const fxRate = getDefaultFxRate(input.assetCurrency, input.baseCurrency);

  // Calculate costs
  const costLocal = input.quantity * input.pricePerUnit;
  const costBase = costLocal * fxRate;
  const totalCostWithFees = costBase + input.fees;

  // Determine which cash currency to use
  const cashCurrency = getCashCurrency(input.assetCurrency, input.cashBalances);
  const availableCash = input.cashBalances[cashCurrency as keyof CashBalances] ?? 0;

  // Get current holding quantity
  const currentHolding = input.existingHoldings?.get(input.ticker) ?? 0;

  let cashImpact: number;
  let newHolding: number;

  if (input.transactionType === 'buy') {
    cashImpact = -totalCostWithFees;
    newHolding = currentHolding + input.quantity;

    if (availableCash < totalCostWithFees) {
      errors.push(
        `Insufficient cash. Required: ${formatCurrency(totalCostWithFees, cashCurrency)}, ` +
        `Available: ${formatCurrency(availableCash, cashCurrency)}`
      );
    }

    if (totalCostWithFees > availableCash * 0.5) {
      warnings.push('This trade uses more than 50% of available cash in this currency');
    }
  } else {
    const proceedsBase = costBase - input.fees;
    cashImpact = proceedsBase;
    newHolding = currentHolding - input.quantity;

    if (input.quantity > currentHolding) {
      errors.push(
        `Insufficient holdings. Trying to sell ${input.quantity.toLocaleString()} but only have ${currentHolding.toLocaleString()}`
      );
    }

    if (newHolding < 0) {
      errors.push('Cannot create negative position');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculatedValues: {
      costLocal,
      costBase,
      totalCostWithFees,
      fxRate,
      cashImpact,
      cashImpactCurrency: cashCurrency,
      availableCash,
      currentHolding,
      newHolding
    }
  };
}

/**
 * Validate NAV consistency
 * NAV = sum(market_value_base) + sum(cash_balances_base)
 */
export function validateNavConsistency(
  holdingsValue: number,
  cashBalances: CashBalances,
  baseCurrency: string,
  reportedNav: number
): { isValid: boolean; calculatedNav: number; discrepancy: number } {
  // Convert all cash to base currency
  let totalCashBase = 0;

  for (const [currency, amount] of Object.entries(cashBalances)) {
    const rate = getDefaultFxRate(currency, baseCurrency);
    totalCashBase += amount * rate;
  }

  const calculatedNav = holdingsValue + totalCashBase;
  const discrepancy = Math.abs(calculatedNav - reportedNav);

  return {
    isValid: discrepancy < 0.01, // Allow for floating point errors
    calculatedNav,
    discrepancy
  };
}

/**
 * Determine which cash currency to use for a trade
 * Priority: asset currency (if we track it) > base currency
 */
function getCashCurrency(assetCurrency: string, cashBalances: CashBalances): string {
  // Check if we have this currency in our cash balances
  const availableCurrencies = ['USD', 'EUR', 'ILS'] as const;
  
  if (availableCurrencies.includes(assetCurrency as any)) {
    return assetCurrency;
  }

  // Default to USD
  return 'USD';
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    ILS: '₪',
    GBP: '£',
    CHF: 'CHF ',
    JPY: '¥'
  };

  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate holdings map from transactions
 */
export function calculateHoldingsFromTransactions(transactions: Transaction[]): Map<string, number> {
  const holdings = new Map<string, number>();

  for (const tx of transactions) {
    const current = holdings.get(tx.ticker) || 0;
    if (tx.transactionType === 'buy') {
      holdings.set(tx.ticker, current + tx.quantity);
    } else {
      holdings.set(tx.ticker, current - tx.quantity);
    }
  }

  // Remove zero or negative holdings
  for (const [ticker, quantity] of holdings) {
    if (quantity <= 0) {
      holdings.delete(ticker);
    }
  }

  return holdings;
}
