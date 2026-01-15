/**
 * HOLDINGS TRACKER
 * Maintains accurate position snapshots with FX-adjusted cost basis
 * 
 * This is the single source of truth for current positions.
 */

import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/investment';
import { getFxRate, getDefaultFxRate } from './fxService';

export interface HoldingSnapshot {
  id: string;
  userId: string;
  ticker: string;
  assetName: string;
  quantity: number;
  avgCostLocal: number;
  avgCostBase: number;
  assetCurrency: string;
  baseCurrency: string;
  fxRateAtEntry: number | null;
  totalCostBase: number;
  lastUpdated: string;
  createdAt: string;
}

export interface HoldingWithMarketData extends HoldingSnapshot {
  currentPrice?: number;
  currentFxRate?: number;
  marketValueBase?: number;
  unrealizedPl?: number;
  unrealizedPlPercent?: number;
  fxPl?: number;
}

/**
 * Get all holdings for a user
 */
export async function getHoldings(userId: string): Promise<HoldingSnapshot[]> {
  const { data, error } = await (supabase
    .from('holdings_snapshot' as any)
    .select('*')
    .eq('user_id', userId)
    .gt('quantity', 0)
    .order('ticker') as any);

  if (error) {
    console.error('[HoldingsTracker] Failed to fetch holdings:', error);
    return [];
  }

  return (data || []).map(mapHoldingSnapshot);
}

/**
 * Get a specific holding
 */
