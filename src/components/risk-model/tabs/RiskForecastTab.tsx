/**
 * Risk Forecast Tab - Forward-looking volatility projections
 */

import { useMemo, useState } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters, calculateRiskForecast } from '@/lib/riskModelData';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateVolatility, calculateMonthlyReturns } from '@/lib/calculations';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

const HORIZONS = [
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
] as const;

export function RiskForecastTab({ transactions, valuations, filters, hasData }: TabProps) {
  const [horizon, setHorizon] = useState<3 | 6 | 12>(6);
  
  const forecastData = useMemo(() => {
    if (!hasData) return [];
    return calculateRiskForecast(transactions, valuations, horizon);
  }, [transactions, valuations, horizon, hasData]);
  
  const currentVol = useMemo(() => {
    const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
    const returns = monthlyReturns.map(r => r.return);
    return calculateVolatility(returns);
  }, [transactions, valuations]);

  if (!hasData) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={TrendingUp}
          title="No Forecast Data"
          description="Add transactions and valuations to generate risk forecasts"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Horizon Selector */}
      <div className="bloomberg-panel">
        <div className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Forecast Horizon:</span>
          </div>
          <div className="flex gap-2">
            {HORIZONS.map((h) => (
              <Button
                key={h.value}
                variant={horizon === h.value ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setHorizon(h.value)}
              >
                {h.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Current vs Forecast KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Current Vol</div>
          <div className="text-xl font-mono tabular-nums text-foreground mt-1">
            {currentVol.toFixed(2)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Realized</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Forecast Vol</div>
          <div className="text-xl font-mono tabular-nums text-primary mt-1">
            {forecastData.length > 0 ? forecastData[forecastData.length - 1].expectedVol.toFixed(2) : '-'}%
          </div>
          <div className="text-[10px] text-muted-foreground">{horizon}M Ahead</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">VaR Lower</div>
          <div className="text-xl font-mono tabular-nums text-success mt-1">
            {forecastData.length > 0 ? forecastData[forecastData.length - 1].varLower.toFixed(2) : '-'}%
          </div>
          <div className="text-[10px] text-muted-foreground">5th Percentile</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">VaR Upper</div>
          <div className="text-xl font-mono tabular-nums text-destructive mt-1">
            {forecastData.length > 0 ? forecastData[forecastData.length - 1].varUpper.toFixed(2) : '-'}%
          </div>
          <div className="text-[10px] text-muted-foreground">95th Percentile</div>
        </div>
      </div>
      
      {/* Fan Chart */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Volatility Forecast
          </span>
          <span className="text-[9px] text-muted-foreground">{horizon}-Month Horizon</span>
        </div>
        <div className="p-3">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
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
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name === 'expectedVol' ? 'Expected' :
                    name === 'varUpper' ? '95th %ile' : '5th %ile'
                  ]}
                />
                <Legend 
                  verticalAlign="top"
                  height={30}
                  formatter={(value) => (
                    <span className="text-[10px]">
                      {value === 'expectedVol' ? 'Expected Volatility' :
                       value === 'varUpper' ? 'Upper Bound' : 'Lower Bound'}
                    </span>
                  )}
                />
                {/* Confidence interval as area */}
                <Area 
                  type="monotone" 
                  dataKey="varUpper" 
                  stroke="transparent"
                  fill="url(#forecastGradient)"
                  fillOpacity={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="varLower" 
                  stroke="transparent"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />
                {/* Expected volatility line */}
                <Area 
                  type="monotone" 
                  dataKey="expectedVol" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="none"
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Forecast Table */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Forecast Details</span>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-4 gap-4 text-[10px]">
            <div className="font-semibold text-muted-foreground">Month</div>
            <div className="font-semibold text-muted-foreground text-right">Expected Vol</div>
            <div className="font-semibold text-muted-foreground text-right">Lower (5%)</div>
            <div className="font-semibold text-muted-foreground text-right">Upper (95%)</div>
            {forecastData.map((row) => (
              <>
                <div key={`${row.month}-month`} className="font-mono">{row.month}</div>
                <div key={`${row.month}-exp`} className="font-mono text-right tabular-nums">{row.expectedVol.toFixed(2)}%</div>
                <div key={`${row.month}-low`} className="font-mono text-right tabular-nums text-success">{row.varLower.toFixed(2)}%</div>
                <div key={`${row.month}-up`} className="font-mono text-right tabular-nums text-destructive">{row.varUpper.toFixed(2)}%</div>
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
