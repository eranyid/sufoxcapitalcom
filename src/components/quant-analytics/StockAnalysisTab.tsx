import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, ReferenceLine } from "recharts";
import { useQuantUniverseSymbols, useSymbolStats, useDailyReturns, useUniverseReturns, useRollingMetrics, useEWMAVolatility } from "@/hooks/useQuantAnalytics";
import { InsufficientDataBadge } from "./InsufficientDataBadge";
import { differenceInDays } from "date-fns";

interface StockAnalysisTabProps { from: string; to: string; }

export function StockAnalysisTab({ from, to }: StockAnalysisTabProps) {
  const { data: universe } = useQuantUniverseSymbols();
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const symbol = selectedSymbol || universe?.[0]?.symbol || "";

  const { data: stats } = useSymbolStats(from, to, symbol ? [symbol] : undefined);
  const { data: symbolReturns } = useDailyReturns(from, to, symbol ? [symbol] : undefined);
  const { data: universeReturns } = useUniverseReturns(from, to);
  const { data: rolling, isLoading: rollingLoading } = useRollingMetrics(symbol, from, to);
  const { data: ewma, isLoading: ewmaLoading } = useEWMAVolatility(symbol, from, to);

  const tradingDays = stats?.[0]?.trading_days || 0;
  const periodDays = differenceInDays(new Date(to), new Date(from));

  const s = stats?.[0];
  const fmtPct = (v: any) => v != null ? `${Number(v) >= 0 ? "+" : ""}${(Number(v) * 100).toFixed(2)}%` : "—";
  const fmtNum = (v: any, d = 2) => v != null ? Number(v).toFixed(d) : "—";

  // Cumulative return chart
  const cumChart = useMemo(() => {
    if (!symbolReturns || !universeReturns) return [];
    const symRets = symbolReturns.filter((r: any) => r.daily_return !== null);
    const mktMap = new Map(universeReturns.map((m: any) => [m.trade_date, Number(m.market_return)]));
    let cumSym = 0, cumMkt = 0;
    return symRets.map((r: any) => {
      cumSym = (1 + cumSym) * (1 + Number(r.daily_return)) - 1;
      const mktRet = mktMap.get(r.trade_date) || 0;
      cumMkt = (1 + cumMkt) * (1 + mktRet) - 1;
      return { date: r.trade_date, symbol: cumSym * 100, universe: cumMkt * 100 };
    });
  }, [symbolReturns, universeReturns]);

  // Return distribution
  const distribution = useMemo(() => {
    if (!symbolReturns) return [];
    const rets = symbolReturns.filter((r: any) => r.daily_return !== null).map((r: any) => Number(r.daily_return) * 100);
    if (rets.length === 0) return [];
    const min = Math.floor(Math.min(...rets) * 4) / 4;
    const max = Math.ceil(Math.max(...rets) * 4) / 4;
    const bins: { bin: string; count: number; center: number }[] = [];
    for (let b = min; b < max; b += 0.5) {
      const count = rets.filter(r => r >= b && r < b + 0.5).length;
      bins.push({ bin: `${b.toFixed(1)}`, count, center: b + 0.25 });
    }
    return bins;
  }, [symbolReturns]);

  const metrics = [
    { label: "Cum Return", value: fmtPct(s?.cum_return) },
    { label: "Ann Return", value: fmtPct(s?.ann_return) },
    { label: "Ann Vol", value: fmtPct(s?.ann_vol) },
    { label: "Sharpe", value: fmtNum(s?.sharpe) },
    { label: "Sortino", value: fmtNum(s?.sortino) },
    { label: "VaR 95%", value: fmtPct(s?.var_95) },
    { label: "CVaR 95%", value: fmtPct(s?.cvar_95) },
    { label: "Trading Days", value: String(tradingDays) },
  ];

  return (
    <div className="space-y-6">
      {/* Symbol Selector */}
      <Select value={symbol} onValueChange={setSelectedSymbol}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select symbol..." />
        </SelectTrigger>
        <SelectContent>
          {universe?.map((u: any) => (
            <SelectItem key={u.symbol} value={u.symbol}>
              {u.symbol} — {u.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-muted-foreground uppercase">{m.label}</div>
              <div className="text-lg font-bold font-mono">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cumulative Return Chart */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Cumulative Return</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: any) => [`${Number(v).toFixed(2)}%`]} />
                <Line type="monotone" dataKey="symbol" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} name={symbol} />
                <Line type="monotone" dataKey="universe" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1} strokeDasharray="5 5" name="Universe" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rolling Metrics */}
      <Card>
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Rolling 20-Day Metrics</CardTitle>
          {tradingDays < 30 && <InsufficientDataBadge minDays={30} actualDays={tradingDays} />}
        </CardHeader>
        <CardContent className="p-4">
          {tradingDays >= 30 && rolling ? (
            <div className="space-y-4">
              {[
                { data: rolling.rollingVol, label: "Annualized Volatility", color: "hsl(var(--primary))" },
                { data: rolling.rollingSharpe, label: "Sharpe Ratio", color: "hsl(var(--chart-2))" },
                { data: rolling.rollingBeta, label: "Beta", color: "hsl(var(--chart-3))" },
              ].map(chart => (
                <div key={chart.label}>
                  <div className="text-xs text-muted-foreground mb-1">{chart.label}</div>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                        <Line type="monotone" dataKey="value" stroke={chart.color} dot={false} strokeWidth={1.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          ) : tradingDays < 30 ? null : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading...</div>
          )}
        </CardContent>
      </Card>

      {/* Return Distribution */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Return Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="bin" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <ReferenceLine x="0" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* EWMA Volatility */}
      <Card>
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">EWMA Volatility (λ=0.94)</CardTitle>
          {tradingDays < 30 && <InsufficientDataBadge minDays={30} actualDays={tradingDays} />}
        </CardHeader>
        <CardContent className="p-4">
          {tradingDays >= 30 && ewma?.ewma?.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ewma.ewma.map((e: any, i: number) => ({ ...e, realized: ewma.realized[i]?.value }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} name="EWMA" />
                  <Line type="monotone" dataKey="realized" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1} strokeDasharray="5 5" name="Realized" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center italic">This analysis is for research purposes only. Not investment advice.</p>
    </div>
  );
}