export async function getHolding(userId: string, ticker: string): Promise<HoldingSnapshot | null> {
  const { data, error } = await (supabase
    .from('holdings_snapshot' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .maybeSingle() as any);

  if (error || !data) {
    return null;
  }

  return mapHoldingSnapshot(data);
}

/**
 * Update holding after a BUY transaction
 * Uses weighted average cost basis
 */
export async function updateHoldingForBuy(
  userId: string,
  ticker: string,
  assetName: string,
  quantity: number,
  priceLocal: number,
  assetCurrency: string,
  baseCurrency: string,
  fxRate: number
): Promise<HoldingSnapshot | null> {
  const existing = await getHolding(userId, ticker);
  
  const newCostLocal = quantity * priceLocal;
  const newCostBase = newCostLocal * fxRate;

  if (existing) {
    // Calculate weighted average
    const totalQuantity = existing.quantity + quantity;
    const totalCostBase = existing.totalCostBase + newCostBase;
    const avgCostBase = totalCostBase / totalQuantity;
    const avgCostLocal = avgCostBase / fxRate;

    const { data, error } = await (supabase
      .from('holdings_snapshot' as any)
      .update({
        quantity: totalQuantity,
        avg_cost_local: avgCostLocal,
        avg_cost_base: avgCostBase,
        total_cost_base: totalCostBase,
        fx_rate_at_entry: fxRate,
        last_updated: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single() as any);

    if (error) {
      console.error('[HoldingsTracker] Failed to update holding:', error);
      return null;
    }

    return mapHoldingSnapshot(data);
  } else {
    const { data, error } = await (supabase
      .from('holdings_snapshot' as any)
      .insert({
        user_id: userId,
        ticker,
        asset_name: assetName,
        quantity,
        avg_cost_local: priceLocal,
        avg_cost_base: priceLocal * fxRate,
        asset_currency: assetCurrency,
        base_currency: baseCurrency,
        fx_rate_at_entry: fxRate,
        total_cost_base: newCostBase
      })
      .select()
      .single() as any);

    if (error) {
      console.error('[HoldingsTracker] Failed to create holding:', error);
      return null;
    }

    return mapHoldingSnapshot(data);
  }
}

/**
 * Update holding after a SELL transaction
 * Returns realized P/L
 */
export async function updateHoldingForSell(
  userId: string,
  ticker: string,
  quantity: number,
  priceLocal: number,
  fxRate: number
): Promise<{ holding: HoldingSnapshot | null; realizedPl: number; realizedFxPl: number }> {
  const existing = await getHolding(userId, ticker);

  if (!existing) {
    console.error('[HoldingsTracker] Cannot sell non-existent holding:', ticker);
    return { holding: null, realizedPl: 0, realizedFxPl: 0 };
  }

  if (quantity > existing.quantity) {
    console.error('[HoldingsTracker] Cannot sell more than held:', quantity, '>', existing.quantity);
    return { holding: null, realizedPl: 0, realizedFxPl: 0 };
  }

  // Calculate realized P/L
  const saleProceeds = quantity * priceLocal * fxRate;
  const costBasisForSold = quantity * existing.avgCostBase;
  const realizedPl = saleProceeds - costBasisForSold;

  // Calculate FX P/L (difference between entry FX and exit FX)
  const entryFx = existing.fxRateAtEntry || fxRate;
  const fxChange = fxRate - entryFx;
  const realizedFxPl = quantity * priceLocal * fxChange;

  const newQuantity = existing.quantity - quantity;
  const newTotalCostBase = existing.totalCostBase - costBasisForSold;

  if (newQuantity === 0) {
    await (supabase
      .from('holdings_snapshot' as any)
      .delete()
      .eq('id', existing.id) as any);

    return { holding: null, realizedPl, realizedFxPl };
  }

  const { data, error } = await (supabase
    .from('holdings_snapshot' as any)
    .update({
      quantity: newQuantity,
      total_cost_base: newTotalCostBase,
      last_updated: new Date().toISOString()
    })
    .eq('id', existing.id)
    .select()
    .single() as any);

  if (error) {
    console.error('[HoldingsTracker] Failed to update holding after sell:', error);
    return { holding: null, realizedPl, realizedFxPl };
  }

  return { holding: mapHoldingSnapshot(data), realizedPl, realizedFxPl };
}

/**
 * Rebuild holdings from transactions (for data reconciliation)
 */
export async function rebuildHoldingsFromTransactions(
  userId: string,
  transactions: Transaction[],
  baseCurrency: string = 'USD'
): Promise<void> {
  await (supabase
    .from('holdings_snapshot' as any)
    .delete()
    .eq('user_id', userId) as any);

  // Group transactions by ticker
  const byTicker = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const existing = byTicker.get(tx.ticker) || [];
    existing.push(tx);
    byTicker.set(tx.ticker, existing);
  }

  // Process each ticker
  for (const [ticker, txs] of byTicker) {
    // Sort by date
    txs.sort((a, b) => a.date.localeCompare(b.date));

    let quantity = 0;
    let totalCostBase = 0;
    let assetName = '';
    let assetCurrency = 'USD';
    let lastFxRate = 1;

    for (const tx of txs) {
      const fxRate = getDefaultFxRate(tx.currency, baseCurrency);
      lastFxRate = fxRate;
      assetName = tx.assetName;
      assetCurrency = tx.currency;

      if (tx.transactionType === 'buy') {
        const costBase = tx.quantity * tx.pricePerUnit * fxRate;
        quantity += tx.quantity;
        totalCostBase += costBase;
      } else {
        // FIFO: proportionally reduce cost basis
        if (quantity > 0) {
          const avgCostPerUnit = totalCostBase / quantity;
          totalCostBase -= tx.quantity * avgCostPerUnit;
          quantity -= tx.quantity;
        }
      }
    }

    if (quantity > 0) {
      const avgCostBase = totalCostBase / quantity;
      const avgCostLocal = avgCostBase / lastFxRate;

      await (supabase
        .from('holdings_snapshot' as any)
        .insert({
          user_id: userId,
          ticker,
          asset_name: assetName,
          quantity,
          avg_cost_local: avgCostLocal,
          avg_cost_base: avgCostBase,
          asset_currency: assetCurrency,
          base_currency: baseCurrency,
          fx_rate_at_entry: lastFxRate,
          total_cost_base: totalCostBase
        }) as any);
    }
  }
}

function mapHoldingSnapshot(data: any): HoldingSnapshot {
  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    assetName: data.asset_name,
    quantity: Number(data.quantity),
    avgCostLocal: Number(data.avg_cost_local),
    avgCostBase: Number(data.avg_cost_base),
    assetCurrency: data.asset_currency,
    baseCurrency: data.base_currency,
    fxRateAtEntry: data.fx_rate_at_entry ? Number(data.fx_rate_at_entry) : null,
    totalCostBase: Number(data.total_cost_base),
    lastUpdated: data.last_updated,
    createdAt: data.created_at
  };
}
