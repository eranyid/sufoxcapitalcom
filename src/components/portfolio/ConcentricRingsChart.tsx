import { useMemo } from 'react';
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
  geographies: RingSegment[];
  sectors: RingSegment[];
  positions: RingSegment[];
  onSegmentClick: (segment: RingSegment, type: 'asset-class' | 'geography' | 'sector' | 'position') => void;
  selectedId?: string | null;
  className?: string;
}

export function ConcentricRingsChart({
  assetClasses,
  geographies,
  sectors,
  positions,
  onSegmentClick,
  selectedId,
  className
}: ConcentricRingsChartProps) {
  const size = 520;
  const center = size / 2;
  const coreRadius = 50;
  const ring1Width = 38; // Asset Classes
  const ring2Width = 34; // Geographies
  const ring3Width = 32; // Sectors
  const ring4Width = 30; // Positions

  const ring1Radius = coreRadius + 8;
  const ring2Radius = ring1Radius + ring1Width + 6;
  const ring3Radius = ring2Radius + ring2Width + 6;
  const ring4Radius = ring3Radius + ring3Width + 6;

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
    const midRadius = (innerR + outerR) / 2;

    return items.map(item => {
      const angleSpan = (item.weight / totalWeight) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      const midAngle = (startAngle + endAngle) / 2;
      const midAngleRad = (midAngle - 90) * (Math.PI / 180);
      currentAngle = endAngle;

      return {
        ...item,
        path: createArcPath(startAngle, endAngle, innerR, outerR),
        midAngle,
        labelX: center + midRadius * Math.cos(midAngleRad),
        labelY: center + midRadius * Math.sin(midAngleRad),
        angleSpan
      };
    });
  };

  const getShortLabel = (segment: RingSegment, maxChars: number = 6) => {
    const label = segment.ticker || segment.name;
    if (label.length <= maxChars) return label;
    return label.substring(0, maxChars);
  };

  // Ring 1: Asset Classes (innermost)
  const ring1Segments = useMemo(
    () => calculateSegments(assetClasses, ring1Radius, ring1Radius + ring1Width),
    [assetClasses]
  );

  // Ring 2: Geographies
  const ring2Segments = useMemo(
    () => calculateSegments(geographies, ring2Radius, ring2Radius + ring2Width),
    [geographies]
  );

  // Ring 3: Sectors
  const ring3Segments = useMemo(
    () => calculateSegments(sectors, ring3Radius, ring3Radius + ring3Width),
    [sectors]
  );

  // Ring 4: Positions (outermost)
  const ring4Segments = useMemo(
    () => calculateSegments(positions.slice(0, 20), ring4Radius, ring4Radius + ring4Width),
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
          r={ring4Radius + ring4Width + 15}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />

        {/* Ring 4 (Outermost) - Positions */}
        {ring4Segments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedId === segment.id ? "opacity-100" : "opacity-70 hover:opacity-100"
                )}
                onClick={() => onSegmentClick(segment, 'position')}
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
        {ring4Segments.map((segment) => (
          segment.angleSpan > 14 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[6px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {getShortLabel(segment, 4)}
            </text>
          )
        ))}

        {/* Ring 3 - Sectors */}
        {ring3Segments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedId === segment.id ? "opacity-100" : "opacity-75 hover:opacity-100"
                )}
                onClick={() => onSegmentClick(segment, 'sector')}
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
        {ring3Segments.map((segment) => (
          segment.angleSpan > 18 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[7px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {getShortLabel(segment, 5)}
            </text>
          )
        ))}

        {/* Ring 2 - Geographies */}
        {ring2Segments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedId === segment.id ? "opacity-100" : "opacity-80 hover:opacity-100"
                )}
                onClick={() => onSegmentClick(segment, 'geography')}
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
        {ring2Segments.map((segment) => (
          segment.angleSpan > 20 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[7px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {getShortLabel(segment, 5)}
            </text>
          )
        ))}

        {/* Ring 1 (Innermost) - Asset Classes */}
        {ring1Segments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <path
                d={segment.path}
                fill={segment.color}
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedId === segment.id ? "opacity-100" : "opacity-90 hover:opacity-100"
                )}
                onClick={() => onSegmentClick(segment, 'asset-class')}
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
        {ring1Segments.map((segment) => (
          segment.angleSpan > 25 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[8px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {getShortLabel(segment, 6)}
            </text>
          )
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
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/70" />
          <span>Assets</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent/70" />
          <span>Geography</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/70" />
          <span>Sectors</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/40" />
          <span>Holdings</span>
        </div>
      </div>
    </div>
  );
}
