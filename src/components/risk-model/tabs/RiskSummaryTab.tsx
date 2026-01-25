/**
 * Risk Summary Tab - Overview of key risk metrics
 */

import { useMemo } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters, calculateRiskModelTimeSeries } from '@/lib/riskModelData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { Shield, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { calculateVolatility, calculateMonthlyReturns, calculateDrawdown, calculateCumulativeReturns } from '@/lib/calculations';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

export function RiskSummaryTab({ transactions, valuations, filters, hasData }: TabProps) {
  const timeSeriesData = useMemo(() => {
    if (!hasData) return [];
    return calculateRiskModelTimeSeries(transactions, valuations, filters);
  }, [transactions, valuations, filters, hasData]);
  
  const riskMetrics = useMemo(() => {
    const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
    const returns = monthlyReturns.map(r => r.return);
    const vol = calculateVolatility(returns);
    const cumReturns = calculateCumulativeReturns(monthlyReturns);
    const { maxDrawdown } = calculateDrawdown(cumReturns);
    
    const totalReturn = cumReturns.length > 0 ? cumReturns[cumReturns.length - 1].return : 0;
    const sharpe = vol > 0 ? (totalReturn / (monthlyReturns.length / 12) - 3.6) / vol : 0;
    
    return { vol, maxDrawdown, totalReturn, sharpe };
  }, [transactions, valuations]);

  if (!hasData) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={Shield}
          title="No Risk Data"
          description="Add transactions and valuations to view risk summary"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Volatility</div>
          <div className="text-xl font-mono tabular-nums text-foreground mt-1">
            {riskMetrics.vol.toFixed(2)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Annualized</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Max Drawdown</div>
          <div className="text-xl font-mono tabular-nums text-destructive mt-1">
            -{riskMetrics.maxDrawdown.toFixed(2)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Peak-to-Trough</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Total Return</div>
          <div className={`text-xl font-mono tabular-nums mt-1 ${riskMetrics.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
            {riskMetrics.totalReturn >= 0 ? '+' : ''}{riskMetrics.totalReturn.toFixed(2)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Cumulative</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Sharpe Ratio</div>
          <div className="text-xl font-mono tabular-nums text-foreground mt-1">
            {riskMetrics.sharpe.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground">Risk-Adjusted</div>
        </div>
      </div>
      
      {/* Main Chart - Cumulative Returns */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Cumulative Returns
          </span>
          <span className="text-[9px] text-muted-foreground">Portfolio vs Benchmark</span>
        </div>
        <div className="p-3">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`, 
                    name === 'cumulativePortfolio' ? 'Portfolio' : 
                    name === 'cumulativeBenchmark' ? 'Benchmark' : 'Active'
                  ]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={30}
                  formatter={(value) => (
                    <span className="text-[10px]">
                      {value === 'cumulativePortfolio' ? 'Portfolio' : 
                       value === 'cumulativeBenchmark' ? 'Benchmark' : 'Active'}
                    </span>
                  )}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulativePortfolio" 
                  stroke="hsl(var(--primary))"
                  fill="url(#portfolioGradient)"
                  strokeWidth={2}
                />
                {filters.benchmark !== 'none' && (
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeBenchmark" 
                    stroke="hsl(var(--muted-foreground))"
                    fill="url(#benchmarkGradient)"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Secondary Chart - Monthly Returns Bar */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            Monthly Returns
          </span>
        </div>
        <div className="p-3">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Bar 
                  dataKey="portfolioReturn" 
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
