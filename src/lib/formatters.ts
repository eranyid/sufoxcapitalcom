import { CURRENCY_SYMBOLS } from './currencies';

/**
 * Format a number as full USD currency (e.g. "$1,234,567").
 * Uses Intl.NumberFormat with no fractional digits by default.
 */
export function formatCurrency(
  value: number,
  options?: { decimals?: number; currency?: string }
): string {
  const { decimals = 0, currency = 'USD' } = options ?? {};
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as full currency with 2 decimal places.
 * Convenience wrapper for formatCurrency with decimals=2.
 */
export function formatCurrencyPrecise(
  value: number,
  currency = 'USD'
): string {
  return formatCurrency(value, { decimals: 2, currency });
}

/**
 * Format a number as compact currency (e.g. "$1.2M", "$450K").
 * Supports T/B/M/K suffixes. Uses absolute value for threshold checks
 * so negative values are handled correctly.
 */
export function formatCompactCurrency(value: number, prefix = '$'): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${prefix}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${prefix}${abs.toFixed(0)}`;
}

/**
 * Format a number as compact value without a currency prefix (e.g. "1.2B", "450K").
 */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

/**
 * Format a percentage with a sign prefix (e.g. "+12.34%", "-5.67%").
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format an amount with a currency symbol prefix (e.g. "$1,234.56", "₪5,000.00").
 * Uses the CURRENCY_SYMBOLS map for symbol lookup.
 */
export function formatAmountWithSymbol(
  amount: number,
  currency: string,
  options?: { decimals?: number }
): string {
  const { decimals = 2 } = options ?? {};
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
