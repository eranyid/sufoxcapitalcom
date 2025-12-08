import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface WatchlistItem {
  id: string;
  symbol: string;
  display_name: string | null;
  asset_class: string | null;
  created_at: string;
}

export function useResearchWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('research_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addSymbol = async (symbol: string, displayName?: string, assetClass?: string) => {
    if (!user) return false;

    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol) return false;

    // Check if already exists
    if (items.some(item => item.symbol === normalizedSymbol)) {
      toast.error(`${normalizedSymbol} is already in your watchlist`);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('research_watchlist')
        .insert({
          user_id: user.id,
          symbol: normalizedSymbol,
          display_name: displayName?.trim() || null,
          asset_class: assetClass || 'equity'
        })
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data]);
      return true;
    } catch (error: any) {
      console.error('Failed to add symbol:', error);
      toast.error(error.message || 'Failed to add symbol');
      return false;
    }
  };

  const bulkAddSymbols = async (symbolsText: string) => {
    if (!user) return { added: 0, skipped: 0 };

    const symbols = symbolsText
      .split(/[,\n\s]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    const uniqueSymbols = [...new Set(symbols)];
    const existingSymbols = new Set(items.map(item => item.symbol));
    const newSymbols = uniqueSymbols.filter(s => !existingSymbols.has(s));

    if (newSymbols.length === 0) {
      return { added: 0, skipped: uniqueSymbols.length };
    }

    try {
      const insertData = newSymbols.map(symbol => ({
        user_id: user.id,
        symbol,
        display_name: null,
        asset_class: 'equity'
      }));

      const { data, error } = await supabase
        .from('research_watchlist')
        .insert(insertData)
        .select();

      if (error) throw error;
      setItems(prev => [...prev, ...(data || [])]);
      return { added: data?.length || 0, skipped: uniqueSymbols.length - newSymbols.length };
    } catch (error: any) {
      console.error('Failed to bulk add symbols:', error);
      toast.error(error.message || 'Failed to add symbols');
      return { added: 0, skipped: 0 };
    }
  };

  const removeSymbol = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('research_watchlist')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error: any) {
      console.error('Failed to remove symbol:', error);
      toast.error(error.message || 'Failed to remove symbol');
      return false;
    }
  };

  const clearAll = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('research_watchlist')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setItems([]);
      return true;
    } catch (error: any) {
      console.error('Failed to clear watchlist:', error);
      toast.error(error.message || 'Failed to clear watchlist');
      return false;
    }
  };

  // Get symbols as simple string array (for dropdowns)
  const symbols = items.map(item => item.symbol);

  return {
    items,
    symbols,
    isLoading,
    addSymbol,
    bulkAddSymbols,
    removeSymbol,
    clearAll,
    refresh: fetchWatchlist
  };
}
