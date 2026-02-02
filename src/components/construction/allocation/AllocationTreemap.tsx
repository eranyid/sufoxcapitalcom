import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Position, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, AssetType } from '@/types/allocationBuilder';
import { groupPositionsBy } from '@/lib/allocationAnalytics';

interface AllocationTreemapProps {
  positions: Position[];
}

interface TreemapNode {
  name: string;
  size?: number;
  fill?: string;
  children?: TreemapNode[];
}

export function AllocationTreemap({ positions }: AllocationTreemapProps) {
  const assetGroups = groupPositionsBy(positions, 'assetType');
  
  // Build hierarchical data for treemap
  const treeData: TreemapNode[] = assetGroups.map(group => ({
    name: group.label,
    fill: ASSET_TYPE_COLORS[group.key as AssetType],
    children: group.positions.map(pos => ({
      name: pos.name,
      size: pos.allocation,
      fill: ASSET_TYPE_COLORS[pos.assetType],
    })),
  }));

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Allocation Treemap</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, fill, size } = props;
    
    if (width < 40 || height < 30) {
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            stroke="hsl(var(--background))"
            strokeWidth={2}
            rx={2}
          />
        </g>
      );
    }

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="hsl(var(--background))"
          strokeWidth={2}
          rx={2}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 6}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          fontWeight={500}
        >
          {name?.length > 12 ? name.slice(0, 12) + '...' : name}
        </text>
        {size && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill="white"
            fontSize={9}
            opacity={0.8}
          >
            {size.toFixed(1)}%
          </text>
        )}
      </g>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Allocation Treemap
          <Badge variant="outline" className="text-xs">
            Grouped by Asset Type
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treeData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="hsl(var(--background))"
              content={<CustomContent />}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-sm">{data.name}</p>
                        {data.size && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {data.size.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
