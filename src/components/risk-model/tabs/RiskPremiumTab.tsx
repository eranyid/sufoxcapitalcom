/**
 * Risk Premium Tab - Return premiums over risk-free rate
 */

import { useMemo } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters, calculateRiskPremium } from '@/lib/riskModelData';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

export function RiskPremiumTab({ transactions, valuations, filters, hasData }: TabProps) {
  const premiumData = useMemo(() => {
    if (!hasData) return [];
    return calculateRiskPremium(transactions, valuations);
  }, [transactions, valuations, hasData]);
  
  const latestPremium = premiumData.length > 0 ? premiumData[premiumData.length - 1] : null;
  const avgPremium = useMemo(() => {
    if (premiumData.length === 0) return 0;
    return premiumData.reduce((sum, p) => sum + p.totalPremium, 0) / premiumData.length;
  }, [premiumData]);

  if (!hasData || premiumData.length === 0) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={DollarSign}
          title="No Premium Data"
          description="Need at least 12 months of data to calculate risk premiums"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Total Premium</div>
          <div className={cn(
            "text-xl font-mono tabular-nums mt-1",
            (latestPremium?.totalPremium ?? 0) >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {latestPremium ? `${latestPremium.totalPremium >= 0 ? '+' : ''}${latestPremium.totalPremium.toFixed(2)}%` : '-'}
          </div>
          <div className="text-[10px] text-muted-foreground">Rolling 12M</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Equity Premium</div>
          <div className={cn(
            "text-xl font-mono tabular-nums mt-1",
            (latestPremium?.equityPremium ?? 0) >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {latestPremium ? `${latestPremium.equityPremium >= 0 ? '+' : ''}${latestPremium.equityPremium.toFixed(2)}%` : '-'}
          </div>
          <div className="text-[10px] text-muted-foreground">vs Risk-Free</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Term Premium</div>
          <div className={cn(
            "text-xl font-mono tabular-nums mt-1",
            (latestPremium?.termPremium ?? 0) >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {latestPremium ? `${latestPremium.termPremium >= 0 ? '+' : ''}${latestPremium.termPremium.toFixed(2)}%` : '-'}
          </div>
          <div className="text-[10px] text-muted-foreground">Duration</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Avg Premium</div>
          <div className={cn(
            "text-xl font-mono tabular-nums mt-1",
            avgPremium >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {avgPremium >= 0 ? '+' : ''}{avgPremium.toFixed(2)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Historical</div>
        </div>
      </div>
      
      {/* Stacked Area Chart - Premium Components */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Risk Premium Components
          </span>
          <span className="text-[9px] text-muted-foreground">Rolling 12-Month</span>
        </div>
        <div className="p-3">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={premiumData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="termGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(36, 95%, 50%)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="hsl(36, 95%, 50%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tickFormatter={(v) => v.slice(5)}
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
                  }}
                  formatter={(value: number, name: string) => [
                    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`,
                    name === 'equityPremium' ? 'Equity' :
                    name === 'termPremium' ? 'Term' : 'Credit'
                  ]}
                />
                <Legend 
                  verticalAlign="top"
                  height={30}
                  formatter={(value) => (
                    <span className="text-[10px]">
                      {value === 'equityPremium' ? 'Equity Premium' :
                       value === 'termPremium' ? 'Term Premium' : 'Credit Premium'}
                    </span>
                  )}
                />
                <Area 
                  type="monotone" 
                  dataKey="equityPremium" 
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="url(#equityGradient)"
                />
                <Area 
                  type="monotone" 
                  dataKey="termPremium" 
                  stackId="1"
                  stroke="hsl(173, 80%, 40%)"
                  fill="url(#termGradient)"
                />
                <Area 
                  type="monotone" 
                  dataKey="creditPremium" 
                  stackId="1"
                  stroke="hsl(36, 95%, 50%)"
                  fill="url(#creditGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Total Premium Line */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Total Risk Premium</span>
        </div>
        <div className="p-3">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={premiumData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tickFormatter={(v) => v.slice(5)}
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
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, 'Total Premium']}
                />
                <Bar 
                  dataKey="totalPremium" 
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Details Table */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Premium History</span>
        </div>
        <div className="p-2 max-h-[200px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8">Period</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Equity</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Term</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Credit</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...premiumData].reverse().slice(0, 12).map((row) => (
                <TableRow key={row.period} className="hover:bg-muted/30 border-border">
                  <TableCell className="text-xs font-mono py-1.5">{row.period}</TableCell>
                  <TableCell className={cn(
                    "text-xs font-mono text-right py-1.5 tabular-nums",
                    row.equityPremium >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {row.equityPremium >= 0 ? '+' : ''}{row.equityPremium.toFixed(2)}%
                  </TableCell>
                  <TableCell className={cn(
                    "text-xs font-mono text-right py-1.5 tabular-nums",
                    row.termPremium >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {row.termPremium >= 0 ? '+' : ''}{row.termPremium.toFixed(2)}%
                  </TableCell>
                  <TableCell className={cn(
                    "text-xs font-mono text-right py-1.5 tabular-nums",
                    row.creditPremium >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {row.creditPremium >= 0 ? '+' : ''}{row.creditPremium.toFixed(2)}%
                  </TableCell>
                  <TableCell className={cn(
                    "text-xs font-mono text-right py-1.5 tabular-nums font-semibold",
                    row.totalPremium >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {row.totalPremium >= 0 ? '+' : ''}{row.totalPremium.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
