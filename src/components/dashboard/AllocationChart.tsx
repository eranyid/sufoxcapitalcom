import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Allocation } from '@/types/investment';

interface AllocationChartProps {
  data: Allocation[];
  title: string;
}

const COLORS = [
  '#00FFFF',
  '#F4D03F',
  '#00FF00',
  '#FF4D4D',
  '#D0D0D0',
  '#6B7280',
  '#9CA3AF',
];

export function AllocationChart({ data, title }: AllocationChartProps) {
  if (data.length === 0) {
    return (
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">{title}</span>
        </div>
        <div className="p-3">
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs">
            No data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">{title}</span>
      </div>
      <div className="p-3 flex">
        <div className="h-[200px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={1}
                dataKey="percentage"
                nameKey="name"
                stroke="#000000"
                strokeWidth={1}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#121212', 
                  border: '1px solid #1E1E1E',
                  borderRadius: '0',
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Mono'
                }}
                labelStyle={{ color: '#00FFFF' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend as list */}
        <div className="w-32 flex flex-col justify-center gap-1">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-[10px]">
              <div 
                className="w-2 h-2 flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate flex-1">{item.name}</span>
              <span className="font-mono text-foreground">{item.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}