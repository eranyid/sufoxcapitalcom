import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Position, ASSET_TYPE_LABELS, AssetType } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TargetComparisonChartProps {
  positions: Position[];
  title?: string;
}

// Default target allocation (can be customized)
const DEFAULT_TARGETS: Record<AssetType, number> = {
  equity: 50,
  fixed_income: 25,
  real_estate: 10,
  commodities: 5,
  alternatives: 5,
  cash: 5,
  crypto: 0,
};

// Professional colors
const DEVIATION_COLORS = {
  over: '#FD625E',
  under: '#2A7AB9',
  neutral: '#01B8AA',
};

export function TargetComparisonChart({ positions, title = 'Target vs Actual' }: TargetComparisonChartProps) {
  const [hoveredAsset, setHoveredAsset] = useState<AssetType | null>(null);

  const comparisonData = useMemo(() => {
    // Calculate actual allocations by asset type
    const actualMap: Record<AssetType, number> = {
      equity: 0,
      fixed_income: 0,
      real_estate: 0,
      commodities: 0,
      alternatives: 0,
      cash: 0,
      crypto: 0,
    };

    positions.forEach(pos => {
      actualMap[pos.assetType] += pos.allocation;
    });

    // Create comparison data
    return Object.entries(DEFAULT_TARGETS)
      .map(([type, target]) => {
        const assetType = type as AssetType;
        const actual = actualMap[assetType];
        const deviation = actual - target;
        const deviationPercent = target > 0 ? (deviation / target) * 100 : (actual > 0 ? 100 : 0);
        
        return {
          assetType,
          label: ASSET_TYPE_LABELS[assetType],
          target,
          actual,
          deviation,
          deviationPercent,
          status: Math.abs(deviation) < 2 ? 'neutral' : deviation > 0 ? 'over' : 'under',
        };
      })
      .filter(d => d.target > 0 || d.actual > 0)
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
  }, [positions]);

  const totalDeviation = comparisonData.reduce((sum, d) => sum + Math.abs(d.deviation), 0);
  const maxValue = Math.max(...comparisonData.flatMap(d => [d.target, d.actual]), 1);

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target size={14} className="text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Add positions to compare with targets</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            {title}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "font-mono text-xs",
              totalDeviation < 10 ? "text-green-500 border-green-500/30" :
              totalDeviation < 20 ? "text-amber-500 border-amber-500/30" :
              "text-red-500 border-red-500/30"
            )}
          >
            Drift: {totalDeviation.toFixed(1)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Bullet Chart Comparison */}
        <div className="space-y-3">
          {comparisonData.map((data) => {
            const isHovered = hoveredAsset === data.assetType;
            const targetWidth = (data.target / maxValue) * 100;
            const actualWidth = (data.actual / maxValue) * 100;
            
            return (
              <div 
                key={data.assetType}
                className={cn(
                  "relative p-2 rounded-lg transition-all duration-200",
                  isHovered && "bg-muted/30"
                )}
                onMouseEnter={() => setHoveredAsset(data.assetType)}
                onMouseLeave={() => setHoveredAsset(null)}
              >
                {/* Label row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{data.label}</span>
                    {data.status === 'over' && <TrendingUp size={12} className="text-red-500" />}
                    {data.status === 'under' && <TrendingDown size={12} className="text-blue-500" />}
                    {data.status === 'neutral' && <Minus size={12} className="text-green-500" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Target: <span className="font-mono">{data.target}%</span>
                    </span>
                    <span className="font-medium">
                      Actual: <span className="font-mono">{data.actual.toFixed(1)}%</span>
                    </span>
                  </div>
                </div>

                {/* Bullet chart */}
                <div className="relative h-6 bg-muted/20 rounded overflow-hidden">
                  {/* Target zone (background) */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-muted/40"
                    style={{ width: `${targetWidth}%` }}
                  />
                  
                  {/* Target marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/60"
                    style={{ left: `${targetWidth}%` }}
                  />
                  
                  {/* Actual bar */}
                  <div 
                    className={cn(
                      "absolute top-1 bottom-1 left-0 rounded-sm transition-all duration-500",
                      data.status === 'over' && "bg-gradient-to-r from-red-500/80 to-red-400/80",
                      data.status === 'under' && "bg-gradient-to-r from-blue-500/80 to-blue-400/80",
                      data.status === 'neutral' && "bg-gradient-to-r from-green-500/80 to-green-400/80"
                    )}
                    style={{ width: `${actualWidth}%` }}
                  />

                  {/* Deviation indicator */}
                  {Math.abs(data.deviation) >= 2 && (
                    <div 
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold px-1 rounded",
                        data.deviation > 0 ? "text-red-400" : "text-blue-400"
                      )}
                      style={{ 
                        left: `${Math.max(actualWidth, targetWidth) + 2}%`,
                      }}
                    >
                      {data.deviation > 0 ? '+' : ''}{data.deviation.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted/40 rounded-sm border border-foreground/30" />
            <span className="text-[10px] text-muted-foreground">Target Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-3 bg-foreground/60" />
            <span className="text-[10px] text-muted-foreground">Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-gradient-to-r from-primary/80 to-primary/60 rounded-sm" />
            <span className="text-[10px] text-muted-foreground">Actual</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Over-allocated</p>
            <p className="text-lg font-mono font-bold text-red-500">
              {comparisonData.filter(d => d.status === 'over').length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">On Target</p>
            <p className="text-lg font-mono font-bold text-green-500">
              {comparisonData.filter(d => d.status === 'neutral').length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Under-allocated</p>
            <p className="text-lg font-mono font-bold text-blue-500">
              {comparisonData.filter(d => d.status === 'under').length}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Comparing against strategic target allocation • Tolerance: ±2%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
