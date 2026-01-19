import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingDown } from 'lucide-react';

interface DrawdownChartProps {
  data: { month: string; drawdown: number }[];
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Drawdown Analysis</span>
      </div>
      <div className="p-3">
        {data.length === 0 ? (
          <EmptyState 
            icon={TrendingDown}
            title="No Drawdown Data"
            description="Performance data is required to calculate drawdowns"
          />
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={35}
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
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive) / 0.2)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}