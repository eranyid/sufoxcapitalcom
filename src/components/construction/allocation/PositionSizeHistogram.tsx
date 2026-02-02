import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Position } from '@/types/allocationBuilder';
import { getPositionSizeDistribution } from '@/lib/allocationAnalytics';

interface PositionSizeHistogramProps {
  positions: Position[];
}

export function PositionSizeHistogram({ positions }: PositionSizeHistogramProps) {
  const distribution = getPositionSizeDistribution(positions);
  
  const chartData = distribution.map(d => ({
    ...d,
    fill: d.count > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
  }));

  const totalPositions = positions.length;

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Position Size Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Position Size Distribution
          <Badge variant="outline" className="text-xs font-mono">
            {totalPositions} positions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-sm">{data.range}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} position{data.count !== 1 ? 's' : ''} 
                          {totalPositions > 0 && ` (${((data.count / totalPositions) * 100).toFixed(0)}%)`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} opacity={entry.count > 0 ? 1 : 0.3} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
