import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TickerSymbol {
  id: string;
  label: string;
  tv_symbol: string;
  category: string;
  enabled: boolean;
  order_index: number;
}

const DEFAULT_SYMBOLS: Omit<TickerSymbol, 'id'>[] = [
  { label: 'USD / ILS', tv_symbol: 'FOREXCOM:USDILS', category: 'FX', enabled: true, order_index: 0 },
  { label: 'EUR / ILS', tv_symbol: 'FOREXCOM:EURILS', category: 'FX', enabled: true, order_index: 1 },
  { label: 'Nikkei 225', tv_symbol: 'TVC:NI225', category: 'Index', enabled: true, order_index: 2 },
  { label: 'NASDAQ 100', tv_symbol: 'NASDAQ:NDX', category: 'Index', enabled: true, order_index: 3 },
  { label: 'S&P 500', tv_symbol: 'SP:SPX', category: 'Index', enabled: true, order_index: 4 },
  { label: 'VIX', tv_symbol: 'TVC:VIX', category: 'Index', enabled: true, order_index: 5 },
  { label: 'Bitcoin', tv_symbol: 'BITSTAMP:BTCUSD', category: 'Crypto', enabled: true, order_index: 6 },
  { label: 'Gold', tv_symbol: 'TVC:GOLD', category: 'Commodities', enabled: true, order_index: 7 },
];

export function useTickerSymbols() {
  const { user } = useAuth();
  const [symbols, setSymbols] = useState<TickerSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSymbols = useCallback(async () => {
    if (!user) {
      setSymbols([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('ticker_symbols')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setSymbols(data);
      } else {
        // Initialize with default symbols for new users
        await initializeDefaults();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const initializeDefaults = async () => {
    if (!user) return;

    try {
      const symbolsToInsert = DEFAULT_SYMBOLS.map(s => ({
        ...s,
        user_id: user.id,
      }));

      const { data, error: insertError } = await supabase
        .from('ticker_symbols')
        .insert(symbolsToInsert)
        .select();

      if (insertError) throw insertError;
      if (data) setSymbols(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addSymbol = async (symbol: Omit<TickerSymbol, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('ticker_symbols')
        .insert({ ...symbol, user_id: user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        setSymbols(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
        return data;
      }
    } catch (err: any) {
      setError(err.message);
    }
    return null;
  };

  const updateSymbol = async (id: string, updates: Partial<TickerSymbol>) => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('ticker_symbols')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      
      setSymbols(prev => 
        prev.map(s => s.id === id ? { ...s, ...updates } : s)
          .sort((a, b) => a.order_index - b.order_index)
      );
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteSymbol = async (id: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('ticker_symbols')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      
      setSymbols(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const reorderSymbols = async (reorderedSymbols: TickerSymbol[]) => {
    if (!user) return false;

    try {
      // Update order_index for all symbols
      const updates = reorderedSymbols.map((s, index) => ({
        id: s.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('ticker_symbols')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      setSymbols(reorderedSymbols.map((s, index) => ({ ...s, order_index: index })));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  const enabledSymbols = symbols.filter(s => s.enabled);

  return {
    symbols,
    enabledSymbols,
    isLoading,
    error,
    addSymbol,
    updateSymbol,
    deleteSymbol,
    reorderSymbols,
    refetch: fetchSymbols,
  };
}
