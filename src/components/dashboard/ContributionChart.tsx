import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ContributionToReturn } from '@/types/investment';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingUp } from 'lucide-react';

interface ContributionChartProps {
  data: ContributionToReturn[];
}

export function ContributionChart({ data }: ContributionChartProps) {
  const chartData = data.slice(0, 10);

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Contribution to Returns</span>
      </div>
      <div className="p-3">
        {chartData.length === 0 ? (
          <EmptyState 
            icon={TrendingUp}
            title="No Contribution Data"
            description="Add transactions and valuations to see return contributions"
          />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <YAxis 
                  type="category"
                  dataKey="ticker"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={45}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Contribution']}
                />
                <Bar dataKey="contribution" radius={[0, 2, 2, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.contribution >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}