import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

// =====================================================
// RPC hooks (SQL-based, fast)
// =====================================================

export function useSymbolStats(from: string, to: string, symbols?: string[]) {
  return useQuery({
    queryKey: ["quant_symbol_stats", from, to, symbols],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_symbol_stats" as any, {
        p_from: from,
        p_to: to,
        p_symbols: symbols || null,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSectorReturns(from: string, to: string) {
  return useQuery({
    queryKey: ["quant_sector_returns", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_sector_returns" as any, {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketBreadth(from: string, to: string) {
  return useQuery({
    queryKey: ["quant_market_breadth", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_market_breadth" as any, {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyReturns(from: string, to: string, symbols?: string[]) {
  return useQuery({
    queryKey: ["quant_daily_returns", from, to, symbols],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_daily_returns" as any, {
        p_from: from,
        p_to: to,
        p_symbols: symbols || null,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUniverseReturns(from: string, to: string) {
  return useQuery({
    queryKey: ["quant_universe_returns", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_universe_returns" as any, {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMomentumRanking(to: string) {
  return useQuery({
    queryKey: ["quant_momentum_ranking", to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_momentum_ranking" as any, {
        p_to: to,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function useIntradayVolProfile(from: string, to: string) {
  return useQuery({
    queryKey: ["quant_intraday_vol_profile", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_intraday_vol_profile" as any, {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function useIntradayWindowReturns(from: string, to: string) {
  return useQuery({
    queryKey: ["quant_intraday_window_returns", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quant_intraday_window_returns" as any, {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

// =====================================================
// Edge Function hooks (heavy computation)
// =====================================================

async function callEdgeFunction(action: string, params: any) {
  const { data, error } = await supabase.functions.invoke("quant-analytics", {
    body: { action, params },
  });
  if (error) throw error;
  return data;
}

export function useRollingMetrics(symbol: string, from: string, to: string) {
  return useQuery({
    queryKey: ["quant_rolling_metrics", symbol, from, to],
    queryFn: () => callEdgeFunction("rolling_metrics", { symbol, from, to }),
    enabled: !!symbol && !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEWMAVolatility(symbol: string, from: string, to: string) {
  return useQuery({
    queryKey: ["quant_ewma", symbol, from, to],
    queryFn: () => callEdgeFunction("ewma_volatility", { symbol, from, to }),
    enabled: !!symbol && !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFactorRegression(symbol: string, from: string, to: string) {
  return useQuery({
    queryKey: ["quant_factor_regression", symbol, from, to],
    queryFn: () => callEdgeFunction("factor_regression", { symbol, from, to }),
    enabled: !!symbol && !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCorrelationMatrix(symbols: string[], from: string, to: string) {
  return useQuery({
    queryKey: ["quant_correlation_matrix", symbols, from, to],
    queryFn: () => callEdgeFunction("correlation_matrix", { symbols, from, to }),
    enabled: symbols.length >= 2 && !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePairAnalysis(symbolA: string, symbolB: string, from: string, to: string) {
  return useQuery({
    queryKey: ["quant_pair_analysis", symbolA, symbolB, from, to],
    queryFn: () => callEdgeFunction("pair_analysis", { symbolA, symbolB, from, to }),
    enabled: !!symbolA && !!symbolB && !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCointegrationScreen(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ["quant_cointegration_screen", from, to],
    queryFn: () => callEdgeFunction("cointegration_screen", { from, to }),
    enabled: enabled && !!from && !!to,
    staleTime: 30 * 60 * 1000,
  });
}

export function useIntradayMomentum(from: string, to: string) {
  return useQuery({
    queryKey: ["quant_intraday_momentum", from, to],
    queryFn: () => callEdgeFunction("intraday_momentum", { from, to }),
    enabled: !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMOCPressure(from: string, to: string) {
  return useQuery({
    queryKey: ["quant_moc_pressure", from, to],
    queryFn: () => callEdgeFunction("moc_pressure", { from, to }),
    enabled: !!from && !!to,
    staleTime: 10 * 60 * 1000,
  });
}

// =====================================================
// Universe symbol list
// =====================================================
export function useQuantUniverseSymbols() {
  return useQuery({
    queryKey: ["quant_universe_symbols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quant_universe" as any)
        .select("symbol, company_name, sector, market_cap, market_cap_rank")
        .eq("is_active", true)
        .order("market_cap_rank", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    staleTime: 60 * 60 * 1000,
  });
}

// =====================================================
// Computed helpers
// =====================================================
export function useOverviewStats(from: string, to: string) {
  const { data: stats, isLoading: statsLoading } = useSymbolStats(from, to);
  const { data: sectors, isLoading: sectorsLoading } = useSectorReturns(from, to);
  const { data: breadth, isLoading: breadthLoading } = useMarketBreadth(from, to);

  const overview = useMemo(() => {
    if (!stats || !sectors || !breadth) return null;

    const cumReturns = stats.map((s: any) => Number(s.cum_return || 0));
    const avgReturn = cumReturns.length > 0 ? cumReturns.reduce((a: number, b: number) => a + b, 0) / cumReturns.length : 0;
    const upCount = cumReturns.filter((r: number) => r > 0).length;
    const downCount = cumReturns.filter((r: number) => r <= 0).length;

    const bestSector = sectors[0];
    const worstSector = sectors[sectors.length - 1];

    const breadthPcts = breadth.map((b: any) => Number(b.pct_positive));
    const avgDailyUp = breadthPcts.length > 0 ? breadthPcts.reduce((a: number, b: number) => a + b, 0) / breadthPcts.length : 0;
    const maxDayUp = breadthPcts.length > 0 ? Math.max(...breadthPcts) : 0;
    const minDayUp = breadthPcts.length > 0 ? Math.min(...breadthPcts) : 0;

    const top10 = [...stats].sort((a: any, b: any) => Number(b.cum_return || 0) - Number(a.cum_return || 0)).slice(0, 10);
    const bottom10 = [...stats].sort((a: any, b: any) => Number(a.cum_return || 0) - Number(b.cum_return || 0)).slice(0, 10);

    return {
      universeReturn: avgReturn,
      upCount,
      downCount,
      bestSector: bestSector ? { name: bestSector.sector, return: Number(bestSector.avg_cum_return) } : null,
      worstSector: worstSector ? { name: worstSector.sector, return: Number(worstSector.avg_cum_return) } : null,
      avgDailyUp,
      maxDayUp,
      minDayUp,
      pctUp: cumReturns.length > 0 ? (upCount / cumReturns.length) * 100 : 0,
      top10,
      bottom10,
      sectors,
      breadth,
    };
  }, [stats, sectors, breadth]);

  return { overview, isLoading: statsLoading || sectorsLoading || breadthLoading };
}
