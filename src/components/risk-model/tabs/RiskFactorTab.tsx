/**
 * Risk Factor Tab - Factor exposures and sensitivities
 */

import { useMemo } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters, calculateRiskExposures } from '@/lib/riskModelData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { Layers } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

export function RiskFactorTab({ transactions, valuations, filters, hasData }: TabProps) {
  const factorData = useMemo(() => {
    if (!hasData) return [];
    return calculateRiskExposures(transactions, valuations);
  }, [transactions, valuations, hasData]);

  if (!hasData) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={Layers}
          title="No Factor Data"
          description="Add transactions and valuations to view factor analysis"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Chart - Factor Exposures */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" />
            Factor Exposures (Beta)
          </span>
          <span className="text-[9px] text-muted-foreground">Portfolio Sensitivity to Risk Factors</span>
        </div>
        <div className="p-3">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={factorData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <YAxis 
                  type="category"
                  dataKey="factor"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={70}
                />
                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => [value.toFixed(3), 'Beta']}
                />
                <Bar dataKey="portfolio" radius={[0, 4, 4, 0]}>
                  {factorData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.portfolio >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Details Table */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Factor Details</span>
        </div>
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8">Factor</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Portfolio</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Benchmark</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Active</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Contribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factorData.map((row) => (
                <TableRow key={row.factor} className="hover:bg-muted/30 border-border">
                  <TableCell className="text-xs font-medium py-2">{row.factor}</TableCell>
                  <TableCell className={cn(
                    "text-xs font-mono text-right py-2 tabular-nums",
                    row.portfolio >= 0 ? 'text-foreground' : 'text-destructive'
                  )}>
                    {row.portfolio.toFixed(3)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right py-2 tabular-nums text-muted-foreground">
                    {row.benchmark.toFixed(3)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-xs font-mono text-right py-2 tabular-nums",
                    row.active >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {row.active >= 0 ? '+' : ''}{row.active.toFixed(3)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right py-2 tabular-nums">
                    {row.contribution.toFixed(2)}%
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
