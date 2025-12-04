import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  color = "hsl(var(--chart-blue))",
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
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">{title}</span>
      </div>
      <div className="p-3">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
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
                formatter={(value: number) => [`${value.toFixed(2)}%`]}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                formatter={(value) => <span className="text-muted-foreground">{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="hsl(var(--chart-blue))"
                strokeWidth={1.5}
                dot={false}
                name="Monthly"
              />
              {showCumulative && (
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="hsl(var(--chart-gold))"
                  strokeWidth={1.5}
                  dot={false}
                  name="Cumulative"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
