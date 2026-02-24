import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMomentumRanking, useSymbolStats } from "@/hooks/useQuantAnalytics";
import { Download, Search } from "lucide-react";

interface Props { from: string; to: string; }

export function CrossSectionalTab({ from, to }: Props) {
  const { data: momentum, isLoading } = useMomentumRanking(to);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");

  const sectors = useMemo(() => {
    if (!momentum) return [];
    return [...new Set(momentum.map((m: any) => m.sector).filter(Boolean))].sort();
  }, [momentum]);

  const filtered = useMemo(() => {
    return momentum?.filter((m: any) => {
      const matchSearch = !search || m.symbol?.toLowerCase().includes(search.toLowerCase()) || m.company_name?.toLowerCase().includes(search.toLowerCase());
      const matchSector = sectorFilter === "all" || m.sector === sectorFilter;
      return matchSearch && matchSector;
    });
  }, [momentum, search, sectorFilter]);

  const fmtPct = (v: any) => v != null ? `${(Number(v) * 100).toFixed(2)}%` : "—";

  // Relative Strength top/bottom 20
  const rsData = useMemo(() => {
    if (!momentum || momentum.length === 0) return [];
    const avgRet = momentum.reduce((a: number, m: any) => a + Number(m.return_1m || 0), 0) / momentum.length;
    if (avgRet === 0) return [];
    const rs = momentum.map((m: any) => ({
      symbol: m.symbol,
      rs: avgRet !== 0 ? Number(m.return_1m || 0) / avgRet : 1,
    })).sort((a: any, b: any) => b.rs - a.rs);
    return [...rs.slice(0, 10), ...rs.slice(-10)];
  }, [momentum]);

  const handleExport = () => {
    if (!filtered) return;
    const headers = ["Rank", "Symbol", "Company", "Sector", "5D", "1M", "3M", "Score"];
    const rows = filtered.map((m: any) => [m.market_cap_rank, m.symbol, m.company_name, m.sector, fmtPct(m.return_5d), fmtPct(m.return_1m), fmtPct(m.return_3m), m.momentum_score].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `momentum_ranking_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search symbol..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Sectors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 ml-auto">
          <Download className="h-3 w-3" /> CSV
        </Button>
      </div>

      {/* Momentum Ranking Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Momentum Ranking</CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card z-10 w-[60px]">Rank</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Symbol</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Company</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Sector</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">5D</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">1M</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">3M</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><div className="h-4 bg-muted/30 rounded animate-pulse" /></TableCell></TableRow>)
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No results</TableCell></TableRow>
              ) : (
                filtered?.map((m: any) => (
                  <TableRow key={m.symbol}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.market_cap_rank}</TableCell>
                    <TableCell className="font-bold text-sm">{m.symbol}</TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">{m.company_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.sector}</Badge></TableCell>
                    <TableCell className={`font-mono text-xs ${Number(m.return_5d) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmtPct(m.return_5d)}</TableCell>
                    <TableCell className={`font-mono text-xs ${Number(m.return_1m) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmtPct(m.return_1m)}</TableCell>
                    <TableCell className={`font-mono text-xs ${Number(m.return_3m) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmtPct(m.return_3m)}</TableCell>
                    <TableCell>
                      <Badge variant={Number(m.momentum_score) > 70 ? "default" : "outline"} className={Number(m.momentum_score) > 70 ? "bg-emerald-500" : ""}>
                        {Number(m.momentum_score).toFixed(0)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Relative Strength */}
      {rsData.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Relative Strength (Top/Bottom 10)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="symbol" width={60} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="rs" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center italic">This analysis is for research purposes only. Not investment advice.</p>
    </div>
  );
}
