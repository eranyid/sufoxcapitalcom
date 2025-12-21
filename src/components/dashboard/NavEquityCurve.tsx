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
      return `${prefix}${(value / 1000000).toFixed(1)}M`;
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

  // Determine if NAV is trending up overall
  const isOverallPositive = useMemo(() => {
    if (navSeries.length < 2) return true;
    return navSeries[navSeries.length - 1].nav >= navSeries[0].nav;
  }, [navSeries]);

  return (
    <div className="bloomberg-panel animate-fade-in overflow-hidden">
      {/* Header Section */}
      <div className="bg-card/80 border-b border-border/40">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left: Title + Warning */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-primary">
              FUND NAV
            </h3>
            {!hasCashData && (
              <span className="flex items-center gap-1 text-[9px] text-warning bg-warning/10 px-1.5 py-0.5 rounded-sm">
                <AlertTriangle className="h-2.5 w-2.5" />
                Cash incomplete
              </span>
            )}
          </div>
          
          {/* Right: KPIs in a single row */}
          {kpis && (
            <div className="flex items-center gap-5">
              {/* Last NAV */}
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-muted-foreground/70 uppercase tracking-widest font-medium">
                  Last NAV
                </span>
                <span className="text-sm font-mono font-bold text-foreground tabular-nums">
                  {formatFullCurrency(kpis.lastNav)}
                </span>
              </div>
              
              {/* MoM */}
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-muted-foreground/70 uppercase tracking-widest font-medium">
                  MoM
                </span>
                <div className={cn(
                  "flex items-center gap-0.5 text-sm font-mono font-semibold tabular-nums",
                  kpis.momChange >= 0 ? "text-positive" : "text-negative"
                )}>
                  {kpis.momChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{kpis.momChange >= 0 ? '+' : ''}{kpis.momChange.toFixed(2)}%</span>
                </div>
              </div>
              
              {/* YTD */}
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-muted-foreground/70 uppercase tracking-widest font-medium">
                  YTD
                </span>
                <div className={cn(
                  "flex items-center gap-0.5 text-sm font-mono font-semibold tabular-nums",
                  kpis.ytdChange >= 0 ? "text-positive" : "text-negative"
                )}>
                  {kpis.ytdChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{kpis.ytdChange >= 0 ? '+' : ''}{kpis.ytdChange.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="px-4 py-2 border-b border-border/20 bg-background/50">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSplit(false)}
            className={cn(
              "text-[10px] font-mono px-3 py-1 rounded-full transition-all duration-200",
              !showSplit 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Total NAV
          </button>
          <button
            onClick={() => setShowSplit(true)}
            className={cn(
              "text-[10px] font-mono px-3 py-1 rounded-full transition-all duration-200",
              showSplit 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Split: Cash vs Holdings
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-4 pt-3">
        <div className="h-[220px]" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.15))' }}>
          <ResponsiveContainer width="100%" height="100%">
            {showSplit ? (
              <LineChart data={navSeries} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.04)" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(2, 7).replace('-', '/')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
                  tickFormatter={formatCurrency}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F0F0F', 
                    border: '1px solid rgba(245,158,11,0.35)',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                  labelStyle={{ color: '#9CA3AF', fontWeight: 400, marginBottom: '4px', fontSize: '9px' }}
                  formatter={(value: number, name: string) => [
                    <span key={name} style={{ color: '#F2F2F0', fontWeight: 600, fontSize: '12px' }}>
                      {formatFullCurrency(value)}
                    </span>, 
                    name
                  ]}
                  labelFormatter={(label) => `${label}`}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '4 4' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '9px', paddingTop: '8px' }}
                  formatter={(value) => <span className="text-muted-foreground font-mono">{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="#F2F2F0"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#F2F2F0', stroke: '#F59E0B', strokeWidth: 2 }}
                  name="Total NAV"
                />
                <Line 
                  type="monotone" 
                  dataKey="holdings" 
                  stroke="hsl(var(--chart-blue))"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: 'hsl(var(--chart-blue))', stroke: '#F59E0B', strokeWidth: 2 }}
                  name="Holdings"
                />
                <Line 
                  type="monotone" 
                  dataKey="cash" 
                  stroke="hsl(var(--chart-gold))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 3, fill: 'hsl(var(--chart-gold))', stroke: '#F59E0B', strokeWidth: 2 }}
                  name="Cash"
                />
              </LineChart>
            ) : (
              <AreaChart data={navSeries} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                <defs>
                  {/* Blue gradient - primary institutional look */}
                  <linearGradient id="navGradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.08}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.04)" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(2, 7).replace('-', '/')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
                  tickFormatter={formatCurrency}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F0F0F', 
                    border: '1px solid rgba(245,158,11,0.35)',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    padding: '10px 14px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
                  }}
                  labelStyle={{ color: '#9CA3AF', fontWeight: 400, marginBottom: '2px', fontSize: '9px' }}
                  formatter={(value: number) => [
                    <span key="nav" style={{ color: '#F2F2F0', fontWeight: 600, fontSize: '13px' }}>
                      {formatFullCurrency(value)}
                    </span>, 
                    ''
                  ]}
                  labelFormatter={(label) => `${label}`}
                  cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fill="url(#navGradientBlue)"
                  activeDot={{ 
                    r: 5, 
                    fill: '#3B82F6', 
                    stroke: '#60A5FA', 
                    strokeWidth: 2 
                  }}
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
