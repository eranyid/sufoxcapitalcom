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
              <CartesianGrid strokeDasharray="1 3" stroke="#1F1F1F" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#D0D0D0', fontSize: 9 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={{ stroke: '#1E1E1E' }}
              />
              <YAxis 
                tick={{ fill: '#D0D0D0', fontSize: 9 }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                axisLine={{ stroke: '#1E1E1E' }}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#121212', 
                  border: '1px solid #1E1E1E',
                  borderRadius: '0',
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Mono'
                }}
                labelStyle={{ color: '#00FFFF' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`]}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                formatter={(value) => <span style={{ color: '#D0D0D0' }}>{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="#00FF00"
                strokeWidth={1.5}
                dot={false}
                name="Monthly"
              />
              {showCumulative && (
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#00FFFF"
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