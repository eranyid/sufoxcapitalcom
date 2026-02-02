import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Position, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, AssetType } from '@/types/allocationBuilder';
import { groupPositionsBy, generateSankeyData } from '@/lib/allocationAnalytics';

interface AllocationSankeyProps {
  positions: Position[];
}

// Simple Sankey-like visualization using CSS
export function AllocationSankey({ positions }: AllocationSankeyProps) {
  const assetGroups = groupPositionsBy(positions, 'assetType');
  const sectorGroups = groupPositionsBy(positions, 'sector');
  
  // Calculate flows from asset type to sector
  const flows = useMemo(() => {
    const result: { from: string; to: string; value: number; fromColor: string }[] = [];
    
    for (const position of positions) {
      const existing = result.find(f => f.from === position.assetType && f.to === position.sector);
      if (existing) {
        existing.value += position.allocation;
      } else {
        result.push({
          from: position.assetType,
          to: position.sector,
          value: position.allocation,
          fromColor: ASSET_TYPE_COLORS[position.assetType],
        });
      }
    }
    
    return result.sort((a, b) => b.value - a.value);
  }, [positions]);

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Allocation Flow</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  const totalAllocation = positions.reduce((sum, p) => sum + p.allocation, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Allocation Flow
          <Badge variant="outline" className="text-xs">
            Asset Type → Sector
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          {/* Left column: Asset Types */}
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Asset Type</p>
            {assetGroups.map(group => (
              <div 
                key={group.key}
                className="flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-muted/30"
              >
                <div 
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: ASSET_TYPE_COLORS[group.key as AssetType] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{group.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{group.allocation.toFixed(1)}%</p>
                </div>
                <div 
                  className="h-1 rounded-full"
                  style={{ 
                    width: `${(group.allocation / totalAllocation) * 100}%`,
                    minWidth: '4px',
                    maxWidth: '60px',
                    backgroundColor: ASSET_TYPE_COLORS[group.key as AssetType],
                    opacity: 0.5,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Center: Flow lines (simplified) */}
          <div className="w-16 flex items-center justify-center">
            <svg width="60" height={Math.max(assetGroups.length, sectorGroups.length) * 44 + 30} className="overflow-visible">
              {flows.slice(0, 8).map((flow, i) => {
                const fromIndex = assetGroups.findIndex(g => g.key === flow.from);
                const toIndex = sectorGroups.findIndex(g => g.key === flow.to);
                const y1 = fromIndex * 44 + 30;
                const y2 = toIndex * 44 + 30;
                const opacity = Math.min(0.8, (flow.value / totalAllocation) * 3);
                
                return (
                  <path
                    key={i}
                    d={`M 0 ${y1} C 30 ${y1}, 30 ${y2}, 60 ${y2}`}
                    fill="none"
                    stroke={flow.fromColor}
                    strokeWidth={Math.max(1, (flow.value / totalAllocation) * 8)}
                    opacity={opacity}
                  />
                );
              })}
            </svg>
          </div>

          {/* Right column: Sectors */}
          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Sector</p>
            {sectorGroups.slice(0, 8).map((group, i) => {
              const hue = (group.key.charCodeAt(0) * 20) % 360;
              const color = `hsl(${hue}, 60%, 50%)`;
              
              return (
                <div 
                  key={group.key}
                  className="flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-muted/30"
                >
                  <div 
                    className="h-1 rounded-full"
                    style={{ 
                      width: `${(group.allocation / totalAllocation) * 100}%`,
                      minWidth: '4px',
                      maxWidth: '60px',
                      backgroundColor: color,
                      opacity: 0.5,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{group.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{group.allocation.toFixed(1)}%</p>
                  </div>
                  <div 
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              );
            })}
            {sectorGroups.length > 8 && (
              <p className="text-xs text-muted-foreground text-center">+{sectorGroups.length - 8} more</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
