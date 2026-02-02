import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Position, COMMON_CURRENCIES } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

interface CurrencySunburstChartProps {
  positions: Position[];
  title?: string;
}

// Professional color palette for currencies
const CURRENCY_COLORS: Record<string, string> = {
  USD: '#2A7AB9',
  EUR: '#01B8AA',
  GBP: '#FD625E',
  JPY: '#F2C80F',
  CHF: '#A66999',
  ILS: '#8AD4EB',
  CNY: '#374649',
  AUD: '#5F6B6D',
  CAD: '#FF8C00',
  HKD: '#50C878',
};

const getCurrencyColor = (currency: string): string => {
  return CURRENCY_COLORS[currency] || '#5F6B6D';
};

export function CurrencySunburstChart({ positions, title = 'Currency Exposure' }: CurrencySunburstChartProps) {
  const [hoveredCurrency, setHoveredCurrency] = useState<string | null>(null);

  const currencyData = useMemo(() => {
    const currencyMap: Record<string, { allocation: number; count: number; positions: string[] }> = {};

    positions.forEach(pos => {
      if (!currencyMap[pos.currency]) {
        currencyMap[pos.currency] = { allocation: 0, count: 0, positions: [] };
      }
      currencyMap[pos.currency].allocation += pos.allocation;
      currencyMap[pos.currency].count += 1;
      currencyMap[pos.currency].positions.push(pos.name);
    });

    return Object.entries(currencyMap)
      .map(([currency, data]) => ({
        currency,
        ...data,
        color: getCurrencyColor(currency),
      }))
      .sort((a, b) => b.allocation - a.allocation);
  }, [positions]);

  const totalAllocation = currencyData.reduce((sum, d) => sum + d.allocation, 0);

  // SVG dimensions
  const size = 200;
  const center = size / 2;
  const outerRadius = 85;
  const innerRadius = 45;
  const hoverRadius = 90;

  // Calculate arc paths
  const arcs = useMemo(() => {
    let currentAngle = -Math.PI / 2; // Start from top
    
    return currencyData.map(data => {
      const percentage = data.allocation / totalAllocation;
      const angle = percentage * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const isHovered = hoveredCurrency === data.currency;
      const radius = isHovered ? hoverRadius : outerRadius;
      const inner = isHovered ? innerRadius - 3 : innerRadius;

      // Calculate arc path
      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);
      const x3 = center + inner * Math.cos(endAngle);
      const y3 = center + inner * Math.sin(endAngle);
      const x4 = center + inner * Math.cos(startAngle);
      const y4 = center + inner * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;

      // Label position
      const midAngle = (startAngle + endAngle) / 2;
      const labelRadius = (radius + inner) / 2;
      const labelX = center + labelRadius * Math.cos(midAngle);
      const labelY = center + labelRadius * Math.sin(midAngle);

      return {
        ...data,
        path,
        labelX,
        labelY,
        percentage: percentage * 100,
        startAngle,
        endAngle,
      };
    });
  }, [currencyData, totalAllocation, hoveredCurrency]);

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Add positions to see currency exposure</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            {title}
          </span>
          <span className="text-xs text-muted-foreground">
            {currencyData.length} currencies
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-start gap-4">
          {/* Sunburst SVG */}
          <div className="flex-shrink-0 relative">
            <svg width={size} height={size} className="overflow-visible">
              {/* Arcs */}
              {arcs.map((arc, idx) => (
                <g key={arc.currency}>
                  <path
                    d={arc.path}
                    fill={arc.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    className={cn(
                      "transition-all duration-300 cursor-pointer",
                      hoveredCurrency === arc.currency && "filter brightness-110"
                    )}
                    onMouseEnter={() => setHoveredCurrency(arc.currency)}
                    onMouseLeave={() => setHoveredCurrency(null)}
                  />
                  
                  {/* Currency label on arc (only for large segments) */}
                  {arc.percentage > 8 && (
                    <text
                      x={arc.labelX}
                      y={arc.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[10px] font-bold fill-white pointer-events-none drop-shadow-md"
                    >
                      {arc.currency}
                    </text>
                  )}
                </g>
              ))}

              {/* Center circle */}
              <circle
                cx={center}
                cy={center}
                r={innerRadius - 8}
                fill="hsl(var(--card))"
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />

              {/* Center text */}
              <text
                x={center}
                y={center - 6}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground"
              >
                {hoveredCurrency || 'TOTAL'}
              </text>
              <text
                x={center}
                y={center + 10}
                textAnchor="middle"
                className="text-lg font-mono font-bold fill-foreground"
              >
                {hoveredCurrency 
                  ? `${currencyData.find(c => c.currency === hoveredCurrency)?.allocation.toFixed(1)}%`
                  : `${totalAllocation.toFixed(0)}%`
                }
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {currencyData.map((data, idx) => (
              <div 
                key={data.currency}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded transition-all duration-200 cursor-pointer",
                  hoveredCurrency === data.currency && "bg-muted/50"
                )}
                onMouseEnter={() => setHoveredCurrency(data.currency)}
                onMouseLeave={() => setHoveredCurrency(null)}
              >
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: data.color }}
                />
                <span className="text-xs font-mono font-semibold w-8 flex-shrink-0">
                  {data.currency}
                </span>
                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${data.allocation}%`,
                      backgroundColor: data.color 
                    }}
                  />
                </div>
                <span className="text-xs font-mono w-12 text-right flex-shrink-0">
                  {data.allocation.toFixed(1)}%
                </span>
                <span className="text-[10px] text-muted-foreground w-6 text-right flex-shrink-0">
                  ({data.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hover detail */}
        {hoveredCurrency && (
          <div className="mt-3 p-2 rounded-lg bg-muted/20 border border-border/30 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{hoveredCurrency}</span>
              <span className="text-xs text-muted-foreground">
                {currencyData.find(c => c.currency === hoveredCurrency)?.count} positions
              </span>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {currencyData.find(c => c.currency === hoveredCurrency)?.positions.slice(0, 3).join(', ')}
              {(currencyData.find(c => c.currency === hoveredCurrency)?.positions.length || 0) > 3 && '...'}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Currency risk analysis</span>
            <span className="font-mono">
              Base: <span className="text-foreground font-semibold">{currencyData[0]?.currency || '-'}</span> ({currencyData[0]?.allocation.toFixed(0) || 0}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
