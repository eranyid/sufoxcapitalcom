import type { CashCurrency } from '@/types/investment';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪',
  GBP: '£',
  CHF: 'Fr',
  JPY: '¥',
};

export const CURRENCY_NAMES: Record<CashCurrency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  ILS: 'Israeli Shekel',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  JPY: 'Japanese Yen',
};
