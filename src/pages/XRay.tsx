import { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateAllocations, calculatePositions, getLatestValuations } from '@/lib/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Scan, BarChart3 } from 'lucide-react';
import { CorrelationMatrix } from '@/components/dashboard/CorrelationMatrix';
import { GeographicHeatMap } from '@/components/dashboard/GeographicHeatMap';
import { ConcentricRingsChart } from '@/components/portfolio/ConcentricRingsChart';
import { MobileArchitectureView } from '@/components/portfolio/MobileArchitectureView';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD'];

interface DistributionSectionProps {
  title: string;
  data: { name: string; value: number; percentage: number }[];
}

function DistributionSection({ title, data }: DistributionSectionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header flex items-center justify-between">
        <div>
          <span className="text-primary">■</span> {title}
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart */}
          <div className="flex flex-col items-center">
            <p className="terminal-label mb-2">Distribution</p>
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
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
                      borderRadius: '0',
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
                  <th className="terminal-label text-left py-2">{title.split(' ')[0]}</th>
                  <th className="terminal-label text-right py-2">Value</th>
                  <th className="terminal-label text-right py-2">Weight</th>
                  <th className="terminal-label text-right py-2 w-32">Bar</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.name} className="border-b border-border/20 hover:bg-primary/5">
                    <td className="py-2 flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-mono text-xs">{item.name}</span>
                    </td>
                    <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                      ${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="font-mono text-xs text-right tabular-nums font-medium">
                      {item.percentage.toFixed(2)}%
                    </td>
                    <td className="py-2 pl-4">
                      <div className="h-3 bg-muted/30 rounded-sm overflow-hidden">
                        <div 
                          className="h-full rounded-sm transition-all duration-500"
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
            <p className="text-[10px] text-muted-foreground mt-3 font-mono">
              Total analyzed: ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="text-primary">■</span> Top 10 Holdings
      </div>
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="terminal-label text-left py-2">#</th>
              <th className="terminal-label text-left py-2">Ticker</th>
              <th className="terminal-label text-left py-2">Name</th>
              <th className="terminal-label text-right py-2">Value</th>
              <th className="terminal-label text-right py-2">Weight</th>
              <th className="terminal-label text-right py-2 w-40">Concentration</th>
            </tr>
          </thead>
          <tbody>
            {topHoldings.map((holding, index) => (
              <tr key={holding.ticker} className="border-b border-border/20 hover:bg-primary/5">
                <td className="font-mono text-xs py-2 text-muted-foreground">{index + 1}</td>
                <td className="font-mono text-xs py-2 text-primary font-medium">{holding.ticker}</td>
                <td className="font-mono text-xs py-2 text-muted-foreground">{holding.name}</td>
                <td className="font-mono text-xs text-right tabular-nums">
                  ${holding.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="font-mono text-xs text-right tabular-nums font-medium">
                  {holding.weight.toFixed(2)}%
                </td>
                <td className="py-2 pl-4">
                  <div className="h-3 bg-muted/30 rounded-sm overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-sm transition-all duration-500"
                      style={{ width: `${holding.weight}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-muted-foreground mt-3 font-mono">
          Top 10 concentration: {topHoldings.reduce((sum, h) => sum + h.weight, 0).toFixed(2)}%
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

  // Calculate ring data for concentric chart
  const { assetClasses, sectors, positions } = useMemo(() => {
    if (!hasData) {
      return { assetClasses: [], sectors: [], positions: [] };
    }

    const positionsData = calculatePositions(transactions);
    const latestVals = getLatestValuations(valuations);
    
    // Calculate total portfolio value including cash
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

    // Add cash to total
    const cashTotal = (cashBalances?.USD || 0) + (cashBalances?.EUR || 0) + (cashBalances?.ILS || 0);
    totalPortfolioValue += cashTotal;

    // Calculate weights and assign colors
    const positionColors = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD', '#87CEEB', '#F0E68C', '#DEB887', '#98FB98', '#FFA07A', '#B0C4DE', '#FFDAB9', '#E6E6FA', '#F5DEB3', '#D8BFD8', '#FFFACD', '#E0FFFF'];
    
    holdingsData.forEach((h, idx) => {
      h.weight = (h.value / totalPortfolioValue) * 100;
      h.color = positionColors[idx % positionColors.length];
    });

    // Sort by weight
    holdingsData.sort((a, b) => b.weight - a.weight);

    // Group by asset type for asset classes ring
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

    // Add cash as asset class
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

    // Group by geography for sectors ring
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
      positions: holdingsData
    };
  }, [transactions, valuations, cashBalances, hasData]);

  const handleSegmentClick = (segment: RingSegment | { type: string; name: string; weight: number; value: number; ticker?: string; plPercent?: number }) => {
    const id = 'id' in segment ? segment.id : segment.name;
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <div className="section-spacing animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="terminal-label text-base flex items-center gap-2">
            <Scan className="h-4 w-4 text-primary" />
            Portfolio X-RAY
          </h1>
          <p className="text-muted-foreground text-[10px] font-mono mt-0.5">
            Deep analysis of portfolio composition and concentration
          </p>
        </div>
        <div className="text-right">
          <p className="terminal-label">Analysis Date</p>
          <p className="text-sm font-mono tabular-nums text-foreground">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {hasData ? (
        <div className="section-spacing">
          {/* Portfolio Architecture Chart - First */}
          <div className="bloomberg-panel">
            <div className="bloomberg-header">
              <span className="text-primary">■</span> Portfolio Architecture
            </div>
            <div className="p-4">
              {isMobile ? (
                <MobileArchitectureView
                  assetClasses={assetClasses}
                  sectors={sectors}
                  positions={positions}
                  onItemClick={handleSegmentClick}
                />
              ) : (
                <div className="flex justify-center py-4">
                  <ConcentricRingsChart
                    assetClasses={assetClasses}
                    sectors={sectors}
                    positions={positions}
                    onSegmentClick={handleSegmentClick}
                    selectedId={selectedId}
                    className="h-[400px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Distribution Sections - 2 column grid on large screens */}
          <div className="chart-grid">
            <DistributionSection 
              title="Asset Class Distribution" 
              data={assetTypeAllocation} 
            />
            <DistributionSection 
              title="Currency Exposure" 
              data={currencyAllocation} 
            />
          </div>

          {/* Geographic Distribution - Full width with Heat Map */}
          <GeographicHeatMap data={geographyAllocation} />

          {/* Correlation Matrix */}
          <CorrelationMatrix transactions={transactions} valuations={valuations} />

          {/* Top Holdings */}
          <TopHoldingsSection transactions={transactions} valuations={valuations} />
        </div>
      ) : (
        <div className="bloomberg-panel p-8 text-center card-md">
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