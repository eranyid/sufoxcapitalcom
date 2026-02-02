import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';
import { Position, ASSET_TYPE_COLORS, AssetType } from '@/types/allocationBuilder';
import { groupPositionsBy } from '@/lib/allocationAnalytics';

interface ExposureBarChartProps {
  positions: Position[];
  maxBars?: number;
}

export function ExposureBarChart({ positions, maxBars = 10 }: ExposureBarChartProps) {
  // Sort positions by allocation and take top N
  const sortedPositions = [...positions]
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, maxBars);

  const chartData = sortedPositions.map(pos => ({
    name: pos.name.length > 15 ? pos.name.slice(0, 15) + '...' : pos.name,
    fullName: pos.name,
    allocation: pos.allocation,
    assetType: pos.assetType,
    fill: ASSET_TYPE_COLORS[pos.assetType],
  }));

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Largest Exposures</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Largest Exposures
          <Badge variant="outline" className="text-xs font-mono">
            Top {Math.min(maxBars, positions.length)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={[0, 'auto']}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={75}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-sm">{data.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {data.allocation.toFixed(2)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="allocation" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList 
                  dataKey="allocation" 
                  position="right" 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
