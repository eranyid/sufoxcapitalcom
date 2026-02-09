import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TickerLink } from '@/components/TickerLink';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, Percent, TrendingUp, Newspaper, ExternalLink, Clock, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EtfData {
  asset_type: 'etf';
  name: string;
  ticker: string;
  current_price: number | null;
  aum: number | null;
  expense_ratio: number | null;
  inception_date: string | null;
  description: string | null;
  nav: number | null;
  holdings: Array<{ symbol: string; name: string; share: number; percent: number }>;
  sector_exposure: Array<{ sector: string; percentage: number }>;
  country_exposure: Array<{ country: string; percentage: number }>;
  news: Array<{
    headline: string; summary: string; source: string; url: string;
    datetime: number | null; related: string; image: string; category: string;
  }>;
}

function fmtAum(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

function fmt(n: number | null | undefined, decimals = 2, suffix = ''): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
}

export function EtfView({ data }: { data: EtfData }) {
  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'AUM', value: fmtAum(data.aum), icon: DollarSign },
          { label: 'Expense Ratio', value: data.expense_ratio != null ? `${data.expense_ratio.toFixed(2)}%` : '—', icon: Percent },
          { label: 'Inception', value: data.inception_date || '—', icon: Calendar },
          { label: 'NAV', value: data.nav != null ? `$${fmt(data.nav)}` : '—', icon: TrendingUp },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <k.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
            </div>
            <span className="text-lg font-bold font-mono text-foreground">{k.value}</span>
          </div>
        ))}
      </div>

      {data.description && (
        <p className="text-xs text-muted-foreground leading-relaxed bg-card border border-border rounded-lg p-3">{data.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Holdings */}
        {data.holdings.length > 0 && (
          <Card className="bg-card/50 border-border lg:row-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Top Holdings
                <Badge variant="secondary" className="text-[10px] ml-auto">{data.holdings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Symbol</TableHead>
                      <TableHead className="text-[10px]">Name</TableHead>
                      <TableHead className="text-[10px] text-right">Weight %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.holdings.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs py-1.5">
                          {h.symbol ? <TickerLink ticker={h.symbol} className="text-primary font-mono text-xs">{h.symbol}</TickerLink> : '—'}
                        </TableCell>
                        <TableCell className="text-xs py-1.5 max-w-[180px] truncate">{h.name || '—'}</TableCell>
                        <TableCell className="text-xs py-1.5 text-right font-mono">{fmt(h.percent, 2, '%')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sector Exposure */}
        {data.sector_exposure.length > 0 && (
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sector Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(200, data.sector_exposure.length * 28)}>
                <BarChart data={data.sector_exposure} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, 'Weight']}
                  />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Country Exposure */}
        {data.country_exposure.length > 0 && (
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Country Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(200, data.country_exposure.length * 28)}>
                <BarChart data={data.country_exposure} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, 'Weight']}
                  />
                  <Bar dataKey="percentage" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* News */}
      {data.news && data.news.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              News
              <Badge variant="secondary" className="text-[10px] ml-auto">{data.news.length} articles</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {data.news.map((item, i) => (
                <a
                  key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                >
                  {item.image && (
                    <img src={item.image} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0 bg-muted"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">{item.headline}</p>
                    {item.summary && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{item.summary}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {item.source && <span className="text-[10px] text-primary/70 font-medium">{item.source}</span>}
                      {item.datetime && (
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(item.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col items-center gap-1">
        <Badge variant="outline" className="text-[9px] font-mono">Source: Finnhub</Badge>
        <p className="text-[9px] text-muted-foreground/50 text-center px-4">
          Market data provided by Finnhub. This is not investment advice.
        </p>
      </div>
    </div>
  );
}
