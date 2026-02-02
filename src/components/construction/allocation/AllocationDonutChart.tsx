import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Position, AllocationGroup, LiquidityBucket, AssetType, Region, ASSET_TYPE_LABELS, REGION_LABELS, LIQUIDITY_LABELS } from '@/types/allocationBuilder';
import { groupPositionsBy } from '@/lib/allocationAnalytics';
import { cn } from '@/lib/utils';

interface AllocationDonutChartProps {
  positions: Position[];
  groupBy: 'assetType' | 'region' | 'sector' | 'currency' | 'liquidityBucket';
  title: string;
}

// Professional FT-style color palette
const PROFESSIONAL_PALETTE = [
  '#2A7AB9', // Blue
  '#01B8AA', // Teal
  '#F2C811', // Yellow
  '#FD625E', // Coral
  '#9B59B6', // Purple
  '#E67E22', // Orange
  '#27AE60', // Green
  '#95A5A6', // Gray
  '#3498DB', // Light Blue
  '#E74C3C', // Red
];

const getColorForGroup = (key: string, groupBy: AllocationDonutChartProps['groupBy'], index: number): string => {
  // Use consistent colors from palette
  return PROFESSIONAL_PALETTE[index % PROFESSIONAL_PALETTE.length];
};

export function AllocationDonutChart({ positions, groupBy, title }: AllocationDonutChartProps) {
  const groups = groupPositionsBy(positions, groupBy);
  
  const chartData = groups.map((group, index) => ({
    name: group.label,
    value: group.allocation,
    count: group.count,
    fill: getColorForGroup(group.key, groupBy, index),
  })).sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate arc positions for donut
  let cumulativeAngle = -90; // Start from top
  const arcs = chartData.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...item, startAngle, endAngle: cumulativeAngle, angle };
  });

  // Create SVG arc path
  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 100 + outerRadius * Math.cos(startRad);
    const y1 = 100 + outerRadius * Math.sin(startRad);
    const x2 = 100 + outerRadius * Math.cos(endRad);
    const y2 = 100 + outerRadius * Math.sin(endRad);
    const x3 = 100 + innerRadius * Math.cos(endRad);
    const y3 = 100 + innerRadius * Math.sin(endRad);
    const x4 = 100 + innerRadius * Math.cos(startRad);
    const y4 = 100 + innerRadius * Math.sin(startRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Part-to-whole • Proportional breakdown
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono bg-muted/30">
            {groups.length} GROUPS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          {/* Donut Chart - SVG */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {arcs.map((arc, index) => (
                <path
                  key={index}
                  d={createArcPath(arc.startAngle, arc.endAngle - 0.5, 45, 75)}
                  fill={arc.fill}
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                  stroke="hsl(var(--card))"
                  strokeWidth="2"
                />
              ))}
              {/* Center text */}
              <text x="100" y="95" textAnchor="middle" className="fill-foreground text-2xl font-bold">
                {total.toFixed(0)}%
              </text>
              <text x="100" y="115" textAnchor="middle" className="fill-muted-foreground text-xs">
                Total
              </text>
            </svg>
          </div>

          {/* Legend - Proportional Stacked Bar Style */}
          <div className="flex-1 space-y-1.5">
            {chartData.slice(0, 6).map((item, index) => (
              <div key={index} className="group flex items-center gap-2">
                {/* Color block */}
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                
                {/* Label and bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium truncate group-hover:text-foreground transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground tabular-nums">
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Mini proportional bar */}
                  <div className="h-1 w-full bg-muted/30 rounded-full mt-0.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.value / Math.max(...chartData.map(d => d.value))) * 100}%`,
                        backgroundColor: item.fill 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {chartData.length > 6 && (
              <div className="text-[10px] text-muted-foreground pt-1">
                +{chartData.length - 6} more groups
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
