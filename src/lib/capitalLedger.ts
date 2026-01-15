/**
 * CAPITAL LEDGER SERVICE
 * Prime-Broker Grade Audit Trail for Cash Movements
 * 
 * Every capital movement must be recorded here.
 * No cash may appear or disappear without a ledger entry.
 */

import { supabase } from '@/integrations/supabase/client';

export type LedgerEntryType = 
  | 'BUY' 
  | 'SELL' 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'FX_CONVERSION' 
  | 'FEE' 
  | 'DIVIDEND' 
  | 'INTEREST';

export interface LedgerEntry {
  id: string;
  userId: string;
  transactionId?: string;
  entryType: LedgerEntryType;
  currency: string;
  amount: number;
  fxRateUsed?: number;
  baseCurrency?: string;
  amountBase?: number;
  runningBalance?: number;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateLedgerEntryInput {
  userId: string;
  transactionId?: string;
  entryType: LedgerEntryType;
  currency: string;
  amount: number;
  fxRateUsed?: number;
  baseCurrency?: string;
  amountBase?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a new ledger entry
 */
export async function createLedgerEntry(input: CreateLedgerEntryInput): Promise<LedgerEntry | null> {
  // Get current running balance for this currency
  const { data: lastEntry } = await (supabase
    .from('capital_ledger' as any)
    .select('running_balance')
    .eq('user_id', input.userId)
    .eq('currency', input.currency)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as any);

  const previousBalance = lastEntry?.running_balance ?? 0;
  const newBalance = Number(previousBalance) + input.amount;

  // Use type assertion since capital_ledger table was just created
  const { data, error } = await (supabase
    .from('capital_ledger' as any)
    .insert({
      user_id: input.userId,
      transaction_id: input.transactionId || null,
      entry_type: input.entryType,
      currency: input.currency,
      amount: input.amount,
      fx_rate_used: input.fxRateUsed || null,
      base_currency: input.baseCurrency || null,
      amount_base: input.amountBase || null,
      running_balance: newBalance,
      description: input.description || null,
      metadata: input.metadata || {}
    })
    .select()
    .single() as any);

  if (error) {
    console.error('[CapitalLedger] Failed to create entry:', error);
    return null;
  }

  return mapLedgerEntry(data);
}

/**
 * Get ledger entries for a user
 */
export async function getLedgerEntries(
  userId: string,
  options?: {
    currency?: string;
    entryType?: LedgerEntryType;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }
): Promise<LedgerEntry[]> {
  let query = supabase
    .from('capital_ledger' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as any;

  if (options?.currency) {
    query = query.eq('currency', options.currency);
  }
  if (options?.entryType) {
    query = query.eq('entry_type', options.entryType);
  }
  if (options?.fromDate) {
    query = query.gte('created_at', options.fromDate);
  }
  if (options?.toDate) {
    query = query.lte('created_at', options.toDate);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[CapitalLedger] Failed to fetch entries:', error);
    return [];
  }

  return (data || []).map(mapLedgerEntry);
}

/**
 * Get running balance for a currency
 */
export async function getRunningBalance(userId: string, currency: string): Promise<number> {
  const { data } = await (supabase
    .from('capital_ledger' as any)
    .select('running_balance')
    .eq('user_id', userId)
    .eq('currency', currency)
    .order('created_at', { ascending: false }) as any)
    .limit(1)
    .maybeSingle();

  return Number(data?.running_balance ?? 0);
}

/**
 * Verify ledger consistency - ensure running balances are correct
 */
export async function verifyLedgerConsistency(userId: string, currency: string): Promise<{
  isValid: boolean;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
}> {
  const { data: entries } = await (supabase
    .from('capital_ledger' as any)
    .select('amount, running_balance') as any)
    .eq('user_id', userId)
    .eq('currency', currency)
    .order('created_at', { ascending: true });

  if (!entries || entries.length === 0) {
    return { isValid: true, expectedBalance: 0, actualBalance: 0, discrepancy: 0 };
  }

  // Calculate expected balance from sum of amounts
  const expectedBalance = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  const actualBalance = Number(entries[entries.length - 1].running_balance);
  const discrepancy = Math.abs(expectedBalance - actualBalance);

  return {
    isValid: discrepancy < 0.01, // Allow for floating point errors
    expectedBalance,
    actualBalance,
    discrepancy
  };
}

/**
 * Create paired ledger entries for FX conversion
 */
export async function createFxConversionEntries(
  userId: string,
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number,
  toAmount: number,
  fxRate: number
): Promise<boolean> {
  // Debit from source currency
  const debitEntry = await createLedgerEntry({
    userId,
    entryType: 'FX_CONVERSION',
    currency: fromCurrency,
    amount: -fromAmount, // Negative for debit
    fxRateUsed: fxRate,
    baseCurrency: toCurrency,
    amountBase: toAmount,
    description: `FX Conversion: ${fromCurrency} → ${toCurrency}`,
    metadata: { fromCurrency, toCurrency, fxRate }
  });

  if (!debitEntry) return false;

  // Credit to target currency
  const creditEntry = await createLedgerEntry({
    userId,
    entryType: 'FX_CONVERSION',
    currency: toCurrency,
    amount: toAmount, // Positive for credit
    fxRateUsed: 1 / fxRate,
    baseCurrency: fromCurrency,
    amountBase: fromAmount,
    description: `FX Conversion: ${fromCurrency} → ${toCurrency}`,
    metadata: { fromCurrency, toCurrency, fxRate, linkedEntryId: debitEntry.id }
  });

  return !!creditEntry;
}

function mapLedgerEntry(data: any): LedgerEntry {
  return {
    id: data.id,
    userId: data.user_id,
    transactionId: data.transaction_id,
    entryType: data.entry_type as LedgerEntryType,
    currency: data.currency,
    amount: Number(data.amount),
    fxRateUsed: data.fx_rate_used ? Number(data.fx_rate_used) : undefined,
    baseCurrency: data.base_currency,
    amountBase: data.amount_base ? Number(data.amount_base) : undefined,
    runningBalance: data.running_balance ? Number(data.running_balance) : undefined,
    description: data.description,
    metadata: data.metadata,
    createdAt: data.created_at
  };
}
