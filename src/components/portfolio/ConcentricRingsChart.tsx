import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RingSegment {
  id: string;
  name: string;
  value: number;
  weight: number;
  color: string;
  children?: RingSegment[];
  ticker?: string;
  plPercent?: number;
}

interface ConcentricRingsChartProps {
  assetClasses: RingSegment[];
  sectors: RingSegment[];
  positions: RingSegment[];
  onSegmentClick: (segment: RingSegment, type: 'asset-class' | 'sector' | 'position') => void;
  selectedId?: string | null;
  className?: string;
}

export function ConcentricRingsChart({
  assetClasses,
  sectors,
  positions,
  onSegmentClick,
  selectedId,
  className
}: ConcentricRingsChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<{ segment: RingSegment; type: string } | null>(null);

  const size = 500;
  const center = size / 2;
  const coreRadius = 60;
  const innerRingWidth = 50;
  const middleRingWidth = 45;
  const outerRingWidth = 40;

  const innerRadius = coreRadius + 10;
  const middleRadius = innerRadius + innerRingWidth + 8;
  const outerRadius = middleRadius + middleRingWidth + 8;

  const createArcPath = (
    startAngle: number,
    endAngle: number,
    innerR: number,
    outerR: number
  ): string => {
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = center + innerR * Math.cos(startAngleRad);
    const y1 = center + innerR * Math.sin(startAngleRad);
    const x2 = center + outerR * Math.cos(startAngleRad);
    const y2 = center + outerR * Math.sin(startAngleRad);
    const x3 = center + outerR * Math.cos(endAngleRad);
    const y3 = center + outerR * Math.sin(endAngleRad);
    const x4 = center + innerR * Math.cos(endAngleRad);
    const y4 = center + innerR * Math.sin(endAngleRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1} Z`;
  };

  const calculateSegments = (items: RingSegment[], innerR: number, outerR: number) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let currentAngle = 0;

    return items.map(item => {
      const angleSpan = (item.weight / totalWeight) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      return {
        ...item,
        path: createArcPath(startAngle, endAngle, innerR, outerR),
        midAngle: (startAngle + endAngle) / 2
      };
    });
  };

  const innerSegments = useMemo(
    () => calculateSegments(assetClasses, innerRadius, innerRadius + innerRingWidth),
    [assetClasses]
  );

  const middleSegments = useMemo(
    () => calculateSegments(sectors, middleRadius, middleRadius + middleRingWidth),
    [sectors]
  );

  const outerSegments = useMemo(
    () => calculateSegments(positions.slice(0, 20), outerRadius, outerRadius + outerRingWidth),
    [positions]
  );

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full max-w-[500px] max-h-[500px] mx-auto"
      >
        {/* Outer glow effect */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Background circles for depth */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius + outerRingWidth + 20}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />

        {/* Outer ring - Positions */}
        {outerSegments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="2"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedId === segment.id ? "opacity-100" : "opacity-70 hover:opacity-100"
                )}
                onClick={() => onSegmentClick(segment, 'position')}
                onMouseEnter={() => setHoveredSegment({ segment, type: 'position' })}
                onMouseLeave={() => setHoveredSegment(null)}
                filter={selectedId === segment.id ? "url(#glow)" : undefined}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs">
              <div className="space-y-1">
                <p className="font-semibold">{segment.ticker || segment.name}</p>
                <p className="text-muted-foreground">{segment.weight.toFixed(2)}% | {formatValue(segment.value)}</p>
                {segment.plPercent !== undefined && (
                  <p className={segment.plPercent >= 0 ? "text-green-500" : "text-red-500"}>
                    P&L: {segment.plPercent >= 0 ? '+' : ''}{segment.plPercent.toFixed(1)}%
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Middle ring - Sectors */}
        {middleSegments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="2"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedId === segment.id ? "opacity-100" : "opacity-80 hover:opacity-100"
                )}
                onClick={() => onSegmentClick(segment, 'sector')}
                onMouseEnter={() => setHoveredSegment({ segment, type: 'sector' })}
                onMouseLeave={() => setHoveredSegment(null)}
                filter={selectedId === segment.id ? "url(#glow)" : undefined}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs">
              <div className="space-y-1">
                <p className="font-semibold">{segment.name}</p>
                <p className="text-muted-foreground">{segment.weight.toFixed(2)}% | {formatValue(segment.value)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Inner ring - Asset Classes */}
        {innerSegments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="2"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedId === segment.id ? "opacity-100" : "opacity-90 hover:opacity-100"
                )}
                onClick={() => onSegmentClick(segment, 'asset-class')}
                onMouseEnter={() => setHoveredSegment({ segment, type: 'asset-class' })}
                onMouseLeave={() => setHoveredSegment(null)}
                filter={selectedId === segment.id ? "url(#glow)" : undefined}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs">
              <div className="space-y-1">
                <p className="font-semibold">{segment.name}</p>
                <p className="text-muted-foreground">{segment.weight.toFixed(2)}% | {formatValue(segment.value)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Core circle */}
        <circle
          cx={center}
          cy={center}
          r={coreRadius}
          fill="url(#coreGradient)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-200 hover:stroke-[3px]"
          onClick={() => onSegmentClick({ id: 'core', name: 'Portfolio Core', value: 0, weight: 100, color: '' }, 'asset-class')}
        />

        {/* Core text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="fill-primary text-[10px] font-mono uppercase tracking-wider"
        >
          Portfolio
        </text>
        <text
          x={center}
          y={center + 8}
          textAnchor="middle"
          className="fill-foreground text-[11px] font-semibold"
        >
          Core
        </text>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary/60" />
          <span>Asset Classes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60" />
          <span>Sectors</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent/60" />
          <span>Positions</span>
        </div>
      </div>
    </div>
  );
}
