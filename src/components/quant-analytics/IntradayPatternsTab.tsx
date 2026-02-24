import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useIntradayVolProfile, useIntradayWindowReturns, useIntradayMomentum, useMOCPressure } from "@/hooks/useQuantAnalytics";
import { Clock, Activity } from "lucide-react";

interface Props { from: string; to: string; }

export function IntradayPatternsTab({ from, to }: Props) {
  const { data: volProfile, isLoading: vpLoading } = useIntradayVolProfile(from, to);
  const { data: windowReturns, isLoading: wrLoading } = useIntradayWindowReturns(from, to);
  const { data: momentum, isLoading: momLoading } = useIntradayMomentum(from, to);
  const { data: moc, isLoading: mocLoading } = useMOCPressure(from, to);

  return (
    <div className="space-y-6">
      {/* Intraday Volatility Profile */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4" /> Intraday Volatility Profile (13:00–16:00 ET)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {vpLoading ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : volProfile && volProfile.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volProfile}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="minute_slot" tick={{ fontSize: 8 }} interval={9} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(Number(v) * 10000).toFixed(1)}bp`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: any) => [`${(Number(v) * 10000).toFixed(2)} bps`, "Avg |Return|"]} />
                  <Line type="monotone" dataKey="avg_abs_return" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No intraday data available</div>
          )}
        </CardContent>
      </Card>

      {/* Closing Hour Momentum */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">Closing Hour Momentum</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {momLoading ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : momentum ? (
            <>
              <div className="text-center mb-3">
                <span className="text-sm text-muted-foreground">Pearson Correlation (1st hour → 3rd hour):</span>
                <span className={`text-xl font-bold ml-2 ${momentum.correlation > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {Number(momentum.correlation).toFixed(3)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {momentum.correlation > 0.05 ? "Positive → Closing momentum trend" : momentum.correlation < -0.05 ? "Negative → Mean reversion tendency" : "Near zero → No clear pattern"}
                </p>
              </div>
              {momentum.dataPoints?.length > 0 && (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" dataKey="firstHour" name="1st Hour" tick={{ fontSize: 9 }} tickFormatter={v => `${(v * 100).toFixed(1)}%`}
                        label={{ value: "1st Hour Return", position: "bottom", fontSize: 10 }} />
                      <YAxis type="number" dataKey="lastHour" name="3rd Hour" tick={{ fontSize: 9 }} tickFormatter={v => `${(v * 100).toFixed(1)}%`}
                        label={{ value: "3rd Hour Return", angle: -90, position: "left", fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => [`${(Number(v) * 100).toFixed(3)}%`]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Scatter data={momentum.dataPoints.slice(0, 200)} fill="hsl(var(--primary))" opacity={0.3} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Best/Worst Time Windows */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" /> 30-Min Window Returns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {wrLoading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : windowReturns && windowReturns.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={windowReturns}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="window_label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(Number(v) * 10000).toFixed(1)}bp`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: any) => [`${(Number(v) * 10000).toFixed(2)} bps`, "Avg Return"]} />
                  <Bar dataKey="avg_return" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* MOC Pressure */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider">MOC Pressure (15:45–16:00)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[400px] overflow-auto">
          {mocLoading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : moc?.symbols?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Late Vol</TableHead>
                  <TableHead>Early Vol</TableHead>
                  <TableHead>Vol Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moc.symbols.slice(0, 30).map((s: any) => (
                  <TableRow key={s.symbol}>
                    <TableCell className="font-bold text-sm">{s.symbol}</TableCell>
                    <TableCell className="font-mono text-xs">{(s.lateVol * 10000).toFixed(2)} bp</TableCell>
                    <TableCell className="font-mono text-xs">{(s.earlyVol * 10000).toFixed(2)} bp</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{s.volRatio.toFixed(2)}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center italic">This analysis is for research purposes only. Not investment advice.</p>
    </div>
  );
}
