import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ReferenceArea } from "recharts";
import { useQuantUniverseSymbols, usePairAnalysis, useCointegrationScreen } from "@/hooks/useQuantAnalytics";
import { InsufficientDataBadge } from "./InsufficientDataBadge";
import { AlertTriangle, Zap } from "lucide-react";

interface Props { from: string; to: string; }

export function PairsSpreadsTab({ from, to }: Props) {
  const { data: universe } = useQuantUniverseSymbols();
  const [symbolA, setSymbolA] = useState("");
  const [symbolB, setSymbolB] = useState("");
  const [screenEnabled, setScreenEnabled] = useState(false);

  const selA = symbolA || universe?.[0]?.symbol || "";
  const selB = symbolB || universe?.[1]?.symbol || "";

  const { data: pair, isLoading: pairLoading } = usePairAnalysis(selA, selB, from, to);
  const { data: screen, isLoading: screenLoading } = useCointegrationScreen(from, to, screenEnabled);

  const fmtNum = (v: any, d = 4) => v != null ? Number(v).toFixed(d) : "—";

  return (
    <div className="space-y-6">
      {/* Pair Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Symbol A:</span>
          <Select value={selA} onValueChange={setSymbolA}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {universe?.map((u: any) => <SelectItem key={u.symbol} value={u.symbol}>{u.symbol}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Symbol B:</span>
          <Select value={selB} onValueChange={setSymbolB}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {universe?.map((u: any) => <SelectItem key={u.symbol} value={u.symbol}>{u.symbol}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setScreenEnabled(true)} disabled={screenLoading}>
          <Zap className="h-3 w-3" /> {screenLoading ? "Screening..." : "Run Cointegration Screen"}
        </Button>
      </div>

      {/* Cointegration Screen Results */}
      {screen?.pairs?.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Top Correlated Pairs</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Correlation</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screen.pairs.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{p.symbolA} / {p.symbolB}</TableCell>
                    <TableCell className="font-mono text-sm">{Number(p.correlation).toFixed(4)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { setSymbolA(p.symbolA); setSymbolB(p.symbolB); }}>
                        Analyze
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pair Statistics */}
      {pair?.error === "insufficient_data" ? (
        <InsufficientDataBadge minDays={60} />
      ) : pairLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted/30 rounded animate-pulse" />)}</div>
      ) : pair ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Pearson ρ", value: fmtNum(pair.pearson) },
              { label: "Spearman ρ", value: fmtNum(pair.spearman) },
              { label: "Hedge Ratio (β)", value: fmtNum(pair.hedgeRatio, 3) },
              { label: "Spread Mean", value: fmtNum(pair.spreadMean, 2) },
              { label: "Spread Std", value: fmtNum(pair.spreadStd, 2) },
              { label: "ADF Statistic", value: fmtNum(pair.adfStat, 3) },
              { label: "ADF p-value", value: fmtNum(pair.adfPValue, 3) },
              { label: "Half-Life", value: pair.halfLife ? `${fmtNum(pair.halfLife, 1)} days` : "—" },
            ].map(m => (
              <Card key={m.label}>
                <CardContent className="pt-3 pb-2 px-3">
                  <div className="text-[10px] text-muted-foreground uppercase">{m.label}</div>
                  <div className="text-lg font-bold font-mono">{m.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pair.adfPValue <= 0.05 && (
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
              ✓ Spread is stationary (p={fmtNum(pair.adfPValue, 3)}) — Pair is cointegrated
            </Badge>
          )}

          {/* Z-Score Chart */}
          {pair.zScores?.length > 0 && (
            <Card>
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Spread Z-Score</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pair.zScores}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 9 }} domain={[-3, 3]} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <ReferenceLine y={2} stroke="red" strokeDasharray="3 3" label={{ value: "+2σ", fontSize: 9 }} />
                      <ReferenceLine y={-2} stroke="red" strokeDasharray="3 3" label={{ value: "-2σ", fontSize: 9 }} />
                      <ReferenceLine y={1} stroke="orange" strokeDasharray="5 5" opacity={0.4} />
                      <ReferenceLine y={-1} stroke="orange" strokeDasharray="5 5" opacity={0.4} />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                      <Line type="monotone" dataKey="zScore" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signal Log */}
          {pair.signals?.length > 0 && (
            <Card>
              <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Signal Log</CardTitle>
                <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500/30">
                  <AlertTriangle className="h-3 w-3" /> Research only
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Z-Score</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pair.signals.map((s: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{s.date}</TableCell>
                        <TableCell>
                          <Badge variant={s.event.includes("Entry") ? "default" : "outline"} className={s.event.includes("Entry") ? "bg-primary" : ""}>
                            {s.event}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{s.zScore}</TableCell>
                        <TableCell className="text-xs">{s.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <p className="text-xs text-muted-foreground text-center italic">
        Signal research output. Not investment advice. This analysis is for research purposes only.
      </p>
    </div>
  );
}
