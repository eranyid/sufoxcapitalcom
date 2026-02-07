import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Loader2, TrendingUp, DollarSign, BarChart3, AlertTriangle, Building2, Globe, Briefcase, Sparkles, Newspaper, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

interface FinancialPeriod {
  period: string;
  revenue: number | null;
  cost_of_revenue: number | null;
  gross_profit: number | null;
  operating_expenses: number | null;
  operating_income: number | null;
  net_income: number | null;
  eps: number | null;
  total_assets: number | null;
  current_assets: number | null;
  total_liabilities: number | null;
  current_liabilities: number | null;
  total_equity: number | null;
  cash_and_equivalents: number | null;
  total_debt: number | null;
  operating_cash_flow: number | null;
  capital_expenditures: number | null;
  free_cash_flow: number | null;
  investing_cash_flow: number | null;
  financing_cash_flow: number | null;
}

interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number | null;
  related: string;
  image: string;
  category: string;
}

interface FundamentalData {
  company_name: string;
  ticker: string;
  sector: string;
  industry: string;
  country: string;
  currency: string;
  market_cap_b: number | null;
  enterprise_value_b: number | null;
  current_price: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  pe_ratio: number | null;
  forward_pe: number | null;
  pb_ratio: number | null;
  ps_ratio: number | null;
  ev_ebitda: number | null;
  dividend_yield_pct: number | null;
  payout_ratio_pct: number | null;
  eps_ttm: number | null;
  revenue_ttm_b: number | null;
  net_income_ttm_b: number | null;
  ebitda_ttm_b: number | null;
  free_cash_flow_ttm_b: number | null;
  gross_margin_pct: number | null;
  operating_margin_pct: number | null;
  net_margin_pct: number | null;
  roe_pct: number | null;
  roa_pct: number | null;
  roic_pct: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  revenue_growth_yoy_pct: number | null;
  earnings_growth_yoy_pct: number | null;
  revenue_history: Array<{ year: string; revenue_b: number; net_income_b: number; eps: number }>;
  margin_history: Array<{ year: string; gross_margin_pct: number; operating_margin_pct: number; net_margin_pct: number }>;
  annual_statements: FinancialPeriod[];
  quarterly_statements: FinancialPeriod[];
  news: NewsItem[];
}

function fmt(n: number | null | undefined, decimals = 2, suffix = ''): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
}

function fmtM(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'K';
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function KpiTile({ label, value, suffix = '', icon: Icon, positive }: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  icon?: any;
  positive?: boolean | null;
}) {
  if (value == null) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className={cn(
        "text-lg font-bold font-mono",
        positive === true && "text-emerald-400",
        positive === false && "text-red-400",
        positive == null && "text-foreground",
      )}>
        {fmt(value, 2, suffix)}
      </span>
    </div>
  );
}

