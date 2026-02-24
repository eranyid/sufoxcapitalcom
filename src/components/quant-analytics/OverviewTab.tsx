import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useOverviewStats } from "@/hooks/useQuantAnalytics";
import { TrendingUp, TrendingDown, BarChart3, Layers } from "lucide-react";

interface OverviewTabProps {
  from: string;
  to: string;
}

export function OverviewTab({ from, to }: OverviewTabProps) {
  const { overview, isLoading } = useOverviewStats(from, to);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!overview) {
    return <div className="text-center py-12 text-muted-foreground">No data available for this period</div>;
  }

  const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {/* Panel A: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase font-semibold">Universe Return</div>
            <div className={`text-2xl font-bold mt-1 ${overview.universeReturn >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {fmtPct(overview.universeReturn)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase font-semibold">Up / Down</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-2">
              <span className="text-emerald-500">{overview.upCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-red-500">{overview.downCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase font-semibold">Best Sector</div>
            <div className="text-lg font-bold mt-1 text-emerald-500">
              {overview.bestSector?.name} {overview.bestSector ? fmtPct(overview.bestSector.return) : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase font-semibold">Worst Sector</div>
            <div className="text-lg font-bold mt-1 text-red-500">
              {overview.worstSector?.name} {overview.worstSector ? fmtPct(overview.worstSector.return) : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel B: Sector Heatmap */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4" /> Sector Performance Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {overview.sectors?.map((sector: any) => {
              const ret = Number(sector.avg_cum_return);
              const intensity = Math.min(Math.abs(ret) / 0.1, 1);
              const bg = ret >= 0
                ? `rgba(16, 185, 129, ${0.1 + intensity * 0.5})`
                : `rgba(239, 68, 68, ${0.1 + intensity * 0.5})`;
              const mcap = Number(sector.total_market_cap || 0);
              const size = Math.max(80, Math.min(200, Math.sqrt(mcap / 1e9) * 2));
              return (
                <div
                  key={sector.sector}
                  className="rounded-lg border p-3 flex flex-col justify-between cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
                  style={{ backgroundColor: bg, minWidth: size, minHeight: 60 }}
                >
                  <span className="text-xs font-semibold">{sector.sector}</span>
                  <span className={`text-sm font-bold ${ret >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {fmtPct(ret)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{Number(sector.symbol_count)} stocks</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Panel C: Top 10 / Bottom 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Top 10 Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Sharpe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.top10.map((s: any, i: number) => (
                  <TableRow key={s.symbol}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                    <TableCell className="font-bold text-sm">{s.symbol}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{s.sector}</Badge></TableCell>
                    <TableCell className="text-emerald-500 font-mono text-sm">{fmtPct(Number(s.cum_return))}</TableCell>
                    <TableCell className="font-mono text-sm">{Number(s.sharpe || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Bottom 10 Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Sharpe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.bottom10.map((s: any, i: number) => (
                  <TableRow key={s.symbol}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                    <TableCell className="font-bold text-sm">{s.symbol}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{s.sector}</Badge></TableCell>
                    <TableCell className="text-red-500 font-mono text-sm">{fmtPct(Number(s.cum_return))}</TableCell>
                    <TableCell className="font-mono text-sm">{Number(s.sharpe || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Panel D: Market Breadth */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Market Breadth
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-muted/20 rounded-lg border">
              <div className="text-xs text-muted-foreground uppercase">% Symbols Up (Period)</div>
              <div className="text-xl font-bold">{overview.pctUp.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg border">
              <div className="text-xs text-muted-foreground uppercase">Avg Daily % Up</div>
              <div className="text-xl font-bold">{overview.avgDailyUp.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg border">
              <div className="text-xs text-muted-foreground uppercase">Max Single-Day Up</div>
              <div className="text-xl font-bold text-emerald-500">{overview.maxDayUp.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg border">
              <div className="text-xs text-muted-foreground uppercase">Min Single-Day Up</div>
              <div className="text-xl font-bold text-red-500">{overview.minDayUp.toFixed(1)}%</div>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.breadth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="trade_date" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "% Positive"]}
                />
                <Bar
                  dataKey="pct_positive"
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center italic">
        This analysis is for research purposes only. Not investment advice.
      </p>
    </div>
  );
}
