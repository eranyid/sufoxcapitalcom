import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceChartProps {
  data: { month: string; return: number }[];
  title?: string;
  dataKey?: string;
  color?: string;
  showCumulative?: boolean;
  cumulativeData?: { month: string; return: number }[];
}

export function PerformanceChart({ 
  data, 
  title = "Performance", 
  dataKey = "return",
  color = "hsl(var(--primary))",
  showCumulative = false,
  cumulativeData
}: PerformanceChartProps) {
  const chartData = showCumulative && cumulativeData 
    ? data.map((d, i) => ({
        ...d,
        cumulative: cumulativeData[i]?.return || 0
      }))
    : data;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color}
                strokeWidth={2}
                dot={false}
                name="Monthly Return"
              />
              {showCumulative && (
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="hsl(var(--chart-gold))"
                  strokeWidth={2}
                  dot={false}
                  name="Cumulative Return"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
