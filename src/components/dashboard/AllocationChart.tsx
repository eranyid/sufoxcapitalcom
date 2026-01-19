import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Allocation } from '@/types/investment';
import { EmptyState } from '@/components/ui/empty-state';
import { PieChartIcon } from 'lucide-react';

interface AllocationChartProps {
  data: Allocation[];
  title: string;
}

const COLORS = [
  'hsl(var(--chart-gold))',
  'hsl(var(--chart-blue))',
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  'hsl(var(--chart-white))',
  'hsl(var(--warning))',
  'hsl(var(--muted-foreground))',
];

export function AllocationChart({ data, title }: AllocationChartProps) {
  if (data.length === 0) {
    return (
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">{title}</span>
        </div>
        <EmptyState 
          icon={PieChartIcon}
          title="No Allocation Data"
          description="Add transactions to see portfolio allocation"
        />
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
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono'
                }}
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
