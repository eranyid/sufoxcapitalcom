import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ZAxis } from 'recharts';
import { Building2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SectorAllocationData {
  name: string;
  value: number;
  percentage: number;
}

interface SectorAllocationRangeChartProps {
  sectorData: SectorAllocationData[];
  holdings: {
    ticker: string;
    sector?: string;
    weight: number;
  }[];
}

// Colors for the dots
const LOW_COLOR = '#FF8C00';   // Orange - Low
const AVG_COLOR = '#9370DB';   // Purple - Average  
const HIGH_COLOR = '#1a1a1a';  // Dark - High

interface DotData {
  sector: string;
  sectorIndex: number;
  low: number;
  avg: number;
  high: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DotData & { type?: string; value?: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="font-mono text-sm font-semibold text-foreground mb-2">
        {data.sector}
      </p>
      <div className="space-y-1 text-[11px] font-mono">
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LOW_COLOR }} />
            <span className="text-muted-foreground">Min:</span>
          </div>
          <span className="text-foreground">{data.low.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: AVG_COLOR }} />
            <span className="text-muted-foreground">Avg:</span>
          </div>
          <span className="text-foreground">{data.avg.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: HIGH_COLOR }} />
            <span className="text-muted-foreground">Max:</span>
          </div>
          <span className="text-foreground">{data.high.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function SectorAllocationRangeChart({ sectorData, holdings }: SectorAllocationRangeChartProps) {
  const isMobile = useIsMobile();
  
  // Calculate min/avg/max per sector based on individual holdings
  const chartData = useMemo(() => {
    // Group holdings by sector
    const sectorHoldings: Record<string, number[]> = {};
    
    holdings.forEach(h => {
      const sector = h.sector || 'Unknown';
      if (!sectorHoldings[sector]) {
        sectorHoldings[sector] = [];
      }
      sectorHoldings[sector].push(h.weight);
    });
    
    // Calculate low/avg/high for each sector
    const data: DotData[] = Object.entries(sectorHoldings)
      .map(([sector, weights], index) => {
        const low = Math.min(...weights);
        const high = Math.max(...weights);
        const avg = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        
        return {
          sector,
          sectorIndex: index,
          low,
          avg,
          high
        };
      })
      .sort((a, b) => b.avg - a.avg); // Sort by average descending
    
    // Re-index after sort
    return data.map((d, i) => ({ ...d, sectorIndex: i }));
  }, [holdings]);
  
  // Create separate datasets for each dot type
  const lowDots = useMemo(() => 
    chartData.map(d => ({ ...d, value: d.low, type: 'low' })), [chartData]);
  const avgDots = useMemo(() => 
    chartData.map(d => ({ ...d, value: d.avg, type: 'avg' })), [chartData]);
  const highDots = useMemo(() => 
    chartData.map(d => ({ ...d, value: d.high, type: 'high' })), [chartData]);
  
  // Range lines data for connecting dots
  const rangeLines = useMemo(() => 
    chartData.map(d => ({
      sector: d.sector,
      sectorIndex: d.sectorIndex,
      range: [d.low, d.high]
    })), [chartData]);
  
  // Calculate x-axis domain
  const xDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 20];
    const maxVal = Math.max(...chartData.map(d => d.high));
    return [0, Math.ceil(maxVal * 1.1)];
  }, [chartData]);
  
  // Empty state
  if (chartData.length < 2) {
    return (
      <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-secondary">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Sector Allocation Range
          </h3>
        </div>
        <div className="p-8 text-center">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Not enough sector data to show allocation ranges.
          </p>
        </div>
      </div>
    );
  }
  
  const chartHeight = Math.max(280, chartData.length * 40);
  
  return (
    <div className="bg-card border border-border/40 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 bg-secondary flex-shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Sector Allocation Range
        </h3>
        <p className="text-[9px] text-muted-foreground font-mono mt-0.5 leading-tight">
          Min/Avg/Max allocation per sector across holdings
        </p>
      </div>
      
      {/* Chart */}
      <div className={`flex-1 min-h-0 ${isMobile ? 'px-1 py-2' : 'px-2 py-3'}`}>
        <div className="w-full" style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 10,
                right: isMobile ? 15 : 30,
                bottom: 30,
                left: isMobile ? 80 : 100
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.25}
                horizontal={true}
                vertical={true}
              />
              <XAxis
                type="number"
                dataKey="value"
                domain={xDomain}
                tick={{ fontSize: isMobile ? 9 : 10, fontFamily: 'JetBrains Mono', fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{
                  value: 'Allocation %',
                  position: 'bottom',
                  offset: 15,
                  fontSize: isMobile ? 9 : 10,
                  fontFamily: 'JetBrains Mono',
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
              <YAxis
                type="number"
                dataKey="sectorIndex"
                domain={[-0.5, chartData.length - 0.5]}
                tick={{ fontSize: isMobile ? 9 : 10, fontFamily: 'JetBrains Mono', fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(index) => {
                  const sector = chartData[index]?.sector;
                  if (!sector) return '';
                  return sector.length > 12 ? sector.substring(0, 12) + '…' : sector;
                }}
                ticks={chartData.map((_, i) => i)}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={isMobile ? 70 : 90}
                reversed
              />
              <ZAxis range={[60, 60]} />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference lines for each sector (horizontal grid lines at sector positions) */}
              {chartData.map((d, i) => (
                <ReferenceLine
                  key={`ref-${i}`}
                  y={i}
                  stroke="hsl(var(--border))"
                  strokeDasharray="2 2"
                  opacity={0.3}
                />
              ))}
              
              {/* Connecting lines between Min-Avg-Max for each sector */}
              {chartData.map((d, i) => (
                <ReferenceLine
                  key={`range-line-${i}`}
                  segment={[
                    { x: d.low, y: d.sectorIndex },
                    { x: d.high, y: d.sectorIndex }
                  ]}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  opacity={0.5}
                />
              ))}
              
              {/* Low allocation dots (Orange) */}
              <Scatter
                name="Min"
                data={lowDots}
                fill={LOW_COLOR}
              >
                {lowDots.map((_, index) => (
                  <Cell
                    key={`low-${index}`}
                    fill={LOW_COLOR}
                    r={isMobile ? 5 : 7}
                  />
                ))}
              </Scatter>
              
              {/* Avg allocation dots (Purple) */}
              <Scatter
                name="Avg"
                data={avgDots}
                fill={AVG_COLOR}
              >
                {avgDots.map((_, index) => (
                  <Cell
                    key={`avg-${index}`}
                    fill={AVG_COLOR}
                    r={isMobile ? 5 : 7}
                  />
                ))}
              </Scatter>
              
              {/* High allocation dots (Dark) */}
              <Scatter
                name="Max"
                data={highDots}
                fill={HIGH_COLOR}
              >
                {highDots.map((_, index) => (
                  <Cell
                    key={`high-${index}`}
                    fill={HIGH_COLOR}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    r={isMobile ? 5 : 7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Legend */}
      <div className={`flex items-center justify-center gap-6 ${isMobile ? 'py-2 px-2' : 'py-3 px-3'} border-t border-border/30 flex-shrink-0`}>
        <div className="flex items-center gap-1.5">
          <div
            className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full`}
            style={{ backgroundColor: LOW_COLOR }}
          />
          <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-mono text-muted-foreground`}>Min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full`}
            style={{ backgroundColor: AVG_COLOR }}
          />
          <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-mono text-muted-foreground`}>Avg</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full border border-muted-foreground/50`}
            style={{ backgroundColor: HIGH_COLOR }}
          />
          <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-mono text-muted-foreground`}>Max</span>
        </div>
      </div>
    </div>
  );
}
