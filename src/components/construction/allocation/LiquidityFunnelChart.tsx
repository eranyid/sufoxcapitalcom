import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Position, LiquidityBucket, LIQUIDITY_LABELS } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';
import { Droplets, Clock, Lock } from 'lucide-react';

interface LiquidityFunnelChartProps {
  positions: Position[];
  title?: string;
}

// Ordered liquidity buckets from most to least liquid
const LIQUIDITY_ORDER: LiquidityBucket[] = [
  'highly_liquid',
  'liquid',
  'semi_liquid',
  'illiquid',
  'locked'
];

// Professional colors for funnel stages
const LIQUIDITY_COLORS: Record<LiquidityBucket, string> = {
  highly_liquid: '#01B8AA',
  liquid: '#2A7AB9',
  semi_liquid: '#F2C80F',
  illiquid: '#FD625E',
  locked: '#A66999',
};

// Icons for each stage
const LIQUIDITY_ICONS: Record<LiquidityBucket, React.ReactNode> = {
  highly_liquid: <Droplets size={12} />,
  liquid: <Droplets size={12} />,
  semi_liquid: <Clock size={12} />,
  illiquid: <Clock size={12} />,
  locked: <Lock size={12} />,
};

// Time descriptions
const LIQUIDITY_TIME: Record<LiquidityBucket, string> = {
  highly_liquid: 'T+0 to T+3',
  liquid: 'T+3 to T+30',
  semi_liquid: '30-90 days',
  illiquid: '90+ days',
  locked: 'Multi-year',
};

