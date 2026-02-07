import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Plus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useMarketPrices, MarketPriceRow } from '@/hooks/useMarketPrices';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function formatNumber(n: number | null, decimals = 2): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatVolume(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function PriceChangeCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const isPositive = value > 0;
  const isNegative = value < 0;
  return (
    <span className={cn(
      'flex items-center gap-1 font-mono text-xs',
      isPositive && 'text-emerald-400',
      isNegative && 'text-red-400',
      !isPositive && !isNegative && 'text-muted-foreground',
    )}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

interface AdHocPrice {
  id: string;
  symbol: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  currency: string;
  price_date: string;
  dailyChangePct: number | null;
}

export default function Market() {
  const { prices, loading, error, fetchErrors, stats, fetchPrices } = useMarketPrices();
  const { toast } = useToast();

  // Ad-hoc ticker state
  const [tickerInput, setTickerInput] = useState('');
  const [adHocPrices, setAdHocPrices] = useState<AdHocPrice[]>([]);
  const [adHocLoading, setAdHocLoading] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleAddTicker = async () => {
    const symbol = tickerInput.trim().toUpperCase();
    if (!symbol) return;
    if (adHocPrices.some(p => p.symbol === symbol)) {
      toast({ title: 'Already added', description: `${symbol} is already in the list` });
      return;
    }

    setAdHocLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('fetch-market-prices', {
        body: { symbols: [symbol] },
      });

      if (fnErr) throw new Error(fnErr.message);
      if (data.error) throw new Error(data.error);

      if (data.errors?.length > 0) {
        toast({
          title: 'Symbol not found',
          description: `Could not fetch data for ${symbol}`,
          variant: 'destructive',
        });
        return;
      }

      const fetched = data.prices?.[0];
      if (fetched) {
        const dailyChangePct = fetched.open && fetched.open > 0
          ? ((fetched.close - fetched.open) / fetched.open) * 100
          : null;
        setAdHocPrices(prev => [...prev, { ...fetched, dailyChangePct }]);
        setTickerInput('');
        toast({ title: 'Success', description: `${symbol}: $${fetched.close}` });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAdHocLoading(false);
    }
  };

  const removeAdHoc = (symbol: string) => {
    setAdHocPrices(prev => prev.filter(p => p.symbol !== symbol));
  };

  const totalMarketValue = prices.reduce((sum, p) => sum + p.marketValue, 0);
  const allRows = [...adHocPrices.map(p => ({ ...p, isAdHoc: true as const }))];

  return (
    <>
      <Helmet>
        <title>Market Prices | SUFOX Capital</title>
        <meta name="description" content="Real-time and EOD market prices for portfolio holdings" />
      </Helmet>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Market Prices
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              EOD prices for portfolio holdings
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!loading && prices.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {stats.cachedCount > 0 && `${stats.cachedCount} cached`}
                {stats.fetchedCount > 0 && ` · ${stats.fetchedCount} fetched`}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPrices(true)}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Add Ticker */}
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Quick Lookup</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter ticker (e.g. AAPL)"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTicker()}
              className="font-mono text-sm h-8 max-w-[200px]"
              disabled={adHocLoading}
            />
            <Button
              size="sm"
              onClick={handleAddTicker}
              disabled={adHocLoading || !tickerInput.trim()}
              className="gap-1.5 h-8"
            >
              {adHocLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>

          {/* Ad-hoc results */}
          {adHocPrices.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead className="text-[10px] uppercase">Symbol</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Last Close</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Daily Chg</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Open</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">High</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Low</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Volume</TableHead>
                    <TableHead className="text-[10px] uppercase">Date</TableHead>
                    <TableHead className="text-[10px] uppercase w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adHocPrices.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono font-semibold text-primary text-xs">{row.symbol}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium">${formatNumber(row.close)}</TableCell>
                      <TableCell className="text-right"><PriceChangeCell value={row.dailyChangePct} /></TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNumber(row.open)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNumber(row.high)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNumber(row.low)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatVolume(row.volume)}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-mono">{row.price_date}</TableCell>
                      <TableCell>
                        <button onClick={() => removeAdHoc(row.symbol)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Summary KPIs */}
        {!loading && prices.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Market Value</p>
              <p className="text-lg font-bold font-mono text-foreground">${formatNumber(totalMarketValue, 0)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Holdings</p>
              <p className="text-lg font-bold font-mono text-foreground">{prices.length}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={() => fetchPrices(true)} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Fetch Errors */}
        {fetchErrors.length > 0 && (
          <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Failed to fetch: {fetchErrors.map(e => e.symbol).join(', ')}
            </span>
          </div>
        )}

        {/* Holdings Table */}
        {(prices.length > 0 || loading) && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 border-b border-border bg-secondary/30">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Holdings</span>
            </div>
            {loading ? (
              <div className="p-4">
                <SkeletonTable />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/20">
                      <TableHead className="text-[10px] uppercase">Symbol</TableHead>
                      <TableHead className="text-[10px] uppercase">Name</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Last Close</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Daily Chg</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">High</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Low</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Volume</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Qty</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Market Value</TableHead>
                      <TableHead className="text-[10px] uppercase">CCY</TableHead>
                      <TableHead className="text-[10px] uppercase">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-semibold text-primary text-xs">{row.symbol}</TableCell>
                        <TableCell className="text-xs text-foreground/80 max-w-[140px] truncate">{row.assetName}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">{formatNumber(row.close)}</TableCell>
                        <TableCell className="text-right"><PriceChangeCell value={row.dailyChangePct} /></TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNumber(row.high)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNumber(row.low)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatVolume(row.volume)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatNumber(row.quantity, 0)}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          {row.currency === 'ILS' ? '₪' : '$'}{formatNumber(row.marketValue, 0)}
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{row.currency}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-mono">{row.price_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
