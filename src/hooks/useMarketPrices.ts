import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientScope } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';

export interface MarketPrice {
  id: string;
  symbol: string;
  market: 'US' | 'IL';
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  currency: string;
  price_date: string;
  source: string;
  updated_at: string;
}

export interface MarketPriceRow extends MarketPrice {
  // Enriched with holdings data
  quantity: number;
  assetName: string;
  marketValue: number;
  dailyChangePct: number | null;
}

export function useMarketPrices() {
  const [prices, setPrices] = useState<MarketPriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchErrors, setFetchErrors] = useState<{ symbol: string; error: string }[]>([]);
  const [stats, setStats] = useState<{ fetchedCount: number; cachedCount: number }>({ fetchedCount: 0, cachedCount: 0 });
  const { clientId: activeClientId } = useClientScope();
  const { toast } = useToast();

  const fetchPrices = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setFetchErrors([]);

    try {
      // Get holdings for enrichment
      let holdingsQuery = supabase
        .from('holdings_snapshot')
        .select('ticker, asset_name, quantity, asset_currency')
        .gt('quantity', 0);

      if (activeClientId) {
        holdingsQuery = holdingsQuery.eq('client_id', activeClientId);
      }

      const { data: holdings } = await holdingsQuery;
      const holdingsMap = new Map(
        (holdings || []).map((h: any) => [h.ticker, { name: h.asset_name, qty: h.quantity, currency: h.asset_currency }])
      );

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('fetch-market-prices', {
        body: { forceRefresh, clientId: activeClientId },
      });

      if (fnError) throw new Error(fnError.message);

      if (data.error) throw new Error(data.error);

      const rawPrices: MarketPrice[] = data.prices || [];
      if (data.errors) setFetchErrors(data.errors);
      setStats({ fetchedCount: data.fetchedCount || 0, cachedCount: data.cachedCount || 0 });

      // Enrich with holdings data
      const enriched: MarketPriceRow[] = rawPrices.map((p) => {
        const holding = holdingsMap.get(p.symbol);
        const qty = holding?.qty || 0;
        const dailyChangePct = p.open && p.open > 0 ? ((p.close - p.open) / p.open) * 100 : null;

        return {
          ...p,
          quantity: qty,
          assetName: holding?.name || p.symbol,
          marketValue: qty * p.close,
          dailyChangePct,
        };
      });

      // Sort: US first, then IL, alphabetically
      enriched.sort((a, b) => {
        if (a.market !== b.market) return a.market === 'US' ? -1 : 1;
        return a.symbol.localeCompare(b.symbol);
      });

      setPrices(enriched);

      if (data.errors?.length > 0) {
        toast({
          title: 'Some symbols failed',
          description: `Could not fetch data for: ${data.errors.map((e: any) => e.symbol).join(', ')}`,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Market prices error:', err);
      setError(err.message || 'Failed to fetch market prices');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch market prices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeClientId, toast]);

  return { prices, loading, error, fetchErrors, stats, fetchPrices };
}
