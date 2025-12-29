import { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateAllocations, calculatePositions, getLatestValuations } from '@/lib/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Scan, BarChart3, Target, Layers, TrendingUp } from 'lucide-react';
import { CorrelationMatrix } from '@/components/dashboard/CorrelationMatrix';
import { GeographicHeatMap } from '@/components/dashboard/GeographicHeatMap';
import { ConcentricRingsChart } from '@/components/portfolio/ConcentricRingsChart';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD'];

interface DistributionSectionProps {
  title: string;
  data: { name: string; value: number; percentage: number }[];
}

function DistributionSection({ title, data }: DistributionSectionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card/50 border border-border/40 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {title}
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Donut Chart */}
          <div className="flex flex-col items-center">
            <div className="h-36 w-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
          <div className="lg:col-span-2">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-left py-1.5">{title.split(' ')[0]}</th>
                  <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5">Value</th>
                  <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5">Weight</th>
                  <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.name} className="border-b border-border/10 hover:bg-primary/5 transition-colors">
                    <td className="py-1.5 flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
                            backgroundColor: COLORS[index % COLORS.length]
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
      </div>
    </div>
  );
}

function TopHoldingsSection({ transactions, valuations }: { transactions: any[]; valuations: any[] }) {
  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);

  const holdings: { ticker: string; name: string; value: number; weight: number }[] = [];
  let totalValue = 0;

  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    const val = latestVals[ticker];
    const tx = transactions.find((t: any) => t.ticker === ticker);
    if (!val || !tx) continue;
    
    const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    totalValue += value;
    holdings.push({ ticker, name: tx.assetName, value, weight: 0 });
  }

  holdings.forEach(h => h.weight = (h.value / totalValue) * 100);
  holdings.sort((a, b) => b.value - a.value);
  const topHoldings = holdings.slice(0, 10);

  return (
    <div className="bg-card/50 border border-border/40 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Top 10 Holdings
        </h3>
      </div>
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-left py-1.5">#</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-left py-1.5">Ticker</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-left py-1.5">Name</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5">Value</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5">Weight</th>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right py-1.5 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {topHoldings.map((holding, index) => (
              <tr key={holding.ticker} className="border-b border-border/10 hover:bg-primary/5 transition-colors">
                <td className="font-mono text-[11px] py-1.5 text-muted-foreground">{index + 1}</td>
                <td className="font-mono text-[11px] py-1.5 text-primary font-semibold">{holding.ticker}</td>
                <td className="font-mono text-[11px] py-1.5 text-muted-foreground truncate max-w-[120px]">{holding.name}</td>
                <td className="font-mono text-[11px] text-right tabular-nums text-foreground">
                  ${holding.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="font-mono text-[11px] text-right tabular-nums font-medium text-foreground">
                  {holding.weight.toFixed(1)}%
                </td>
                <td className="py-1.5 pl-3">
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(holding.weight * 2, 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[9px] text-muted-foreground mt-2 font-mono">
          Top 10 concentration: {topHoldings.reduce((sum, h) => sum + h.weight, 0).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

interface RingSegment {
  id: string;
  name: string;
  value: number;
  weight: number;
  color: string;
  ticker?: string;
  plPercent?: number;
}

export default function XRay() {
  const { transactions, valuations, cashBalances } = usePortfolio();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const assetTypeAllocation = calculateAllocations(transactions, valuations, 'assetType');
  const geographyAllocation = calculateAllocations(transactions, valuations, 'geography');
  const currencyAllocation = calculateAllocations(transactions, valuations, 'currency');

  const hasData = transactions.length > 0 && valuations.length > 0;

  // Calculate total portfolio value for KPIs
  const totalPortfolioValue = useMemo(() => {
    if (!hasData) return 0;
    const positionsData = calculatePositions(transactions);
    const latestVals = getLatestValuations(valuations);
    let total = 0;
    for (const [ticker, pos] of Object.entries(positionsData)) {
      if (pos.quantity <= 0) continue;
      const val = latestVals[ticker];
      if (!val) continue;
      total += pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    }
    const cashTotal = (cashBalances?.USD || 0) + (cashBalances?.EUR || 0) + (cashBalances?.ILS || 0);
    return total + cashTotal;
  }, [transactions, valuations, cashBalances, hasData]);

  // Calculate ring data for concentric chart
  const { assetClasses, sectors, positions, positionsCount } = useMemo(() => {
    if (!hasData) {
      return { assetClasses: [], sectors: [], positions: [], positionsCount: 0 };
    }

    const positionsData = calculatePositions(transactions);
    const latestVals = getLatestValuations(valuations);
    
    let totalPortfolioValue = 0;
    const holdingsData: RingSegment[] = [];
    
    for (const [ticker, pos] of Object.entries(positionsData)) {
      if (pos.quantity <= 0) continue;
      const val = latestVals[ticker];
      if (!val) continue;
      
      const tx = transactions.find(t => t.ticker === ticker);
      if (!tx) continue;
      
      const currentValue = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
      const costBasis = pos.totalCost;
      const plPercent = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
      
      totalPortfolioValue += currentValue;
      holdingsData.push({
        id: ticker,
        name: tx.assetName,
        ticker: ticker,
        value: currentValue,
        weight: 0,
        color: '',
        plPercent
      });
    }

    const cashTotal = (cashBalances?.USD || 0) + (cashBalances?.EUR || 0) + (cashBalances?.ILS || 0);
    totalPortfolioValue += cashTotal;

    const positionColors = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD', '#87CEEB', '#F0E68C', '#DEB887', '#98FB98', '#FFA07A', '#B0C4DE', '#FFDAB9', '#E6E6FA', '#F5DEB3', '#D8BFD8', '#FFFACD', '#E0FFFF'];
    
    holdingsData.forEach((h, idx) => {
      h.weight = (h.value / totalPortfolioValue) * 100;
      h.color = positionColors[idx % positionColors.length];
    });

    holdingsData.sort((a, b) => b.weight - a.weight);

    const assetTypeMap = new Map<string, { value: number; items: typeof holdingsData }>();
    for (const holding of holdingsData) {
      const tx = transactions.find(t => t.ticker === holding.ticker);
      const assetType = tx?.assetType || 'Other';
      if (!assetTypeMap.has(assetType)) {
        assetTypeMap.set(assetType, { value: 0, items: [] });
      }
      const group = assetTypeMap.get(assetType)!;
      group.value += holding.value;
      group.items.push(holding);
    }

    if (cashTotal > 0) {
      assetTypeMap.set('Cash', { value: cashTotal, items: [] });
    }

    const assetClassColors = ['#FF8C00', '#4A90D9', '#50C878', '#9370DB', '#FFD700', '#FF6B6B'];
    const assetClassesData: RingSegment[] = Array.from(assetTypeMap.entries()).map(([name, data], idx) => ({
      id: `asset-${name}`,
      name,
      value: data.value,
      weight: (data.value / totalPortfolioValue) * 100,
      color: assetClassColors[idx % assetClassColors.length]
    }));

    const geoMap = new Map<string, number>();
    for (const holding of holdingsData) {
      const tx = transactions.find(t => t.ticker === holding.ticker);
      const geo = tx?.geography || 'Other';
      geoMap.set(geo, (geoMap.get(geo) || 0) + holding.value);
    }

    const sectorColors = ['#20B2AA', '#DDA0DD', '#87CEEB', '#F0E68C', '#DEB887', '#98FB98'];
    const sectorsData: RingSegment[] = Array.from(geoMap.entries()).map(([name, value], idx) => ({
      id: `sector-${name}`,
      name,
      value,
      weight: (value / totalPortfolioValue) * 100,
      color: sectorColors[idx % sectorColors.length]
    }));

    return {
      assetClasses: assetClassesData,
      sectors: sectorsData,
      positions: holdingsData,
      positionsCount: holdingsData.length
    };
  }, [transactions, valuations, cashBalances, hasData]);

  const handleSegmentClick = (segment: RingSegment | { type: string; name: string; weight: number; value: number; ticker?: string; plPercent?: number }) => {
    const id = 'id' in segment ? segment.id : segment.name;
    setSelectedId(prev => prev === id ? null : id);
  };

  const cashPercent = useMemo(() => {
    if (!hasData || totalPortfolioValue === 0) return 0;
    const cashTotal = (cashBalances?.USD || 0) + (cashBalances?.EUR || 0) + (cashBalances?.ILS || 0);
    return (cashTotal / totalPortfolioValue) * 100;
  }, [cashBalances, totalPortfolioValue, hasData]);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold flex items-center gap-2 text-foreground">
            <Scan className="h-4 w-4 text-primary" />
            Portfolio X-RAY
          </h1>
          <p className="text-muted-foreground text-[10px] font-mono mt-0.5">
            Deep analysis of portfolio composition
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Analysis Date</p>
          <p className="text-sm font-mono tabular-nums text-foreground">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Premium Architecture Chart Card */}
          <div className="relative bg-gradient-to-b from-card/80 to-card/40 border border-border/50 rounded-xl overflow-hidden shadow-lg shadow-black/10">
            {/* Header */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Portfolio Architecture
                  </h2>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground font-mono mt-0.5">
                    Capital allocation structure & exposure layers
                  </p>
                </div>
                
                {/* Mini KPIs - Desktop only */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Total Value</p>
                    <p className="text-sm font-mono font-semibold text-foreground tabular-nums">
                      ${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-border/50" />
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Positions</p>
                    <p className="text-sm font-mono font-semibold text-foreground tabular-nums">{positionsCount}</p>
                  </div>
                  <div className="w-px h-8 bg-border/50" />
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Cash</p>
                    <p className="text-sm font-mono font-semibold text-foreground tabular-nums">{cashPercent.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="p-4 md:p-8">
              <div className="flex justify-center">
                <div className="relative">
                  {/* Subtle glow behind chart */}
                  <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-75" />
                  <ConcentricRingsChart
                    assetClasses={assetClasses}
                    sectors={sectors}
                    positions={positions}
                    onSegmentClick={handleSegmentClick}
                    selectedId={selectedId}
                    className={isMobile ? "h-[320px] w-[320px]" : "h-[420px]"}
                  />
                </div>
              </div>
            </div>

            {/* Footer Legend */}
            <div className="px-4 md:px-6 py-3 border-t border-border/20 bg-muted/10">
              <div className="flex items-center justify-center gap-4 md:gap-8 text-[9px] md:text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 border border-primary/30" />
                  <span>Asset Classes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/30 border border-muted-foreground/20" />
                  <span>Geography</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-accent/60 to-accent/30 border border-accent/20" />
                  <span>Positions</span>
                </div>
              </div>
            </div>
          </div>

          {/* All sections - visible on all screen sizes */}
          <div className="space-y-4">
            {/* Section Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                <Layers className="h-3 w-3" />
                Detailed Breakdown
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            </div>

            {/* Distribution Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DistributionSection 
                title="Asset Class Distribution" 
                data={assetTypeAllocation} 
              />
              <DistributionSection 
                title="Currency Exposure" 
                data={currencyAllocation} 
              />
            </div>

            {/* Geographic Distribution */}
            <GeographicHeatMap data={geographyAllocation} />

            {/* Section Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Concentration Analysis
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            </div>

            {/* Correlation Matrix */}
            <CorrelationMatrix transactions={transactions} valuations={valuations} />

            {/* Top Holdings */}
            <TopHoldingsSection transactions={transactions} valuations={valuations} />
          </div>
        </>
      ) : (
        <div className="bg-card/50 border border-border/40 rounded-xl p-8 text-center">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">No Data Available</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            Add transactions and monthly valuations to see portfolio X-RAY analysis.
          </p>
        </div>
      )}
    </div>
  );
}