function FinancialStatementsTable({ statements, currency }: { statements: FinancialPeriod[]; currency: string }) {
  if (!statements.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">No financial statements available</p>;
  }

  const sym = currency === 'ILS' ? '₪' : currency === 'EUR' ? '€' : '$';

  const rows: { label: string; key: keyof FinancialPeriod; section: string; bold?: boolean }[] = [
    { label: 'Revenue', key: 'revenue', section: 'income', bold: true },
    { label: 'Cost of Revenue', key: 'cost_of_revenue', section: 'income' },
    { label: 'Gross Profit', key: 'gross_profit', section: 'income', bold: true },
    { label: 'Operating Expenses', key: 'operating_expenses', section: 'income' },
    { label: 'Operating Income', key: 'operating_income', section: 'income', bold: true },
    { label: 'Net Income', key: 'net_income', section: 'income', bold: true },
    { label: 'EPS (Diluted)', key: 'eps', section: 'income' },
    { label: 'Total Assets', key: 'total_assets', section: 'balance', bold: true },
    { label: 'Current Assets', key: 'current_assets', section: 'balance' },
    { label: 'Cash & Equivalents', key: 'cash_and_equivalents', section: 'balance' },
    { label: 'Total Liabilities', key: 'total_liabilities', section: 'balance', bold: true },
    { label: 'Current Liabilities', key: 'current_liabilities', section: 'balance' },
    { label: 'Total Debt', key: 'total_debt', section: 'balance' },
    { label: 'Total Equity', key: 'total_equity', section: 'balance', bold: true },
    { label: 'Operating Cash Flow', key: 'operating_cash_flow', section: 'cashflow', bold: true },
    { label: 'Capital Expenditures', key: 'capital_expenditures', section: 'cashflow' },
    { label: 'Free Cash Flow', key: 'free_cash_flow', section: 'cashflow', bold: true },
    { label: 'Investing Cash Flow', key: 'investing_cash_flow', section: 'cashflow' },
    { label: 'Financing Cash Flow', key: 'financing_cash_flow', section: 'cashflow' },
  ];

  let lastSection = '';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 text-muted-foreground font-medium sticky left-0 bg-card z-10 min-w-[140px]">
              Item ({sym})
            </th>
            {statements.map((s) => (
              <th key={s.period} className="text-right py-2 px-2 text-muted-foreground font-medium min-w-[90px]">
                {s.period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const showSectionHeader = row.section !== lastSection;
            lastSection = row.section;
            return (
              <>
                {showSectionHeader && (
                  <tr key={`section-${row.section}`}>
                    <td
                      colSpan={statements.length + 1}
                      className="pt-3 pb-1 px-2 text-[10px] uppercase tracking-wider text-primary font-semibold"
                    >
                      {row.section === 'income' ? 'Income Statement' : row.section === 'balance' ? 'Balance Sheet' : 'Cash Flow Statement'}
                    </td>
                  </tr>
                )}
                <tr key={row.key} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className={cn(
                    "py-1.5 px-2 sticky left-0 bg-card z-10",
                    row.bold ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}>
                    {row.label}
                  </td>
                  {statements.map((s) => {
                    const val = s[row.key] as number | null;
                    const isEps = row.key === 'eps';
                    return (
                      <td key={s.period} className={cn(
                        "text-right py-1.5 px-2 font-mono",
                        row.bold ? "font-semibold text-foreground" : "text-foreground/80",
                        val != null && val < 0 && "text-red-400",
                      )}>
                        {isEps ? fmt(val) : fmtM(val)}
                      </td>
                    );
                  })}
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Market() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FundamentalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    const sym = ticker.trim().toUpperCase();
    if (!sym) return;
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke('analyze-fundamental', {
        body: { ticker: sym },
      });

      if (fnErr) throw new Error(fnErr.message);
      if (result?.error) throw new Error(result.error);
      if (!result?.data) throw new Error('No data returned');

      setData(result.data);
      toast({ title: `${result.data.company_name}`, description: 'Fundamental data loaded' });
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const radarData = data ? [
    { metric: 'Profitability', value: Math.min((data.net_margin_pct ?? 0) / 30 * 100, 100) },
    { metric: 'Growth', value: Math.min(Math.abs(data.revenue_growth_yoy_pct ?? 0) / 30 * 100, 100) },
    { metric: 'Valuation', value: Math.min(100 - ((data.pe_ratio ?? 25) / 50 * 100), 100) },
    { metric: 'Efficiency', value: Math.min((data.roe_pct ?? 0) / 30 * 100, 100) },
    { metric: 'Leverage', value: Math.min(100 - ((data.debt_to_equity ?? 1) / 3 * 100), 100) },
  ] : [];

  // Latest annual statement for balance sheet KPIs
  const latestAnnual = data?.annual_statements?.length
    ? data.annual_statements[data.annual_statements.length - 1]
    : null;

  return (
    <>
      <Helmet>
        <title>Fundamental Analysis | SUFOX Capital</title>
        <meta name="description" content="Finnhub-powered fundamental analysis for any ticker" />
      </Helmet>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Fundamental Analysis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Finnhub-powered fundamental data & metrics for any ticker
            </p>
          </div>
        </div>

        {/* Unified header block */}
        <div className="bg-card border border-border rounded-lg px-4 py-3 space-y-2">
          {/* Row 1: Input + Company info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-2 items-center shrink-0">
              <Input
                placeholder="Enter ticker (e.g. AAPL, MSFT, TEVA)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                className="font-mono text-sm h-9 max-w-[200px]"
                disabled={loading}
              />
              <Button onClick={handleAnalyze} disabled={loading || !ticker.trim()} className="gap-2 h-9">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Analyze
              </Button>
            </div>
            {data && !loading && (
              <>
                <div className="hidden sm:block w-px h-8 bg-border mx-1" />
                <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground truncate">{data.company_name}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px] h-5">{data.ticker}</Badge>
                      <Badge variant="secondary" className="gap-1 text-[10px] h-5"><Briefcase className="h-2.5 w-2.5" />{data.sector}</Badge>
                      <Badge variant="secondary" className="gap-1 text-[10px] h-5"><Building2 className="h-2.5 w-2.5" />{data.industry}</Badge>
                      <Badge variant="secondary" className="gap-1 text-[10px] h-5"><Globe className="h-2.5 w-2.5" />{data.country}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-baseline gap-4">
                    {data.market_cap_b != null && (
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mkt Cap</span>
                        <span className="text-sm font-bold font-mono text-foreground">{fmt(data.market_cap_b, 2, 'B')}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {data.currency === 'ILS' ? '₪' : data.currency === 'EUR' ? '€' : '$'}{fmt(data.current_price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        52W: {fmt(data.week_52_low)} – {fmt(data.week_52_high)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* KPI metrics rows */}
          {data && !loading && (
            <>
              <div className="border-t border-border" />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {[
                  { label: 'Market Cap', value: data.market_cap_b, suffix: 'B' },
                  { label: 'P/E (TTM)', value: data.pe_ratio },
                  { label: 'Fwd P/E', value: data.forward_pe },
                  { label: 'Gross Margin', value: data.gross_margin_pct, suffix: '%', color: true },
                  { label: 'Op. Margin', value: data.operating_margin_pct, suffix: '%', color: true },
                  { label: 'Rev Growth YoY', value: data.revenue_growth_yoy_pct, suffix: '%', color: true },
                  { label: 'Earnings Growth', value: data.earnings_growth_yoy_pct, suffix: '%', color: true },
                  { label: 'Div Yield', value: data.dividend_yield_pct, suffix: '%' },
                ].filter(k => k.value != null).map(k => (
                  <div key={k.label} className="flex items-baseline gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                    <span className={cn(
                      "text-sm font-bold font-mono",
                      k.color && k.value != null && k.value > 0 ? "text-emerald-400" : k.color && k.value != null && k.value < 0 ? "text-red-400" : "text-foreground"
                    )}>
                      {fmt(k.value, 2, k.suffix || '')}
                    </span>
                  </div>
                ))}
              </div>
              {latestAnnual && (
                <>
                  <div className="border-t border-border" />
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    {[
                      { label: 'Total Assets', value: latestAnnual.total_assets, suffix: 'B' },
                      { label: 'Current Assets', value: latestAnnual.current_assets, suffix: 'B' },
                      { label: 'Cash', value: latestAnnual.cash_and_equivalents, suffix: 'B' },
                      { label: 'Total Liabilities', value: latestAnnual.total_liabilities, suffix: 'B' },
                      { label: 'Current Liabilities', value: latestAnnual.current_liabilities, suffix: 'B' },
                      { label: 'Total Debt', value: latestAnnual.total_debt, suffix: 'B' },
                      { label: 'Total Equity', value: latestAnnual.total_equity, suffix: 'B', color: true },
                    ].filter(k => k.value != null).map(k => (
                      <div key={k.label} className="flex items-baseline gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                        <span className={cn(
                          "text-sm font-bold font-mono",
                          k.color && k.value != null && k.value > 0 ? "text-emerald-400" : k.color && k.value != null && k.value < 0 ? "text-red-400" : "text-foreground"
                        )}>
                          {fmt(k.value / 1e9, 2, k.suffix || '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing {ticker.toUpperCase()}...</p>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue & Net Income Chart */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Revenue & Net Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.revenue_history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}B`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [`${v.toFixed(2)}B`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="revenue_b" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net_income_b" name="Net Income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Margin Trends Chart */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Margin Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data.margin_history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="gross_margin_pct" name="Gross" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="operating_margin_pct" name="Operating" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="net_margin_pct" name="Net" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* EPS History */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    EPS History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.revenue_history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [`${v.toFixed(2)}`, '']}
                      />
                      <Bar dataKey="eps" name="EPS" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quality Radar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Financial Statements Table */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Financial Statements</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="annual" className="w-full">
                  <TabsList className="mb-3">
                    <TabsTrigger value="annual">Annual</TabsTrigger>
                    <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  </TabsList>
                  <TabsContent value="annual">
                    <FinancialStatementsTable statements={data.annual_statements || []} currency={data.currency} />
                  </TabsContent>
                  <TabsContent value="quarterly">
                    <FinancialStatementsTable statements={data.quarterly_statements || []} currency={data.currency} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Company News */}
            {data.news && data.news.length > 0 && (
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    Company News
                    <Badge variant="secondary" className="text-[10px] ml-auto">{data.news.length} articles</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {data.news.map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-16 h-16 rounded object-cover flex-shrink-0 bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                            {item.headline}
                          </p>
                          {item.summary && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            {item.source && (
                              <span className="text-[10px] text-primary/70 font-medium">{item.source}</span>
                            )}
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

            {/* Source & Disclaimer */}
            <div className="flex flex-col items-center gap-1">
              <Badge variant="outline" className="text-[9px] font-mono">Source: Finnhub</Badge>
              <p className="text-[9px] text-muted-foreground/50 text-center px-4">
                Market data provided by Finnhub. This is not investment advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
