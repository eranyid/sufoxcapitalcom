/**
 * FX SERVICE
 * Foreign Exchange Rate Management
 * 
 * Handles storage, retrieval, and conversion of currencies.
 * All FX operations must go through this service.
 */

import { supabase } from '@/integrations/supabase/client';

export interface FxRate {
  id: string;
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: string;
  source: string;
  createdAt: string;
}

export interface FxRateInput {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: string;
  source?: string;
}

// Default static rates (fallback when no user rates exist)
const DEFAULT_FX_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1, EUR: 0.92, ILS: 3.70, GBP: 0.79, CHF: 0.88, JPY: 149.5 },
  EUR: { USD: 1.087, EUR: 1, ILS: 4.02, GBP: 0.86, CHF: 0.96, JPY: 162.5 },
  ILS: { USD: 0.27, EUR: 0.249, ILS: 1, GBP: 0.21, CHF: 0.24, JPY: 40.4 },
  GBP: { USD: 1.27, EUR: 1.16, ILS: 4.69, GBP: 1, CHF: 1.12, JPY: 189.5 },
  CHF: { USD: 1.14, EUR: 1.04, ILS: 4.20, GBP: 0.89, CHF: 1, JPY: 170.0 },
  JPY: { USD: 0.0067, EUR: 0.0062, ILS: 0.025, GBP: 0.0053, CHF: 0.0059, JPY: 1 }
};

/**
 * Get the FX rate for a currency pair on a specific date
 * Falls back to most recent available rate, then to defaults
 */
export async function getFxRate(
  userId: string,
  fromCurrency: string,
  toCurrency: string,
  date?: string
): Promise<number> {
  // Same currency = rate is 1
  if (fromCurrency === toCurrency) return 1;

  // Try to get user-specific rate (using any cast since fx_rates table was just created)
  let query = (supabase
    .from('fx_rates' as any)
    .select('rate')
    .eq('user_id', userId)
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .order('rate_date', { ascending: false })
    .limit(1) as any);

  if (date) {
    query = query.lte('rate_date', date);
  }

  const { data } = await query.maybeSingle();

  if (data) {
    return Number(data.rate);
  }

  // Try inverse rate
  const inverseQuery = (supabase
    .from('fx_rates' as any)
    .select('rate')
    .eq('user_id', userId)
    .eq('from_currency', toCurrency)
    .eq('to_currency', fromCurrency)
    .order('rate_date', { ascending: false })
    .limit(1) as any);

  if (date) {
    inverseQuery.lte('rate_date', date);
  }

  const { data: inverseData } = await inverseQuery.maybeSingle();

  if (inverseData) {
    return 1 / Number(inverseData.rate);
  }

  // Fall back to default rates
  return getDefaultFxRate(fromCurrency, toCurrency);
}

/**
 * Get default FX rate from static table
 */
export function getDefaultFxRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1;
  
  const fromRates = DEFAULT_FX_RATES[fromCurrency];
  if (fromRates && fromRates[toCurrency]) {
    return fromRates[toCurrency];
  }

  // Try inverse
  const toRates = DEFAULT_FX_RATES[toCurrency];
  if (toRates && toRates[fromCurrency]) {
    return 1 / toRates[fromCurrency];
  }

  // Cross rate through USD
  const fromToUsd = DEFAULT_FX_RATES[fromCurrency]?.USD ?? 1;
  const usdToTarget = DEFAULT_FX_RATES.USD?.[toCurrency] ?? 1;
  return fromToUsd * usdToTarget;
}

/**
 * Save a new FX rate
 */
export async function saveFxRate(input: FxRateInput): Promise<FxRate | null> {
  const { data, error } = await (supabase
    .from('fx_rates' as any)
    .insert({
      user_id: input.userId,
      from_currency: input.fromCurrency,
      to_currency: input.toCurrency,
      rate: input.rate,
      rate_date: input.rateDate,
      source: input.source || 'manual'
    })
    .select()
    .single() as any);

  if (error) {
    console.error('[FxService] Failed to save rate:', error);
    return null;
  }

  return mapFxRate(data);
}

/**
 * Get all FX rates for a user
 */
export async function getFxRates(userId: string, limit = 100): Promise<FxRate[]> {
  const { data, error } = await (supabase
    .from('fx_rates' as any)
    .select('*')
    .eq('user_id', userId)
    .order('rate_date', { ascending: false })
    .limit(limit) as any);

  if (error) {
    console.error('[FxService] Failed to fetch rates:', error);
    return [];
  }

  return (data || []).map(mapFxRate);
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
  userId: string,
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: string
): Promise<{ convertedAmount: number; fxRate: number }> {
  const fxRate = await getFxRate(userId, fromCurrency, toCurrency, date);
  return {
    convertedAmount: amount * fxRate,
    fxRate
  };
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(DEFAULT_FX_RATES);
}

/**
 * Batch upsert FX rates
 */
export async function batchUpsertFxRates(
  userId: string,
  rates: Array<{ fromCurrency: string; toCurrency: string; rate: number; rateDate: string }>
): Promise<boolean> {
  const insertData = rates.map(r => ({
    user_id: userId,
    from_currency: r.fromCurrency,
    to_currency: r.toCurrency,
    rate: r.rate,
    rate_date: r.rateDate,
    source: 'batch'
  }));

  const { error } = await (supabase
    .from('fx_rates' as any)
    .upsert(insertData, {
      onConflict: 'user_id,from_currency,to_currency,rate_date'
    }) as any);

  if (error) {
    console.error('[FxService] Batch upsert failed:', error);
    return false;
  }

  return true;
}

function mapFxRate(data: any): FxRate {
  return {
    id: data.id,
    userId: data.user_id,
    fromCurrency: data.from_currency,
    toCurrency: data.to_currency,
    rate: Number(data.rate),
    rateDate: data.rate_date,
    source: data.source,
    createdAt: data.created_at
  };
}
