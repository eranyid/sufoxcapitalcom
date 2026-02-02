import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Position, AllocationGroup, ASSET_TYPE_COLORS, REGION_COLORS, LIQUIDITY_COLORS, LiquidityBucket, AssetType, Region } from '@/types/allocationBuilder';
import { groupPositionsBy } from '@/lib/allocationAnalytics';

interface AllocationDonutChartProps {
  positions: Position[];
  groupBy: 'assetType' | 'region' | 'sector' | 'currency' | 'liquidityBucket';
  title: string;
}

const getColorForGroup = (key: string, groupBy: AllocationDonutChartProps['groupBy']): string => {
  switch (groupBy) {
    case 'assetType':
      return ASSET_TYPE_COLORS[key as AssetType] || 'hsl(var(--muted))';
    case 'region':
      return REGION_COLORS[key as Region] || 'hsl(var(--muted))';
    case 'liquidityBucket':
      return LIQUIDITY_COLORS[key as LiquidityBucket] || 'hsl(var(--muted))';
    default:
      // Generate consistent colors for sectors/currencies
      const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = hash % 360;
      return `hsl(${hue}, 60%, 50%)`;
  }
};

export function AllocationDonutChart({ positions, groupBy, title }: AllocationDonutChartProps) {
  const groups = groupPositionsBy(positions, groupBy);
  
  const chartData = groups.map(group => ({
    name: group.label,
    value: group.allocation,
    count: group.count,
    fill: getColorForGroup(group.key, groupBy),
  }));

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          <Badge variant="outline" className="text-xs font-mono">
            {groups.length} groups
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.value.toFixed(1)}% • {data.count} position{data.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                formatter={(value, entry: any) => (
                  <span className="text-xs text-muted-foreground">
                    {value} ({entry.payload.value.toFixed(1)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
