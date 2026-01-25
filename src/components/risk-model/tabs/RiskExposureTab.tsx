/**
 * Risk Exposure Tab - Portfolio risk exposures by category
 */

import { useMemo } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters, calculateAttributionByCategory } from '@/lib/riskModelData';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(36, 95%, 50%)',
  'hsl(173, 80%, 40%)',
  'hsl(280, 65%, 60%)',
  'hsl(45, 93%, 47%)',
  'hsl(0, 72%, 51%)',
  'hsl(220, 70%, 50%)',
  'hsl(150, 60%, 45%)',
];

export function RiskExposureTab({ transactions, valuations, filters, hasData }: TabProps) {
  const assetTypeData = useMemo(() => {
    if (!hasData) return [];
    return calculateAttributionByCategory(transactions, valuations, 'assetType');
  }, [transactions, valuations, hasData]);
  
  const geographyData = useMemo(() => {
    if (!hasData) return [];
    return calculateAttributionByCategory(transactions, valuations, 'geography');
  }, [transactions, valuations, hasData]);
  
  const currencyData = useMemo(() => {
    if (!hasData) return [];
    return calculateAttributionByCategory(transactions, valuations, 'currency');
  }, [transactions, valuations, hasData]);

  if (!hasData) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={Target}
          title="No Exposure Data"
          description="Add transactions and valuations to view risk exposures"
        />
      </div>
    );
  }

  const renderPieChart = (data: typeof assetTypeData, title: string) => (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">{title}</span>
      </div>
      <div className="p-3">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="exposure"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  fontSize: '11px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Exposure']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center gap-1.5 text-[10px]">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground">{item.category}</span>
              <span className="font-mono tabular-nums">{item.exposure.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Pie Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderPieChart(assetTypeData, 'Asset Class Exposure')}
        {renderPieChart(geographyData, 'Geographic Exposure')}
        {renderPieChart(currencyData, 'Currency Exposure')}
      </div>
      
      {/* Stacked Bar Comparison */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Portfolio vs Benchmark Exposure</span>
        </div>
        <div className="p-3">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={assetTypeData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="category"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="exposure" name="Portfolio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="benchmarkExposure" name="Benchmark" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Detailed Exposure Table */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Exposure Details</span>
        </div>
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8">Category</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Portfolio %</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Benchmark %</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground h-8 text-right">Active %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetTypeData.map((row) => (
                <TableRow key={row.category} className="hover:bg-muted/30 border-border">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
