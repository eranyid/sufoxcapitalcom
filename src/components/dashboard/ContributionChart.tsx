import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ContributionToReturn } from '@/types/investment';

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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
              <CartesianGrid strokeDasharray="1 3" stroke="#1F1F1F" />
              <XAxis 
                type="number"
                tick={{ fill: '#D0D0D0', fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                axisLine={{ stroke: '#1E1E1E' }}
              />
              <YAxis 
                type="category"
                dataKey="ticker"
                tick={{ fill: '#D0D0D0', fontSize: 10 }}
                width={45}
                axisLine={{ stroke: '#1E1E1E' }}
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Contribution']}
              />
              <Bar dataKey="contribution" radius={[0, 0, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.contribution >= 0 ? '#00FF00' : '#FF4D4D'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}