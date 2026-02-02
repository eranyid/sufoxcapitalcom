import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Position, ASSET_TYPE_LABELS, AssetType } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';

interface ExposureBarChartProps {
  positions: Position[];
  maxBars?: number;
}

// Professional FT-style color palette
const FT_COLORS = {
  primary: '#2A7AB9',      // Blue
  secondary: '#01B8AA',    // Teal
  tertiary: '#F2C811',     // Yellow
  quaternary: '#FD625E',   // Coral
  neutral: '#7F8FA4',
};

const ASSET_COLORS: Record<AssetType, string> = {
  equity: '#2A7AB9',
  fixed_income: '#01B8AA',
  real_estate: '#9B59B6',
  commodities: '#F2C811',
  alternatives: '#FD625E',
  cash: '#7F8FA4',
  crypto: '#E67E22',
};

export function ExposureBarChart({ positions, maxBars = 10 }: ExposureBarChartProps) {
  // Sort positions by allocation and take top N
  const sortedPositions = [...positions]
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, maxBars);

  const maxAllocation = Math.max(...sortedPositions.map(p => p.allocation), 1);

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
      <CardHeader className="pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Largest Exposures</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Ranked horizontal bar • Top {Math.min(maxBars, positions.length)} positions
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono bg-muted/30">
            FT-STYLE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Lollipop Chart - Professional FT Style */}
        <div className="space-y-2.5">
          {sortedPositions.map((position, index) => {
            const widthPercent = (position.allocation / maxAllocation) * 100;
            const color = ASSET_COLORS[position.assetType];
            
            return (
              <div key={position.id} className="group">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span className="text-[10px] font-mono text-muted-foreground w-4 text-right">
                    {index + 1}
                  </span>
                  
                  {/* Label */}
                  <div className="w-28 min-w-28 text-right pr-2">
                    <span className="text-xs font-medium truncate block group-hover:text-foreground transition-colors">
                      {position.name.length > 14 ? position.name.slice(0, 14) + '…' : position.name}
                    </span>
                  </div>
                  
                  {/* Bar + Lollipop */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-6 relative">
                      {/* Background track */}
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                        <div className="h-px w-full bg-border/50" />
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="absolute inset-y-0 left-0 flex items-center transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      >
                        <div 
                          className="h-2 w-full rounded-r-sm opacity-80 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      
                      {/* Lollipop dot */}
                      <div 
                        className="absolute inset-y-0 flex items-center transition-all duration-500"
                        style={{ left: `${widthPercent}%`, transform: 'translateX(-50%)' }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm ring-2 ring-background transition-transform group-hover:scale-125"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                    
                    {/* Value */}
                    <span className={cn(
                      "font-mono text-xs font-bold w-12 text-right tabular-nums",
                      position.allocation >= 15 ? "text-amber-400" : "text-foreground"
                    )}>
                      {position.allocation.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis reference */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>0%</span>
            <span>{(maxAllocation / 4).toFixed(0)}%</span>
            <span>{(maxAllocation / 2).toFixed(0)}%</span>
            <span>{((maxAllocation * 3) / 4).toFixed(0)}%</span>
            <span>{maxAllocation.toFixed(0)}%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from(new Set(sortedPositions.map(p => p.assetType))).map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: ASSET_COLORS[type] }}
              />
              <span className="text-[9px] text-muted-foreground">
                {ASSET_TYPE_LABELS[type]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
