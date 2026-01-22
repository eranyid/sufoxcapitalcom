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
  parentId?: string;
  assetType?: string;
  geography?: string;
  sector?: string;
}

interface CalculatedSegment extends RingSegment {
  path: string;
  midAngle: number;
  labelX: number;
  labelY: number;
  angleSpan: number;
  startAngle: number;
  endAngle: number;
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
  const ring1Width = 45; // Asset Classes
  const ring2Width = 40; // Geographies
  const ring3Width = 38; // Sectors
  const ring4Width = 35; // Positions

  const ring1Radius = coreRadius + 10;
  const ring2Radius = ring1Radius + ring1Width + 4;
  const ring3Radius = ring2Radius + ring2Width + 4;
  const ring4Radius = ring3Radius + ring3Width + 4;

  const createArcPath = (
    startAngle: number,
    endAngle: number,
    innerR: number,
    outerR: number
  ): string => {
    // Handle very small angles gracefully
    if (endAngle - startAngle < 0.5) {
      return '';
    }
    
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

  // Build hierarchical sunburst data
  const sunburstData = useMemo(() => {
    // Step 1: Calculate Ring 1 (Asset Classes) - these span the full 360°
    const totalValue = assetClasses.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    const ring1Calculated: CalculatedSegment[] = assetClasses.map(item => {
      const angleSpan = totalValue > 0 ? (item.value / totalValue) * 360 : 0;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      const midAngle = (startAngle + endAngle) / 2;
      const midRadius = (ring1Radius + ring1Radius + ring1Width) / 2;
      const midAngleRad = (midAngle - 90) * (Math.PI / 180);
      currentAngle = endAngle;
      
      return {
        ...item,
        path: createArcPath(startAngle, endAngle, ring1Radius, ring1Radius + ring1Width),
        midAngle,
        labelX: center + midRadius * Math.cos(midAngleRad),
        labelY: center + midRadius * Math.sin(midAngleRad),
        angleSpan,
        startAngle,
        endAngle
      };
    });

    // Step 2: For each asset class, distribute geographies within its angular span
    const ring2Calculated: CalculatedSegment[] = [];
    
    for (const assetClass of ring1Calculated) {
      // Find geographies that belong to this asset class
      // We need to match based on what holdings belong to this asset class
      const assetClassName = assetClass.name;
      
      // Filter positions that belong to this asset class
      const positionsInAssetClass = positions.filter(p => {
        const assetType = p.assetType || 'Other';
        return formatName(assetType) === assetClassName;
      });
      
      // Group these positions by geography
      const geoValues = new Map<string, number>();
      for (const pos of positionsInAssetClass) {
        const geo = pos.geography || 'Other';
        geoValues.set(geo, (geoValues.get(geo) || 0) + pos.value);
      }
      
      // Distribute geographies within this asset class's angle
      const totalGeoValue = Array.from(geoValues.values()).reduce((sum, v) => sum + v, 0);
      let geoAngle = assetClass.startAngle;
      
      for (const [geoName, geoValue] of geoValues.entries()) {
        const geoAngleSpan = totalGeoValue > 0 
          ? (geoValue / totalGeoValue) * assetClass.angleSpan 
          : 0;
        
        if (geoAngleSpan < 0.5) continue;
        
        const geoStartAngle = geoAngle;
        const geoEndAngle = geoAngle + geoAngleSpan;
        const midAngle = (geoStartAngle + geoEndAngle) / 2;
        const midRadius = (ring2Radius + ring2Radius + ring2Width) / 2;
        const midAngleRad = (midAngle - 90) * (Math.PI / 180);
        
        // Find matching geography color
        const matchingGeo = geographies.find(g => formatName(g.name) === formatName(geoName));
        
        ring2Calculated.push({
          id: `${assetClass.id}-geo-${geoName}`,
          name: formatName(geoName),
          value: geoValue,
          weight: totalValue > 0 ? (geoValue / totalValue) * 100 : 0,
          color: matchingGeo?.color || getGeoColor(geoName),
          path: createArcPath(geoStartAngle, geoEndAngle, ring2Radius, ring2Radius + ring2Width),
          midAngle,
          labelX: center + midRadius * Math.cos(midAngleRad),
          labelY: center + midRadius * Math.sin(midAngleRad),
          angleSpan: geoAngleSpan,
          startAngle: geoStartAngle,
          endAngle: geoEndAngle,
          parentId: assetClass.id
        });
        
        geoAngle = geoEndAngle;
      }
    }

    // Step 3: For each geography segment, distribute sectors within its angular span
    const ring3Calculated: CalculatedSegment[] = [];
    
    for (const geo of ring2Calculated) {
      // Find positions that match this asset class and geography
      const parentAssetClassId = geo.parentId;
      const parentAssetClass = ring1Calculated.find(a => a.id === parentAssetClassId);
      
      if (!parentAssetClass) continue;
      
      const positionsInGeo = positions.filter(p => {
        const assetType = formatName(p.assetType || 'Other');
        const geography = formatName(p.geography || 'Other');
        return assetType === parentAssetClass.name && geography === geo.name;
      });
      
      // Group by sector
      const sectorValues = new Map<string, number>();
      for (const pos of positionsInGeo) {
        const sector = pos.sector || 'Unknown';
        sectorValues.set(sector, (sectorValues.get(sector) || 0) + pos.value);
      }
      
      const totalSectorValue = Array.from(sectorValues.values()).reduce((sum, v) => sum + v, 0);
      let sectorAngle = geo.startAngle;
      
      for (const [sectorName, sectorValue] of sectorValues.entries()) {
        const sectorAngleSpan = totalSectorValue > 0 
          ? (sectorValue / totalSectorValue) * geo.angleSpan 
          : 0;
        
        if (sectorAngleSpan < 0.5) continue;
        
        const sectorStartAngle = sectorAngle;
        const sectorEndAngle = sectorAngle + sectorAngleSpan;
        const midAngle = (sectorStartAngle + sectorEndAngle) / 2;
        const midRadius = (ring3Radius + ring3Radius + ring3Width) / 2;
        const midAngleRad = (midAngle - 90) * (Math.PI / 180);
        
        const matchingSector = sectors.find(s => formatName(s.name) === formatName(sectorName));
        
        ring3Calculated.push({
          id: `${geo.id}-sector-${sectorName}`,
          name: formatName(sectorName),
          value: sectorValue,
          weight: totalValue > 0 ? (sectorValue / totalValue) * 100 : 0,
          color: matchingSector?.color || getSectorColor(sectorName),
          path: createArcPath(sectorStartAngle, sectorEndAngle, ring3Radius, ring3Radius + ring3Width),
          midAngle,
          labelX: center + midRadius * Math.cos(midAngleRad),
          labelY: center + midRadius * Math.sin(midAngleRad),
          angleSpan: sectorAngleSpan,
          startAngle: sectorStartAngle,
          endAngle: sectorEndAngle,
          parentId: geo.id
        });
        
        sectorAngle = sectorEndAngle;
      }
    }

    // Step 4: For each sector segment, distribute positions within its angular span
    const ring4Calculated: CalculatedSegment[] = [];
    
    for (const sector of ring3Calculated) {
      // Parse parent chain to get asset class and geography
      const parentGeo = ring2Calculated.find(g => g.id === sector.parentId);
      if (!parentGeo) continue;
      
      const parentAssetClass = ring1Calculated.find(a => a.id === parentGeo.parentId);
      if (!parentAssetClass) continue;
      
      // Find positions matching this full hierarchy
      const positionsInSector = positions.filter(p => {
        const assetType = formatName(p.assetType || 'Other');
        const geography = formatName(p.geography || 'Other');
        const sectorName = formatName(p.sector || 'Unknown');
        return assetType === parentAssetClass.name && 
               geography === parentGeo.name && 
               sectorName === sector.name;
      });
      
      const totalPosValue = positionsInSector.reduce((sum, p) => sum + p.value, 0);
      let posAngle = sector.startAngle;
      
      for (const pos of positionsInSector) {
        const posAngleSpan = totalPosValue > 0 
          ? (pos.value / totalPosValue) * sector.angleSpan 
          : 0;
        
        if (posAngleSpan < 0.3) continue;
        
        const posStartAngle = posAngle;
        const posEndAngle = posAngle + posAngleSpan;
        const midAngle = (posStartAngle + posEndAngle) / 2;
        const midRadius = (ring4Radius + ring4Radius + ring4Width) / 2;
        const midAngleRad = (midAngle - 90) * (Math.PI / 180);
        
        ring4Calculated.push({
          ...pos,
          id: pos.id,
          path: createArcPath(posStartAngle, posEndAngle, ring4Radius, ring4Radius + ring4Width),
          midAngle,
          labelX: center + midRadius * Math.cos(midAngleRad),
          labelY: center + midRadius * Math.sin(midAngleRad),
          angleSpan: posAngleSpan,
          startAngle: posStartAngle,
          endAngle: posEndAngle,
          parentId: sector.id
        });
        
        posAngle = posEndAngle;
      }
    }

    return {
      ring1: ring1Calculated,
      ring2: ring2Calculated,
      ring3: ring3Calculated,
      ring4: ring4Calculated
    };
  }, [assetClasses, geographies, sectors, positions]);

  const getShortLabel = (segment: RingSegment, maxChars: number = 6) => {
    const label = segment.ticker || segment.name;
    if (label.length <= maxChars) return label;
    return label.substring(0, maxChars);
  };

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
        {/* Defs */}
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

        {/* Background circle */}
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
        {sunburstData.ring4.map((segment) => (
          segment.path && (
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
          )
        ))}
        {sunburstData.ring4.map((segment) => (
          segment.path && segment.angleSpan > 12 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[6px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              {getShortLabel(segment, 4)}
            </text>
          )
        ))}

        {/* Ring 3 - Sectors */}
        {sunburstData.ring3.map((segment) => (
          segment.path && (
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
          )
        ))}
        {sunburstData.ring3.map((segment) => (
          segment.path && segment.angleSpan > 16 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[7px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              {getShortLabel(segment, 5)}
            </text>
          )
        ))}

        {/* Ring 2 - Geographies */}
        {sunburstData.ring2.map((segment) => (
          segment.path && (
            <Tooltip key={segment.id}>
              <TooltipTrigger asChild>
                <path
                  d={segment.path}
                  fill={segment.color}
                  stroke="hsl(var(--background))"
                  strokeWidth="1.5"
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    selectedId === segment.id ? "opacity-100" : "opacity-85 hover:opacity-100"
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
          )
        ))}
        {sunburstData.ring2.map((segment) => (
          segment.path && segment.angleSpan > 18 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[7px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              {getShortLabel(segment, 5)}
            </text>
          )
        ))}

        {/* Ring 1 (Innermost) - Asset Classes */}
        {sunburstData.ring1.map((segment) => (
          segment.path && (
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
          )
        ))}
        {sunburstData.ring1.map((segment) => (
          segment.path && segment.angleSpan > 22 && (
            <text
              key={`label-${segment.id}`}
              x={segment.labelX}
              y={segment.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[8px] font-mono font-bold pointer-events-none select-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
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

// Helper functions
function formatName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Color palettes for fallback
const GEO_COLORS: Record<string, string> = {
  'North America': '#4A90D9',
  'North america': '#4A90D9',
  'US': '#4A90D9',
  'Europe': '#50C878',
  'Asia': '#FFD700',
  'Global': '#9370DB',
  'Other': '#FF6B6B'
};

const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#00B5E2',
  'Healthcare': '#50C878',
  'Finance': '#4A90D9',
  'Consumer': '#FFD700',
  'Energy': '#FF8C00',
  'Industrial': '#9370DB',
  'Materials': '#20B2AA',
  'Unknown': '#888888'
};

function getGeoColor(name: string): string {
  const formatted = formatName(name);
  return GEO_COLORS[formatted] || GEO_COLORS[name] || '#6B7280';
}

function getSectorColor(name: string): string {
  const formatted = formatName(name);
  return SECTOR_COLORS[formatted] || SECTOR_COLORS[name] || '#6B7280';
}