export function LiquidityFunnelChart({ positions, title = 'Liquidity Funnel' }: LiquidityFunnelChartProps) {
  const [hoveredBucket, setHoveredBucket] = useState<LiquidityBucket | null>(null);

  const funnelData = useMemo(() => {
    const bucketMap: Record<LiquidityBucket, { allocation: number; count: number; positions: string[] }> = {
      highly_liquid: { allocation: 0, count: 0, positions: [] },
      liquid: { allocation: 0, count: 0, positions: [] },
      semi_liquid: { allocation: 0, count: 0, positions: [] },
      illiquid: { allocation: 0, count: 0, positions: [] },
      locked: { allocation: 0, count: 0, positions: [] },
    };

    positions.forEach(pos => {
      bucketMap[pos.liquidityBucket].allocation += pos.allocation;
      bucketMap[pos.liquidityBucket].count += 1;
      bucketMap[pos.liquidityBucket].positions.push(pos.name);
    });

    return LIQUIDITY_ORDER.map(bucket => ({
      bucket,
      label: LIQUIDITY_LABELS[bucket],
      time: LIQUIDITY_TIME[bucket],
      color: LIQUIDITY_COLORS[bucket],
      icon: LIQUIDITY_ICONS[bucket],
      ...bucketMap[bucket],
    }));
  }, [positions]);

  // Calculate cumulative for funnel effect
  const totalAllocation = funnelData.reduce((sum, d) => sum + d.allocation, 0);
  const maxWidth = 100;

  // Calculate funnel widths - each level is proportionally smaller
  const funnelWidths = useMemo(() => {
    let cumulative = 0;
    return funnelData.map((data, idx) => {
      cumulative += data.allocation;
      // Width decreases as we go down (funnel effect)
      const baseWidth = maxWidth - (idx * 12);
      // Also factor in actual allocation
      const allocationFactor = data.allocation > 0 ? Math.max(0.3, data.allocation / Math.max(...funnelData.map(d => d.allocation), 1)) : 0.1;
      return {
        ...data,
        width: data.allocation > 0 ? baseWidth * allocationFactor : baseWidth * 0.1,
        cumulative,
      };
    });
  }, [funnelData]);

  // Weighted liquidity score (100 = fully liquid, 0 = fully locked)
  const liquidityScore = useMemo(() => {
    const weights: Record<LiquidityBucket, number> = {
      highly_liquid: 100,
      liquid: 75,
      semi_liquid: 50,
      illiquid: 25,
      locked: 0,
    };
    
    if (totalAllocation === 0) return 0;
    
    const weighted = funnelData.reduce((sum, d) => sum + (d.allocation * weights[d.bucket]), 0);
    return Math.round(weighted / totalAllocation);
  }, [funnelData, totalAllocation]);

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Droplets size={14} className="text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[360px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Add positions to see liquidity analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Droplets size={14} className="text-primary" />
            {title}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Score:</span>
            <span className={cn(
              "text-sm font-mono font-bold",
              liquidityScore >= 70 ? "text-green-500" :
              liquidityScore >= 40 ? "text-amber-500" : "text-red-500"
            )}>
              {liquidityScore}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Funnel Visualization */}
        <div className="relative py-4">
          {/* Funnel stages */}
          <div className="flex flex-col items-center gap-1">
            {funnelWidths.map((data, idx) => {
              const isHovered = hoveredBucket === data.bucket;
              const hasAllocation = data.allocation > 0;
              
              return (
                <div
                  key={data.bucket}
                  className="relative w-full flex justify-center"
                  onMouseEnter={() => setHoveredBucket(data.bucket)}
                  onMouseLeave={() => setHoveredBucket(null)}
                >
                  {/* Funnel segment */}
                  <div
                    className={cn(
                      "relative h-12 flex items-center justify-center transition-all duration-500 ease-out cursor-pointer",
                      isHovered && "scale-105 z-10"
                    )}
                    style={{
                      width: `${data.width}%`,
                      minWidth: '80px',
                      background: hasAllocation 
                        ? `linear-gradient(135deg, ${data.color}dd, ${data.color}99)`
                        : 'hsl(var(--muted) / 0.3)',
                      clipPath: idx === 0 
                        ? 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)'
                        : idx === funnelWidths.length - 1
                          ? 'polygon(5% 0, 95% 0, 50% 100%, 50% 100%)'
                          : 'polygon(5% 0, 95% 0, 90% 100%, 10% 100%)',
                      animationDelay: `${idx * 100}ms`,
                    }}
                  >
                    {/* Content inside segment */}
                    <div className="flex items-center gap-2 text-white drop-shadow-md">
                      <span className={cn(
                        "opacity-80 transition-opacity",
                        isHovered && "opacity-100"
                      )}>
                        {data.icon}
                      </span>
                      <span className="font-mono text-sm font-bold">
                        {data.allocation.toFixed(1)}%
                      </span>
                    </div>

                    {/* Glow effect on hover */}
                    {isHovered && hasAllocation && (
                      <div 
                        className="absolute inset-0 opacity-30 blur-md -z-10"
                        style={{ backgroundColor: data.color }}
                      />
                    )}
                  </div>

                  {/* Side label */}
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-60"
                  )}>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: data.color }}
                    />
                    <span className="text-xs font-medium whitespace-nowrap">
                      {data.label.split(' ')[0]}
                    </span>
                  </div>

                  {/* Right side info */}
                  <div className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 text-right transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-40"
                  )}>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {data.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flow arrows */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col justify-around pointer-events-none opacity-20">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="text-muted-foreground animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                ↓
              </div>
            ))}
          </div>
        </div>

        {/* Hover detail panel */}
        {hoveredBucket && (
          <div 
            className="mt-2 p-3 rounded-lg border border-border/50 animate-fade-in"
            style={{ 
              backgroundColor: `${LIQUIDITY_COLORS[hoveredBucket]}10`,
              borderColor: `${LIQUIDITY_COLORS[hoveredBucket]}30`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{LIQUIDITY_LABELS[hoveredBucket]}</span>
              <span className="text-xs text-muted-foreground">{LIQUIDITY_TIME[hoveredBucket]}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {funnelData.find(d => d.bucket === hoveredBucket)?.positions.slice(0, 3).join(', ') || 'No positions'}
              {(funnelData.find(d => d.bucket === hoveredBucket)?.count || 0) > 3 && '...'}
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Immediate</p>
            <p className="text-lg font-mono font-bold text-green-500">
              {(funnelData[0].allocation + funnelData[1].allocation).toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">T+30</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Medium</p>
            <p className="text-lg font-mono font-bold text-amber-500">
              {funnelData[2].allocation.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">30-90d</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Long-term</p>
            <p className="text-lg font-mono font-bold text-red-500">
              {(funnelData[3].allocation + funnelData[4].allocation).toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">90d+</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Liquidity score: 100 = fully liquid, 0 = fully locked
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
