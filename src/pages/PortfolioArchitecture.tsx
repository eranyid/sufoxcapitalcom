import { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Card } from '@/components/ui/card';
import { ConcentricRingsChart } from '@/components/portfolio/ConcentricRingsChart';
import { ArchitectureKPIPanel } from '@/components/portfolio/ArchitectureKPIPanel';
import { ArchitectureDetailsPanel, DetailsData } from '@/components/portfolio/ArchitectureDetailsPanel';
import { MobileArchitectureView } from '@/components/portfolio/MobileArchitectureView';
import { useIsMobile } from '@/hooks/use-mobile';
import { Layers, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// Color palettes for different segment types
const ASSET_CLASS_COLORS: Record<string, string> = {
  equity: 'hsl(25, 95%, 53%)', // SUFOX orange
  bond: 'hsl(210, 70%, 50%)',
  fixed_income: 'hsl(210, 70%, 50%)',
  alternative: 'hsl(280, 60%, 55%)',
  alternatives: 'hsl(280, 60%, 55%)',
  cash: 'hsl(150, 60%, 45%)',
  real_estate: 'hsl(45, 70%, 50%)',
  commodity: 'hsl(35, 80%, 55%)',
  crypto: 'hsl(200, 80%, 50%)',
  etf: 'hsl(25, 80%, 60%)',
  mutual_fund: 'hsl(220, 60%, 55%)',
  private_equity: 'hsl(300, 50%, 50%)',
  private_debt: 'hsl(180, 50%, 45%)',
  hedge_fund: 'hsl(260, 60%, 55%)',
};

const SECTOR_COLORS = [
  'hsl(200, 70%, 50%)', // Tech
  'hsl(340, 65%, 50%)', // Healthcare
  'hsl(45, 75%, 50%)', // Industrials
  'hsl(160, 60%, 45%)', // Financials
  'hsl(25, 80%, 55%)', // Energy
  'hsl(280, 55%, 55%)', // Consumer
  'hsl(100, 50%, 45%)', // Materials
  'hsl(220, 65%, 55%)', // Utilities
  'hsl(0, 60%, 50%)', // Real Estate
  'hsl(180, 55%, 50%)', // Communication
];

const POSITION_COLORS = [
  'hsl(25, 85%, 55%)',
  'hsl(200, 75%, 55%)',
  'hsl(160, 65%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(45, 75%, 55%)',
  'hsl(340, 60%, 55%)',
  'hsl(100, 55%, 50%)',
  'hsl(220, 65%, 55%)',
  'hsl(0, 55%, 55%)',
  'hsl(180, 60%, 50%)',
];

export default function PortfolioArchitecture() {
  const { transactions, valuations, performanceMetrics, cashBalances } = usePortfolio();
  const isMobile = useIsMobile();
  const [selectedDetails, setSelectedDetails] = useState<DetailsData | null>(null);

  // Calculate positions with latest valuations
  const positions = useMemo(() => {
    const positionMap = new Map<string, {
      ticker: string;
      name: string;
      quantity: number;
      type: string;
      geography: string;
      currency: string;
      totalCost: number;
    }>();

    transactions.forEach(tx => {
      const existing = positionMap.get(tx.ticker) || {
        ticker: tx.ticker,
        name: tx.assetName,
        quantity: 0,
        type: tx.assetType,
        geography: tx.geography,
        currency: tx.currency,
        totalCost: 0
      };

      if (tx.transactionType === 'buy') {
        existing.quantity += tx.quantity;
        existing.totalCost += tx.quantity * tx.pricePerUnit + (tx.fees || 0);
      } else {
        existing.quantity -= tx.quantity;
      }

      positionMap.set(tx.ticker, existing);
    });

    // Filter only active positions
    return Array.from(positionMap.values()).filter(p => p.quantity > 0);
  }, [transactions]);

  // Get latest valuations
  const latestValuations = useMemo(() => {
    const valMap = new Map<string, number>();
    valuations.forEach(v => {
      const existing = valMap.get(v.ticker);
      if (!existing || v.month > (valuations.find(x => x.ticker === v.ticker && x.pricePerUnit === existing)?.month || '')) {
        valMap.set(v.ticker, v.pricePerUnit);
      }
    });
    return valMap;
  }, [valuations]);

  // Calculate total portfolio value
  const totalValue = useMemo(() => {
    let holdingsValue = 0;
    positions.forEach(p => {
      const price = latestValuations.get(p.ticker) || 0;
      holdingsValue += p.quantity * price;
    });
    const cashValue = (cashBalances.USD || 0) + (cashBalances.EUR || 0) + (cashBalances.ILS || 0);
    return holdingsValue + cashValue;
  }, [positions, latestValuations, cashBalances]);

  // Build asset class segments
  const assetClasses = useMemo(() => {
    const classMap = new Map<string, { value: number; weight: number }>();
    
    positions.forEach(p => {
      const price = latestValuations.get(p.ticker) || 0;
      const posValue = p.quantity * price;
      const existing = classMap.get(p.type) || { value: 0, weight: 0 };
      existing.value += posValue;
      classMap.set(p.type, existing);
    });

    // Add cash
    const cashValue = (cashBalances.USD || 0) + (cashBalances.EUR || 0) + (cashBalances.ILS || 0);
    if (cashValue > 0) {
      classMap.set('cash', { value: cashValue, weight: 0 });
    }

    return Array.from(classMap.entries()).map(([type, data]) => ({
      id: `ac-${type}`,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: data.value,
      weight: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      color: ASSET_CLASS_COLORS[type] || 'hsl(var(--muted-foreground))',
    }));
  }, [positions, latestValuations, cashBalances, totalValue]);

  // Build sector segments (using geography as proxy since we don't have sector data)
  const sectors = useMemo(() => {
    const sectorMap = new Map<string, { value: number; weight: number }>();
    
    positions.forEach(p => {
      const price = latestValuations.get(p.ticker) || 0;
      const posValue = p.quantity * price;
      const sector = p.geography || 'other';
      const existing = sectorMap.get(sector) || { value: 0, weight: 0 };
      existing.value += posValue;
      sectorMap.set(sector, existing);
    });

    let colorIndex = 0;
    return Array.from(sectorMap.entries()).map(([sector, data]) => ({
      id: `sec-${sector}`,
      name: sector.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: data.value,
      weight: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      color: SECTOR_COLORS[colorIndex++ % SECTOR_COLORS.length],
    }));
  }, [positions, latestValuations, totalValue]);

  // Build position segments
  const positionSegments = useMemo(() => {
    let colorIndex = 0;
    return positions.map(p => {
      const price = latestValuations.get(p.ticker) || 0;
      const posValue = p.quantity * price;
      const costBasis = p.totalCost / p.quantity;
      const plPercent = costBasis > 0 ? ((price - costBasis) / costBasis) * 100 : 0;

      return {
        id: `pos-${p.ticker}`,
        name: p.name,
        ticker: p.ticker,
        value: posValue,
        weight: totalValue > 0 ? (posValue / totalValue) * 100 : 0,
        color: POSITION_COLORS[colorIndex++ % POSITION_COLORS.length],
        plPercent,
        geography: p.geography,
        currency: p.currency,
      };
    }).sort((a, b) => b.weight - a.weight);
  }, [positions, latestValuations, totalValue]);

  // KPI data
  const kpiData = useMemo(() => {
    const cashValue = (cashBalances.USD || 0) + (cashBalances.EUR || 0) + (cashBalances.ILS || 0);
    
    return {
      totalValue,
      totalExposure: totalValue - cashValue,
      cashPercent: totalValue > 0 ? (cashValue / totalValue) * 100 : 0,
      positionCount: positions.length,
      topContributors: positionSegments
        .slice(0, 3)
        .map(p => ({ name: p.ticker, contribution: p.plPercent || 0 })),
    };
  }, [totalValue, cashBalances, positions, positionSegments]);

  const handleSegmentClick = (segment: any, type: 'asset-class' | 'sector' | 'position') => {
    setSelectedDetails({
      type,
      name: segment.name,
      weight: segment.weight,
      value: segment.value,
      ticker: segment.ticker,
      plPercent: segment.plPercent,
      geography: segment.geography,
      currency: segment.currency,
      positions: type !== 'position' ? positions.length : undefined,
    });
  };

  const hasData = transactions.length > 0 || (cashBalances.USD || 0) + (cashBalances.EUR || 0) + (cashBalances.ILS || 0) > 0;

  return (
    <>
      <Helmet>
        <title>Portfolio Architecture | SUFOX Terminal</title>
        <meta name="description" content="Visualize your portfolio structure with interactive concentric-ring architecture view" />
      </Helmet>

      <div className="min-h-screen p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="text-primary" size={24} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Portfolio Architecture</h1>
              <p className="text-xs md:text-sm text-muted-foreground font-mono">
                Structural visualization of capital allocation
              </p>
            </div>
          </div>
        </div>

        {!hasData ? (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto text-muted-foreground mb-3" size={32} />
            <h3 className="text-lg font-semibold text-foreground">No Portfolio Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add transactions or cash balances to visualize your portfolio architecture.
            </p>
          </Card>
        ) : (
          <div className="relative">
            {isMobile ? (
              <div className="space-y-4">
                {/* Mobile KPI Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-card/80">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">NAV</span>
                    <p className="text-lg font-mono font-semibold text-foreground">
                      ${(kpiData.totalValue / 1000000).toFixed(2)}M
                    </p>
                  </Card>
                  <Card className="p-3 bg-card/80">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Positions</span>
                    <p className="text-lg font-mono font-semibold text-foreground">
                      {kpiData.positionCount}
                    </p>
                  </Card>
                </div>

                {/* Mobile Architecture View */}
                <MobileArchitectureView
                  assetClasses={assetClasses}
                  sectors={sectors}
                  positions={positionSegments}
                  onItemClick={setSelectedDetails}
                />

                {/* Mobile Details Panel */}
                {selectedDetails && (
                  <ArchitectureDetailsPanel
                    data={selectedDetails}
                    onClose={() => setSelectedDetails(null)}
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                {/* Main Chart Area */}
                <div className="col-span-8 xl:col-span-9">
                  <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 min-h-[600px] flex items-center justify-center">
                    <ConcentricRingsChart
                      assetClasses={assetClasses}
                      sectors={sectors}
                      positions={positionSegments}
                      onSegmentClick={handleSegmentClick}
                      selectedId={selectedDetails?.name ? `pos-${selectedDetails.ticker}` : null}
                      className="w-full max-w-[600px]"
                    />
                  </Card>
                </div>

                {/* Right Panel - KPIs & Details */}
                <div className="col-span-4 xl:col-span-3 space-y-4">
                  <ArchitectureKPIPanel data={kpiData} />
                  
                  {selectedDetails && (
                    <ArchitectureDetailsPanel
                      data={selectedDetails}
                      onClose={() => setSelectedDetails(null)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Future hooks placeholder - hidden */}
        <div className="hidden">
          {/* Stress Scenarios overlay hook */}
          {/* Risk Heat-map view hook */}
          {/* Time-series Architecture over time hook */}
        </div>
      </div>
    </>
  );
}
