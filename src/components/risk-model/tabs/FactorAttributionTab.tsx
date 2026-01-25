/**
 * Factor Attribution Tab - Return attribution by category
 */

import { useMemo, useState } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters, calculateAttributionByCategory, calculateRiskModelTimeSeries } from '@/lib/riskModelData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { PieChart, ChevronDown, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(36, 95%, 50%)', // Orange
  'hsl(173, 80%, 40%)', // Teal
  'hsl(280, 65%, 60%)', // Purple
  'hsl(45, 93%, 47%)',  // Yellow
  'hsl(0, 72%, 51%)',   // Red
];

export function FactorAttributionTab({ transactions, valuations, filters, hasData }: TabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const timeSeriesData = useMemo(() => {
    if (!hasData) return [];
    return calculateRiskModelTimeSeries(transactions, valuations, filters);
  }, [transactions, valuations, filters, hasData]);
  
  const attributionData = useMemo(() => {
    if (!hasData) return [];
    return calculateAttributionByCategory(transactions, valuations, 'assetType');
  }, [transactions, valuations, hasData]);
  
  const toggleRow = (category: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (!hasData) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={PieChart}
          title="No Attribution Data"
          description="Add transactions and valuations to view factor attribution"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Chart - Multi-line cumulative returns */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <PieChart className="h-3.5 w-3.5" />
            Cumulative Attribution
          </span>
          <span className="text-[9px] text-muted-foreground">
            {filters.benchmark !== 'none' ? `vs ${filters.benchmark}` : 'Portfolio Only'}
          </span>
        </div>
        <div className="p-3">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name === 'cumulativePortfolio' ? 'Total Return' :
                    name === 'cumulativeBenchmark' ? 'Benchmark' : 'Active'
                  ]}
                />
                <Legend 
                  verticalAlign="top"
                  height={30}
                  formatter={(value) => (
                    <span className="text-[10px]">
                      {value === 'cumulativePortfolio' ? 'Total Return' :
                       value === 'cumulativeBenchmark' ? 'Benchmark' : 'Active'}
                    </span>
                  )}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativePortfolio" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                {filters.benchmark !== 'none' && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeBenchmark" 
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeActive" 
                      stroke="hsl(36, 95%, 50%)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Secondary Chart - Attribution Bars */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Attribution by Asset Type</span>
        </div>
        <div className="p-3">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={attributionData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                />
                <YAxis 
                  type="category"
                  dataKey="category"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  width={70}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name === 'exposure' ? 'Exposure' : name
                  ]}
                />
                <Bar dataKey="exposure" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Details Table with Expandable Rows */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Attribution Details</span>
        </div>
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 w-8"></TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8">Category</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Exposure %</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Benchmark %</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Active %</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Premium %</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Contribution %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributionData.map((row) => (
                <Collapsible key={row.category} open={expandedRows.has(row.category)}>
                  <TableRow 
                    className="hover:bg-muted/30 border-border cursor-pointer"
                    onClick={() => toggleRow(row.category)}
                  >
                    <TableCell className="py-2 w-8">
                      <CollapsibleTrigger asChild>
                        <button className="p-0.5">
                          {expandedRows.has(row.category) 
                            ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          }
                        </button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="text-xs font-medium py-2">{row.category}</TableCell>
                    <TableCell className="text-xs font-mono text-right py-2 tabular-nums">
                      {row.exposure.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right py-2 tabular-nums text-muted-foreground">
                      {row.benchmarkExposure.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs font-mono text-right py-2 tabular-nums",
                      row.activeExposure >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {row.activeExposure >= 0 ? '+' : ''}{row.activeExposure.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs font-mono text-right py-2 tabular-nums",
                      row.premium >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {row.premium >= 0 ? '+' : ''}{row.premium.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs font-mono text-right py-2 tabular-nums",
                      row.contribution >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {row.contribution >= 0 ? '+' : ''}{row.contribution.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/10 border-border">
                      <TableCell colSpan={7} className="py-2 px-6">
                        <div className="text-[10px] text-muted-foreground">
                          Detailed breakdown for {row.category} - No sub-categories available
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
