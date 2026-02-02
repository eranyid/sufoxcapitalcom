import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Position, StyleTag, STYLE_TAG_LABELS } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';

interface StyleRadarChartProps {
  positions: Position[];
  title?: string;
}

// Professional FT-style colors
const STYLE_COLORS: Record<StyleTag, string> = {
  growth: '#2A7AB9',
  value: '#01B8AA',
  income: '#F2C80F',
  defensive: '#374649',
  cyclical: '#FD625E',
  speculative: '#A66999',
  esg: '#5F6B6D',
  thematic: '#8AD4EB',
};

export function StyleRadarChart({ positions, title = 'Style Distribution' }: StyleRadarChartProps) {
  const styleData = useMemo(() => {
    const styleMap: Record<StyleTag, number> = {
      growth: 0,
      value: 0,
      income: 0,
      defensive: 0,
      cyclical: 0,
      speculative: 0,
      esg: 0,
      thematic: 0,
    };

    // Aggregate allocation by style tag
    positions.forEach(pos => {
      const tagWeight = pos.allocation / (pos.styleTags.length || 1);
      pos.styleTags.forEach(tag => {
        styleMap[tag] += tagWeight;
      });
    });

    // Filter to only styles with allocation and format
    const activeStyles = Object.entries(styleMap)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        key: key as StyleTag,
        label: STYLE_TAG_LABELS[key as StyleTag],
        value: Math.round(value * 10) / 10,
        color: STYLE_COLORS[key as StyleTag],
      }))
      .sort((a, b) => b.value - a.value);

    return activeStyles;
  }, [positions]);

  // Calculate radar chart geometry
  const radarSize = 200;
  const center = radarSize / 2;
  const maxRadius = 80;
  const levels = 4;

  // All 8 style tags for radar axes
  const allStyles: StyleTag[] = ['growth', 'value', 'income', 'defensive', 'cyclical', 'speculative', 'esg', 'thematic'];
  const angleStep = (2 * Math.PI) / allStyles.length;

  // Get max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...styleData.map(s => s.value), 30);
  }, [styleData]);

  // Calculate point positions
  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (value / maxValue) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // Generate radar polygon path
  const radarPath = useMemo(() => {
    const points = allStyles.map((style, i) => {
      const data = styleData.find(s => s.key === style);
      const value = data?.value || 0;
      return getPoint(i, value);
    });
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }, [styleData, allStyles]);

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Add positions to see style distribution</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {styleData.length} active styles
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-start gap-4">
          {/* Radar Chart SVG */}
          <div className="flex-shrink-0">
            <svg width={radarSize} height={radarSize} className="overflow-visible">
              {/* Background circles */}
              {Array.from({ length: levels }).map((_, i) => {
                const radius = ((i + 1) / levels) * maxRadius;
                return (
                  <circle
                    key={i}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    strokeDasharray={i < levels - 1 ? "2,2" : undefined}
                    opacity={0.5}
                  />
                );
              })}

              {/* Axis lines and labels */}
              {allStyles.map((style, i) => {
                const endPoint = getPoint(i, maxValue);
                const labelPoint = getPoint(i, maxValue * 1.2);
                const data = styleData.find(s => s.key === style);
                const hasValue = data && data.value > 0;
                
                return (
                  <g key={style}>
                    <line
                      x1={center}
                      y1={center}
                      x2={endPoint.x}
                      y2={endPoint.y}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                      opacity={0.5}
                    />
                    <text
                      x={labelPoint.x}
                      y={labelPoint.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={cn(
                        "text-[9px] font-medium transition-colors",
                        hasValue ? "fill-foreground" : "fill-muted-foreground/50"
                      )}
                    >
                      {STYLE_TAG_LABELS[style]}
                    </text>
                  </g>
                );
              })}

              {/* Radar area */}
              <path
                d={radarPath}
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeLinejoin="round"
              />

              {/* Data points */}
              {allStyles.map((style, i) => {
                const data = styleData.find(s => s.key === style);
                if (!data || data.value === 0) return null;
                const point = getPoint(i, data.value);
                
                return (
                  <g key={`point-${style}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={5}
                      fill={data.color}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                    {/* Value label */}
                    <text
                      x={point.x}
                      y={point.y - 10}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-semibold fill-foreground"
                    >
                      {data.value}%
                    </text>
                  </g>
                );
              })}

              {/* Center point */}
              <circle
                cx={center}
                cy={center}
                r={3}
                fill="hsl(var(--muted-foreground))"
                opacity={0.5}
              />
            </svg>
          </div>

          {/* Legend with bars */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {styleData.slice(0, 6).map((style, idx) => (
              <div key={style.key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: style.color }}
                />
                <span className="text-xs text-muted-foreground truncate min-w-0 flex-shrink-0 w-20">
                  {style.label}
                </span>
                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${(style.value / maxValue) * 100}%`,
                      backgroundColor: style.color 
                    }}
                  />
                </div>
                <span className="text-xs font-mono font-semibold w-12 text-right flex-shrink-0">
                  {style.value}%
                </span>
              </div>
            ))}
            
            {styleData.length === 0 && (
              <p className="text-xs text-muted-foreground">No style tags assigned</p>
            )}
          </div>
        </div>

        {/* Footer stats */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Style concentration analysis based on position weights</span>
            <span className="font-mono">
              Top: <span className="text-foreground font-semibold">{styleData[0]?.label || '-'}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
