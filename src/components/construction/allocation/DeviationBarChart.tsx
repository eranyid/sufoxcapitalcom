import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from 'recharts';
import { AllocationTarget } from '@/types/allocationBuilder';

interface DeviationBarChartProps {
  targets: AllocationTarget[];
  title?: string;
}

export function DeviationBarChart({ targets, title = "Target vs Actual" }: DeviationBarChartProps) {
  const chartData = targets.map(target => ({
    name: target.label.length > 12 ? target.label.slice(0, 12) + '...' : target.label,
    fullName: target.label,
    deviation: target.deviation,
    actual: target.actualAllocation,
    target: target.targetAllocation,
    fill: target.deviation >= 0 ? 'hsl(160, 70%, 45%)' : 'hsl(0, 70%, 50%)',
  }));

  if (targets.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No targets set</p>
        </CardContent>
      </Card>
    );
  }

  const maxDeviation = Math.max(...targets.map(t => Math.abs(t.deviation)));
  const domain = [-maxDeviation - 5, maxDeviation + 5];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          <Badge variant="outline" className="text-xs">
            Deviation from Target
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={domain}
                tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={75}
              />
              <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-sm">{data.fullName}</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Target: <span className="font-mono">{data.target.toFixed(1)}%</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Actual: <span className="font-mono">{data.actual.toFixed(1)}%</span>
                          </p>
                        </div>
                        <p className={`text-xs font-mono mt-1 ${data.deviation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {data.deviation >= 0 ? '+' : ''}{data.deviation.toFixed(1)}% deviation
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="deviation" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
