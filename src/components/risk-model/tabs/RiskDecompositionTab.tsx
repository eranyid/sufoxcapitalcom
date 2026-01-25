/**
 * Risk Decomposition Tab - Systematic vs Specific risk breakdown
 */

import { useMemo } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters } from '@/lib/riskModelData';
import { computeFactorModel } from '@/lib/factorModel';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { Layers, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

export function RiskDecompositionTab({ transactions, valuations, filters, hasData }: TabProps) {
  const factorModel = useMemo(() => {
    if (!hasData) return null;
    return computeFactorModel(transactions, valuations);
  }, [transactions, valuations, hasData]);

  if (!hasData || !factorModel) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={Layers}
          title="No Decomposition Data"
          description="Add more transactions and valuations (min 6 months) to decompose risk"
        />
      </div>
    );
  }

  const pieData = [
    { name: 'Systematic', value: factorModel.systematicPct, color: 'hsl(var(--primary))' },
    { name: 'Specific', value: factorModel.specificPct, color: 'hsl(36, 95%, 50%)' },
  ];
  
  const riskBreakdownData = factorModel.risk
    .filter(r => Math.abs(r.contributionPct) > 0.5)
    .slice(0, 8)
    .map(r => ({
      factor: r.factor,
      contribution: r.contributionPct,
    }));

  return (
    <div className="space-y-3">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Systematic Risk</div>
          <div className="text-xl font-mono tabular-nums text-primary mt-1">
            {factorModel.systematicPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Factor-Driven</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Specific Risk</div>
          <div className="text-xl font-mono tabular-nums mt-1" style={{ color: 'hsl(36, 95%, 50%)' }}>
            {factorModel.specificPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Idiosyncratic</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Residual Vol</div>
          <div className="text-xl font-mono tabular-nums text-foreground mt-1">
            {(factorModel.residualVolatility * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Unexplained</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Top Factor</div>
          <div className="text-lg font-mono tabular-nums text-foreground mt-1 truncate">
            {factorModel.risk[0]?.factor || '-'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {factorModel.risk[0]?.contributionPct.toFixed(1)}% contribution
          </div>
        </div>
      </div>
      
      {/* Pie Chart - Systematic vs Specific */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bloomberg-panel">
          <div className="bloomberg-header">
            <span className="bloomberg-header-title flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              Risk Decomposition
            </span>
          </div>
          <div className="p-3">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Variance']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-mono tabular-nums">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Factor Risk Contribution */}
        <div className="bloomberg-panel">
          <div className="bloomberg-header">
            <span className="bloomberg-header-title">Factor Risk Contribution</span>
          </div>
          <div className="p-3">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={riskBreakdownData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="factor"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    width={70}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Contribution']}
                  />
                  <Bar 
                    dataKey="contribution" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="bloomberg-panel">
        <div className="p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-muted-foreground">
            <strong className="text-foreground">Risk Decomposition:</strong> Systematic risk (R²) represents the portion of portfolio variance explained by factor exposures. 
            Specific (idiosyncratic) risk is the unexplained residual variance. A higher systematic % indicates the portfolio is more driven by market factors, 
            while higher specific risk suggests more stock-specific risk.
          </div>
        </div>
      </div>
    </div>
  );
}
