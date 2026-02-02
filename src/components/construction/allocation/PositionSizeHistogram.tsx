import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Position } from '@/types/allocationBuilder';
import { getPositionSizeDistribution } from '@/lib/allocationAnalytics';
import { cn } from '@/lib/utils';

interface PositionSizeHistogramProps {
  positions: Position[];
}

// Professional FT color
const HISTOGRAM_COLOR = '#FD625E'; // Coral/Red - typical for distribution charts

export function PositionSizeHistogram({ positions }: PositionSizeHistogramProps) {
  const distribution = getPositionSizeDistribution(positions);
  const maxCount = Math.max(...distribution.map(d => d.count), 1);
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
      <CardHeader className="pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Position Size Distribution</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Histogram • Shows allocation frequency by size bucket
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono bg-muted/30">
            {totalPositions} POS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Histogram bars - vertical column chart */}
        <div className="flex items-end gap-1 h-32 mb-2">
          {distribution.map((bucket, index) => {
            const heightPercent = bucket.count > 0 ? (bucket.count / maxCount) * 100 : 0;
            const isEmpty = bucket.count === 0;
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center group"
              >
                {/* Count label on top */}
                {bucket.count > 0 && (
                  <span className="text-[9px] font-mono font-bold text-muted-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bucket.count}
                  </span>
                )}
                
                {/* Bar */}
                <div 
                  className="w-full relative transition-all duration-500 group-hover:opacity-80"
                  style={{ 
                    height: `${Math.max(heightPercent, isEmpty ? 0 : 8)}%`,
                    minHeight: bucket.count > 0 ? '8px' : '0'
                  }}
                >
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-t transition-all",
                      isEmpty ? "bg-muted/20" : ""
                    )}
                    style={{ 
                      backgroundColor: isEmpty ? undefined : HISTOGRAM_COLOR,
                      opacity: isEmpty ? 0.3 : 0.9
                    }}
                  />
                  
                  {/* Hover tooltip */}
                  {bucket.count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <span className="text-[10px] font-medium">{bucket.count} position{bucket.count !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-1 border-t border-border/30 pt-2">
          {distribution.map((bucket, index) => (
            <div key={index} className="flex-1 text-center">
              <span className="text-[8px] text-muted-foreground font-mono leading-none">
                {bucket.range.replace('%', '').replace('-', '–')}
              </span>
            </div>
          ))}
        </div>
        
        {/* Axis label */}
        <div className="text-center mt-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            Allocation Range (%)
          </span>
        </div>

        {/* Summary stats */}
        <div className="mt-4 pt-3 border-t border-border/30 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-foreground">
              {(positions.reduce((sum, p) => sum + p.allocation, 0) / positions.length || 0).toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">Avg Size</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-foreground">
              {Math.min(...positions.map(p => p.allocation)).toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">Min</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-foreground">
              {Math.max(...positions.map(p => p.allocation)).toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">Max</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
