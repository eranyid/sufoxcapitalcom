import { useMemo, useState } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Transaction, MonthlyValuation, CashBalances } from '@/types/investment';
import { cn } from '@/lib/utils';

interface NavEquityCurveProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  cashBalances: CashBalances;
  baseCurrency?: 'USD' | 'ILS';
}

interface NavDataPoint {
  month: string;
  nav: number;
  cash: number;
  holdings: number;
}

export function NavEquityCurve({ 
  transactions, 
  valuations, 
  cashBalances,
  baseCurrency = 'USD'
}: NavEquityCurveProps) {
  const [showSplit, setShowSplit] = useState(false);

  // Calculate NAV series from monthly valuations
  const navSeries = useMemo((): NavDataPoint[] => {
    if (transactions.length === 0 || valuations.length === 0) return [];

    // Get unique months from valuations, sorted
    const months = [...new Set(valuations.map(v => v.month))].sort();

    // Build holdings quantities at each point in time
    const holdingsMap: Record<string, Record<string, number>> = {}; // month -> ticker -> quantity

    // Sort transactions by date
    const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    // For each month, calculate cumulative holdings up to that month
    months.forEach(month => {
      const holdings: Record<string, number> = {};
      
      sortedTx.forEach(tx => {
        const txMonth = tx.date.slice(0, 7);
        if (txMonth <= month) {
          const qty = holdings[tx.ticker] || 0;
          if (tx.transactionType === 'buy') {
            holdings[tx.ticker] = qty + tx.quantity;
          } else {
            holdings[tx.ticker] = qty - tx.quantity;
          }
        }
      });

      holdingsMap[month] = holdings;
    });

    // Calculate NAV for each month
    const navData: NavDataPoint[] = months.map(month => {
      const holdings = holdingsMap[month] || {};
      const monthValuations = valuations.filter(v => v.month === month);
      
      let holdingsValue = 0;
      
      Object.entries(holdings).forEach(([ticker, quantity]) => {
        if (quantity <= 0) return;
        
        const valuation = monthValuations.find(v => v.ticker === ticker);
        if (valuation) {
          const fxRate = valuation.fxRate || 1;
          holdingsValue += quantity * valuation.pricePerUnit * fxRate;
        }
      });

      // For cash, we use current cash balance for all months (simplified)
      // In a real system, you'd track historical cash balances
      const totalCash = baseCurrency === 'USD' 
        ? cashBalances.USD + (cashBalances.EUR * 1.08) + (cashBalances.ILS / 3.6)
        : cashBalances.ILS + (cashBalances.USD * 3.6) + (cashBalances.EUR * 3.9);

      return {
        month,
        nav: holdingsValue + totalCash,
        cash: totalCash,
        holdings: holdingsValue
      };
    });

    // Return last 12 months or all data if less
    const last12 = navData.slice(-12);
    return last12;
  }, [transactions, valuations, cashBalances, baseCurrency]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (navSeries.length === 0) return null;

    const lastNav = navSeries[navSeries.length - 1]?.nav || 0;
    const prevNav = navSeries[navSeries.length - 2]?.nav || lastNav;
    const momChange = prevNav > 0 ? ((lastNav - prevNav) / prevNav) * 100 : 0;

    // YTD calculation
    const currentYear = new Date().getFullYear().toString();
    const yearStart = navSeries.find(n => n.month.startsWith(currentYear));
    const firstOfYearNav = yearStart?.nav || navSeries[0]?.nav || lastNav;
    const ytdChange = firstOfYearNav > 0 ? ((lastNav - firstOfYearNav) / firstOfYearNav) * 100 : 0;

    return {
      lastNav,
      momChange,
      ytdChange
    };
  }, [navSeries]);

  // Check for cash data completeness
  const hasCashData = cashBalances.USD > 0 || cashBalances.EUR > 0 || cashBalances.ILS > 0;

  const formatCurrency = (value: number) => {
    const prefix = baseCurrency === 'USD' ? '$' : '₪';
    if (value >= 1000000) {
      return `${prefix}${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${prefix}${(value / 1000).toFixed(0)}K`;
    }
    return `${prefix}${value.toFixed(0)}`;
  };

  const formatFullCurrency = (value: number) => {
    const prefix = baseCurrency === 'USD' ? '$' : '₪';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace(/^/, prefix);
  };

  if (navSeries.length === 0) {
    return null;
  }

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bloomberg-header-title">FUND NAV (Cash + Holdings)</span>
          {!hasCashData && (
            <span className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded">
              <AlertTriangle className="h-3 w-3" />
              Cash data incomplete
            </span>
          )}
        </div>
        
        {/* KPIs */}
        {kpis && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Last NAV</span>
              <p className="text-xs font-mono font-medium text-foreground">{formatFullCurrency(kpis.lastNav)}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">MoM</span>
              <p className={cn(
                "text-xs font-mono font-medium flex items-center justify-end gap-0.5",
                kpis.momChange >= 0 ? "text-positive" : "text-negative"
              )}>
                {kpis.momChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpis.momChange >= 0 ? '+' : ''}{kpis.momChange.toFixed(2)}%
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">YTD</span>
              <p className={cn(
                "text-xs font-mono font-medium flex items-center justify-end gap-0.5",
                kpis.ytdChange >= 0 ? "text-positive" : "text-negative"
              )}>
                {kpis.ytdChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpis.ytdChange >= 0 ? '+' : ''}{kpis.ytdChange.toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-3 pt-1">
        <p className="text-[10px] text-muted-foreground font-mono">
          Portfolio equity curve based on monthly valuations
        </p>
      </div>

      <div className="p-3">
        {/* Toggle */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setShowSplit(false)}
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded transition-colors",
              !showSplit 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Total NAV
          </button>
          <button
            onClick={() => setShowSplit(true)}
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded transition-colors",
              showSplit 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Split: Cash vs Holdings
          </button>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {showSplit ? (
              <LineChart data={navSeries} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(2, 7).replace('-', '/')}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={formatCurrency}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono'
                  }}
                  labelStyle={{ color: 'hsl(var(--primary))' }}
                  formatter={(value: number, name: string) => [formatFullCurrency(value), name]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={false}
                  name="Total NAV"
                />
                <Line 
                  type="monotone" 
                  dataKey="holdings" 
                  stroke="hsl(var(--chart-blue))"
                  strokeWidth={1.5}
                  dot={false}
                  name="Holdings"
                />
                <Line 
                  type="monotone" 
                  dataKey="cash" 
                  stroke="hsl(var(--chart-gold))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  name="Cash"
                />
              </LineChart>
            ) : (
              <AreaChart data={navSeries} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(2, 7).replace('-', '/')}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={formatCurrency}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono'
                  }}
                  labelStyle={{ color: 'hsl(var(--primary))' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'nav') {
                      const point = navSeries.find(n => n.nav === value);
                      return [
                        <div key="nav" className="space-y-1">
                          <div>NAV: {formatFullCurrency(value)}</div>
                          {point && (
                            <>
                              <div className="text-[10px] text-muted-foreground">
                                Holdings: {formatFullCurrency(point.holdings)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Cash: {formatFullCurrency(point.cash)}
                              </div>
                            </>
                          )}
                        </div>,
                        ''
                      ];
                    }
                    return [formatFullCurrency(value), name];
                  }}
                  labelFormatter={(label) => `${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="hsl(var(--foreground))"
                  strokeWidth={1.5}
                  fill="url(#navGradient)"
                  dot={false}
                  name="nav"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
