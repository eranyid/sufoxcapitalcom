import { FactorRiskBreakdown } from '@/lib/factorModel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FactorRiskChartProps {
  riskBreakdown: FactorRiskBreakdown[];
  specificPct: number;
}

export function FactorRiskChart({ riskBreakdown, specificPct }: FactorRiskChartProps) {
  // Filter to top factors with meaningful contribution
  const significantFactors = riskBreakdown
    .filter(r => Math.abs(r.contributionPct) > 0.5)
    .slice(0, 10);

  // Add specific risk as a bar
  const data = [
    ...significantFactors.map(r => ({
      name: r.factorLabel,
      value: r.contributionPct,
      isSpecific: false
    })),
    {
      name: 'Specific Risk',
      value: specificPct,
      isSpecific: true
    }
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const getBarColor = (value: number, isSpecific: boolean): string => {
    if (isSpecific) return 'hsl(var(--muted-foreground))';
    if (value > 10) return 'hsl(var(--primary))';
    if (value > 5) return 'hsl(var(--warning))';
    if (value > 0) return 'hsl(var(--chart-blue))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Factor Risk Contribution</span>
        <span className="text-[9px] text-muted-foreground ml-auto">
          % of Total Variance
        </span>
      </div>
      <div className="p-3">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={75}
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
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Contribution']}
              />
              <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.value, entry.isSpecific)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            <span className="text-muted-foreground">&gt;10% Major</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: 'hsl(var(--warning))' }} />
            <span className="text-muted-foreground">5-10% Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: 'hsl(var(--chart-blue))' }} />
            <span className="text-muted-foreground">&lt;5% Minor</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: 'hsl(var(--muted-foreground))' }} />
            <span className="text-muted-foreground">Specific</span>
          </div>
        </div>
      </div>
    </div>
  );
}
