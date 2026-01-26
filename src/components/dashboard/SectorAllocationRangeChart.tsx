import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ZAxis, PieChart, Pie } from 'recharts';
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

// Colors for sectors (matching the existing palette)
const SECTOR_COLORS = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD'];

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
  color: string;
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
  
  const total = sectorData.reduce((sum, item) => sum + item.value, 0);
  
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
          high,
          color: SECTOR_COLORS[index % SECTOR_COLORS.length]
        };
      })
      .sort((a, b) => b.avg - a.avg); // Sort by average descending
    
    // Re-index after sort and update colors
    return data.map((d, i) => ({ 
      ...d, 
      sectorIndex: i,
      color: SECTOR_COLORS[i % SECTOR_COLORS.length]
    }));
  }, [holdings]);
  
  // Create separate datasets for each dot type
  const lowDots = useMemo(() => 
    chartData.map(d => ({ ...d, value: d.low, type: 'low' })), [chartData]);
  const avgDots = useMemo(() => 
    chartData.map(d => ({ ...d, value: d.avg, type: 'avg' })), [chartData]);
  const highDots = useMemo(() => 
    chartData.map(d => ({ ...d, value: d.high, type: 'high' })), [chartData]);
  
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
            Sector Distribution & Allocation Range
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
  
  const chartHeight = Math.max(200, chartData.length * 45);
  
  return (
    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-secondary">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Sector Distribution & Allocation Range
        </h3>
        <p className="text-[9px] text-muted-foreground font-mono mt-0.5 leading-tight">
          Sector breakdown with min/avg/max allocation per holding
        </p>
      </div>
      
      {/* Content - Two columns layout */}
      <div className="p-4">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-2 gap-6'}`}>
          
          {/* Left side: Pie Chart + Table */}
          <div className="space-y-4">
            {/* Donut Chart */}
            <div className="flex justify-center">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="percentage"
                    >
                      {sectorData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--secondary))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Weight']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Data Table */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-left py-1.5">Sector</th>
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5">Value</th>
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5">Weight</th>
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map((item, index) => (
                    <tr key={item.name} className="border-b border-border/10 hover:bg-primary/5 transition-colors">
                      <td className="py-1.5 flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length] }}
                        />
                        <span className="font-mono text-[11px] text-foreground">{item.name}</span>
                      </td>
                      <td className="font-mono text-[11px] text-right tabular-nums text-muted-foreground">
                        ${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="font-mono text-[11px] text-right tabular-nums font-medium text-foreground">
                        {item.percentage.toFixed(1)}%
                      </td>
                      <td className="py-1.5 pl-3">
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length]
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[9px] text-muted-foreground mt-2 font-mono">
                Total: ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          
          {/* Right side: Dot Plot (Range Chart) */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Allocation Range by Sector
            </p>
            <div className="w-full" style={{ height: `${chartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{
                    top: 10,
                    right: isMobile ? 15 : 20,
                    bottom: 30,
                    left: isMobile ? 70 : 85
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
                      offset: 12,
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
                      return sector.length > 10 ? sector.substring(0, 10) + '…' : sector;
                    }}
                    ticks={chartData.map((_, i) => i)}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={isMobile ? 60 : 75}
                    reversed
                  />
                  <ZAxis range={[50, 50]} />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Connecting lines between Min-Max for each sector */}
                  {chartData.map((d, i) => (
                    <ReferenceLine
                      key={`range-line-${i}`}
                      segment={[
                        { x: d.low, y: d.sectorIndex },
                        { x: d.high, y: d.sectorIndex }
                      ]}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      opacity={0.4}
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
                        r={isMobile ? 5 : 6}
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
                        r={isMobile ? 5 : 6}
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
                        r={isMobile ? 5 : 6}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LOW_COLOR }} />
                <span className="text-[9px] font-mono text-muted-foreground">Min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: AVG_COLOR }} />
                <span className="text-[9px] font-mono text-muted-foreground">Avg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/50" style={{ backgroundColor: HIGH_COLOR }} />
                <span className="text-[9px] font-mono text-muted-foreground">Max</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
