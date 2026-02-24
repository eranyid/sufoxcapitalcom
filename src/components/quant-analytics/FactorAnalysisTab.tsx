import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuantUniverseSymbols, useFactorRegression } from "@/hooks/useQuantAnalytics";
import { InsufficientDataBadge } from "./InsufficientDataBadge";
import { AlertTriangle, Info } from "lucide-react";

interface Props { from: string; to: string; }

export function FactorAnalysisTab({ from, to }: Props) {
  const { data: universe } = useQuantUniverseSymbols();
  const [symbol, setSymbol] = useState("");
  const sel = symbol || universe?.[0]?.symbol || "";
  const { data: regression, isLoading } = useFactorRegression(sel, from, to);

  return (
    <div className="space-y-6">
      <Select value={sel} onValueChange={setSymbol}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select symbol..." />
        </SelectTrigger>
        <SelectContent>
          {universe?.map((u: any) => (
            <SelectItem key={u.symbol} value={u.symbol}>{u.symbol} — {u.company_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {regression?.error === "insufficient_data" ? (
        <InsufficientDataBadge minDays={30} />
      ) : isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted/30 rounded animate-pulse" />)}</div>
      ) : regression ? (
        <>
          {/* Model Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-muted-foreground uppercase">R²</div>
              <div className="text-xl font-bold font-mono">{(regression.r2 * 100).toFixed(1)}%</div>
            </CardContent></Card>
            <Card><CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-muted-foreground uppercase">Adj R²</div>
              <div className="text-xl font-bold font-mono">{(regression.adjR2 * 100).toFixed(1)}%</div>
            </CardContent></Card>
            <Card><CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-muted-foreground uppercase">Alpha (Ann.)</div>
              <div className={`text-xl font-bold font-mono ${regression.alpha >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {(regression.alpha * 100).toFixed(2)}%
              </div>
            </CardContent></Card>
            <Card><CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-muted-foreground uppercase">Observations</div>
              <div className="text-xl font-bold font-mono">{regression.n}</div>
            </CardContent></Card>
          </div>

          <p className="text-xs text-muted-foreground">
            <Info className="h-3 w-3 inline mr-1" />
            {(regression.r2 * 100).toFixed(0)}% of this stock's return variance is explained by the selected factors.
          </p>

          {/* Factor Table */}
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-medium uppercase tracking-wider">Factor Loadings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    <TableHead>Beta</TableHead>
                    <TableHead>Std Error</TableHead>
                    <TableHead>T-Stat</TableHead>
                    <TableHead>Significant?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regression.factors?.map((f: any) => (
                    <TableRow key={f.name}>
                      <TableCell className="font-medium text-sm">{f.name}</TableCell>
                      <TableCell className="font-mono text-sm">{Number(f.beta).toFixed(4)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{Number(f.stdError).toFixed(4)}</TableCell>
                      <TableCell className="font-mono text-xs">{Number(f.tStat).toFixed(2)}</TableCell>
                      <TableCell>
                        {f.significant
                          ? <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Yes</Badge>
                          : <Badge variant="outline" className="text-muted-foreground">No</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                  {regression.externalFactors?.map((f: any) => (
                    <TableRow key={f.name} className="opacity-50">
                      <TableCell className="font-medium text-sm">{f.name}</TableCell>
                      <TableCell colSpan={4}>
                        <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500/30">
                          <AlertTriangle className="h-3 w-3" /> Requires external data feed — not yet connected
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}

      <p className="text-xs text-muted-foreground text-center italic">This analysis is for research purposes only. Not investment advice.</p>
    </div>
  );
}
