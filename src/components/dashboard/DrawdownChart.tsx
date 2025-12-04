import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
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
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
              />
              <Area 
                type="monotone" 
                dataKey="drawdown" 
                stroke="#FF4D4D"
                fill="rgba(255, 77, 77, 0.2)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}