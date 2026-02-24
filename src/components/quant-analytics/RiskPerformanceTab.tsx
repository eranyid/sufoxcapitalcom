import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScatterChart, Scatter, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ZAxis, LineChart, Line } from "recharts";
import { useQuantUniverseSymbols, useSymbolStats, useCorrelationMatrix, useDailyReturns } from "@/hooks/useQuantAnalytics";
import { InsufficientDataBadge } from "./InsufficientDataBadge";
import { Download } from "lucide-react";

interface Props { from: string; to: string; }

export function RiskPerformanceTab({ from, to }: Props) {
  const { data: universe } = useQuantUniverseSymbols();
  const [preset, setPreset] = useState<"top20" | "top50">("top20");
  const selectedSymbols = useMemo(() => {
    if (!universe) return [];
    const n = preset === "top20" ? 20 : 50;
    return universe.slice(0, n).map((u: any) => u.symbol);
  }, [universe, preset]);

  const { data: stats, isLoading } = useSymbolStats(from, to, selectedSymbols.length > 0 ? selectedSymbols : undefined);
  const { data: corrData } = useCorrelationMatrix(selectedSymbols.slice(0, 15), from, to);

  const fmtPct = (v: any) => v != null ? `${(Number(v) * 100).toFixed(2)}%` : "—";
  const fmtNum = (v: any) => v != null ? Number(v).toFixed(2) : "—";

  // Scatter data
  const scatterData = useMemo(() => {
    if (!stats) return [];
    return stats.map((s: any) => ({
      x: Number(s.ann_vol || 0) * 100,
      y: Number(s.ann_return || 0) * 100,
      symbol: s.symbol,
      sector: s.sector,
      mcap: Number(s.market_cap || 0),
      sharpe: Number(s.sharpe || 0),
    }));
  }, [stats]);

  // CSV Export
  const handleExport = () => {
    if (!stats) return;
    const headers = ["Symbol", "Company", "Sector", "Cum Return", "Ann Return", "Ann Vol", "Sharpe", "Sortino", "VaR 95%", "CVaR 95%"];
    const rows = stats.map((s: any) => [s.symbol, s.company_name, s.sector, fmtPct(s.cum_return), fmtPct(s.ann_return), fmtPct(s.ann_vol), fmtNum(s.sharpe), fmtNum(s.sortino), fmtPct(s.var_95), fmtPct(s.cvar_95)].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `risk_metrics_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Symbol Presets */}
      <div className="flex items-center gap-2">
        {(["top20", "top50"] as const).map(p => (
          <Button key={p} variant={preset === p ? "default" : "outline"} size="sm" onClick={() => setPreset(p)}>
            {p === "top20" ? "Top 20" : "Top 50"}
          </Button>
        ))}
      </div>

      {/* Scatter Plot */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Risk / Return Scatter</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" dataKey="x" name="Volatility" unit="%" tick={{ fontSize: 10 }} label={{ value: "Ann. Volatility (%)", position: "bottom", fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Return" unit="%" tick={{ fontSize: 10 }} label={{ value: "Ann. Return (%)", angle: -90, position: "left", fontSize: 11 }} />
                <ZAxis type="number" dataKey="mcap" range={[20, 200]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(v: any, name: string) => [`${Number(v).toFixed(2)}%`, name]}
                  labelFormatter={() => ""}
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border rounded-lg p-2 text-xs shadow-lg">
                        <div className="font-bold">{d.symbol}</div>
                        <div>Return: {d.y.toFixed(2)}%</div>
                        <div>Vol: {d.x.toFixed(2)}%</div>
                        <div>Sharpe: {d.sharpe.toFixed(2)}</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData} fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Risk Metrics</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="h-3 w-3" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0 max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card z-10">Symbol</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Sector</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Cum Ret</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Ann Ret</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Ann Vol</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Sharpe</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Sortino</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">VaR 95%</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">CVaR 95%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={9}><div className="h-4 bg-muted/30 rounded animate-pulse" /></TableCell></TableRow>
                ))
              ) : (
                stats?.map((s: any) => (
                  <TableRow key={s.symbol}>
                    <TableCell className="font-bold text-sm">{s.symbol}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{s.sector}</Badge></TableCell>
                    <TableCell className={`font-mono text-xs ${Number(s.cum_return) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmtPct(s.cum_return)}</TableCell>
                    <TableCell className="font-mono text-xs">{fmtPct(s.ann_return)}</TableCell>
                    <TableCell className="font-mono text-xs">{fmtPct(s.ann_vol)}</TableCell>
                    <TableCell className="font-mono text-xs">{fmtNum(s.sharpe)}</TableCell>
                    <TableCell className="font-mono text-xs">{fmtNum(s.sortino)}</TableCell>
                    <TableCell className="font-mono text-xs text-red-400">{fmtPct(s.var_95)}</TableCell>
                    <TableCell className="font-mono text-xs text-red-400">{fmtPct(s.cvar_95)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Correlation Matrix (simplified) */}
      {corrData?.matrix && (
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `80px repeat(${corrData.symbols?.length || 0}, 50px)` }}>
              <div />
              {corrData.symbols?.map((s: string) => (
                <div key={s} className="text-[9px] font-mono text-center truncate">{s}</div>
              ))}
              {corrData.symbols?.map((rowSym: string) => (
                <>
                  <div key={`label-${rowSym}`} className="text-[9px] font-mono text-right pr-1 flex items-center justify-end">{rowSym}</div>
                  {corrData.symbols?.map((colSym: string) => {
                    const entry = corrData.matrix.find((m: any) => m.symbolA === rowSym && m.symbolB === colSym);
                    const corr = entry?.correlation || 0;
                    const intensity = Math.abs(corr);
                    const bg = corr >= 0
                      ? `rgba(59, 130, 246, ${intensity * 0.6})`
                      : `rgba(239, 68, 68, ${intensity * 0.6})`;
                    return (
                      <div key={`${rowSym}-${colSym}`} className="w-[50px] h-[22px] flex items-center justify-center text-[8px] font-mono rounded-sm" style={{ backgroundColor: bg }} title={`${rowSym} × ${colSym}: ${corr.toFixed(3)}`}>
                        {corr.toFixed(2)}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center italic">This analysis is for research purposes only. Not investment advice.</p>
    </div>
  );
}
