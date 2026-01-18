import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Scan, BarChart3, Target, Layers, TrendingUp } from 'lucide-react';
import { CorrelationMatrix } from '@/components/dashboard/CorrelationMatrix';
import { GeographicHeatMap } from '@/components/dashboard/GeographicHeatMap';
import { ConcentricRingsChart } from '@/components/portfolio/ConcentricRingsChart';
import { RiskReturnScatter } from '@/components/dashboard/RiskReturnScatter';
import { useIsMobile } from '@/hooks/use-mobile';
import { RingSegment } from '@/lib/portfolioEngine';

const COLORS = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD'];

interface DistributionSectionProps {
  title: string;
  data: { name: string; value: number; percentage: number }[];
}

function DistributionSection({ title, data }: DistributionSectionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 bg-secondary">
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

/**
 * TopHoldingsSection - Uses centralized portfolio data
 */
function TopHoldingsSection({ holdings }: { holdings: { ticker: string; name: string; currentValue: number; weight: number }[] }) {
  const topHoldings = holdings.slice(0, 10);

  return (
    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 bg-secondary">
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
                  ${holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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

/**
 * XRay Page - Now uses Single Source of Truth from PortfolioContext
 * NO LOCAL CALCULATIONS - all data comes from computedData
 */
export default function XRay() {
  // SINGLE SOURCE OF TRUTH: Use computedData from context
  const { transactions, valuations, computedData } = usePortfolio();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // All data comes from centralized computedData - NO LOCAL CALCULATIONS
  const {
    totalPortfolioValue,
    cashPercent,
    positionsCount,
    holdings,
    assetTypeAllocation,
    geographyAllocation,
    currencyAllocation,
    assetClassRings,
    geographyRings,
    positionRings,
    riskReturnData
  } = computedData;

  const hasData = transactions.length > 0 && valuations.length > 0;

  const handleSegmentClick = (segment: RingSegment, _type: 'asset-class' | 'sector' | 'position') => {
    setSelectedId(prev => prev === segment.id ? null : segment.id);
  };

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

            {/* Mobile KPIs */}
            <div className="md:hidden grid grid-cols-3 gap-2 px-4 py-3 bg-muted/10">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Total Value</p>
                <p className="text-xs font-mono font-semibold text-foreground tabular-nums">
                  ${(totalPortfolioValue / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="text-center border-x border-border/30">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Positions</p>
                <p className="text-xs font-mono font-semibold text-foreground tabular-nums">{positionsCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Cash</p>
                <p className="text-xs font-mono font-semibold text-foreground tabular-nums">{cashPercent.toFixed(1)}%</p>
              </div>
            </div>

            {/* Chart Area - Using centralized ring data */}
            <div className="p-4 md:p-6">
              <ConcentricRingsChart
                assetClasses={assetClassRings}
                sectors={geographyRings}
                positions={positionRings}
                selectedId={selectedId}
                onSegmentClick={handleSegmentClick}
              />
            </div>

            {/* Legend */}
            <div className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border-2 border-primary/60"></div>
                  <span>Asset Classes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border-2 border-accent/60"></div>
                  <span>Geography</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary/40 to-accent/40"></div>
                  <span>Holdings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk / Return Scatter Plot */}
          <RiskReturnScatter 
            holdings={riskReturnData.holdings}
            portfolio={riskReturnData.portfolio}
            excludedCount={riskReturnData.excludedCount}
          />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="bg-card/50 border border-border/40 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Asset Classes</span>
              </div>
              <p className="text-lg md:text-xl font-mono font-bold text-foreground">{assetClassRings.length}</p>
            </div>
            <div className="bg-card/50 border border-border/40 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Regions</span>
              </div>
              <p className="text-lg md:text-xl font-mono font-bold text-foreground">{geographyRings.length}</p>
            </div>
            <div className="bg-card/50 border border-border/40 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Holdings</span>
              </div>
              <p className="text-lg md:text-xl font-mono font-bold text-foreground">{positionsCount}</p>
            </div>
            <div className="bg-card/50 border border-border/40 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Top 5 Weight</span>
              </div>
              <p className="text-lg md:text-xl font-mono font-bold text-foreground">
                {holdings.slice(0, 5).reduce((sum, h) => sum + h.weight, 0).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Distribution Sections - Using centralized allocation data */}
          <DistributionSection title="Asset Class Distribution" data={assetTypeAllocation} />
          <DistributionSection title="Currency Distribution" data={currencyAllocation} />
          
          {/* Geographic Heat Map */}
          <GeographicHeatMap data={geographyAllocation} />

          {/* Correlation Matrix */}
          <CorrelationMatrix transactions={transactions} valuations={valuations} />
        </>
      ) : (
        <div className="bloomberg-panel p-8 text-center">
          <Scan className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-base font-semibold mb-2 text-foreground">No Data Available</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Add transactions and monthly valuations to see the portfolio X-Ray analysis.
          </p>
        </div>
      )}
    </div>
  );
}
