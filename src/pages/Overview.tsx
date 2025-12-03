import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { calculateAllocations } from '@/lib/calculations';
import { generatePDFReport } from '@/lib/pdfReport';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Activity, BarChart3, FileDown } from 'lucide-react';
export default function Overview() {
  const { transactions, valuations, performanceMetrics, riskMetrics } = usePortfolio();

  const handleExportPDF = () => {
    generatePDFReport({
      transactions,
      valuations,
      performanceMetrics,
      riskMetrics
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const assetTypeAllocation = calculateAllocations(transactions, valuations, 'assetType');
  const geographyAllocation = calculateAllocations(transactions, valuations, 'geography');

  const hasData = performanceMetrics !== null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="terminal-label text-base">Portfolio Overview</h1>
          <p className="text-muted-foreground text-[10px] font-mono mt-0.5">Real-time performance snapshot</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider h-7 px-2">
            <FileDown className="h-3 w-3" />
            Export
          </Button>
          <div className="text-right">
            <p className="terminal-label">Last Updated</p>
            <p className="text-sm font-mono tabular-nums text-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KPICard
          title="Total Portfolio Value"
          value={hasData ? formatCurrency(performanceMetrics.totalValue) : '$0'}
          icon={DollarSign}
          trend={hasData && performanceMetrics.totalPL >= 0 ? 'up' : 'down'}
          trendValue={hasData ? formatCurrency(performanceMetrics.totalPL) : undefined}
        />
        <KPICard
          title="Total Return"
          value={hasData ? formatPercent(performanceMetrics.totalReturn) : '0.00%'}
          icon={TrendingUp}
          trend={hasData && performanceMetrics.totalReturn >= 0 ? 'up' : 'down'}
          subtitle="Since inception"
        />
        <KPICard
          title="Sharpe Ratio"
          value={hasData ? performanceMetrics.sharpeRatio.toFixed(2) : '0.00'}
          icon={Activity}
          trend={hasData && performanceMetrics.sharpeRatio >= 1 ? 'up' : 'neutral'}
          subtitle="Risk-adjusted return"
        />
        <KPICard
          title="Max Drawdown"
          value={hasData ? `-${performanceMetrics.maxDrawdown.toFixed(2)}%` : '0.00%'}
          icon={TrendingDown}
          trend="down"
          subtitle="Peak to trough"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <KPICard
          title="Realized P/L"
          value={hasData ? formatCurrency(performanceMetrics.realizedPL) : '$0'}
          trend={hasData && performanceMetrics.realizedPL >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Unrealized P/L"
          value={hasData ? formatCurrency(performanceMetrics.unrealizedPL) : '$0'}
          trend={hasData && performanceMetrics.unrealizedPL >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Volatility"
          value={hasData ? `${performanceMetrics.volatility.toFixed(2)}%` : '0.00%'}
          subtitle="Annualized"
        />
        <KPICard
          title="IRR"
          value={hasData ? `${performanceMetrics.irr.toFixed(2)}%` : '0.00%'}
          trend={hasData && performanceMetrics.irr >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="TWR"
          value={hasData ? formatPercent(performanceMetrics.twr) : '0.00%'}
          trend={hasData && performanceMetrics.twr >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Win/Loss"
          value={hasData ? performanceMetrics.winLossRatio.toFixed(2) : '0.00'}
          subtitle="Ratio"
        />
      </div>

      {/* Current Holdings */}
      {transactions.length > 0 && valuations.length > 0 && (
        <HoldingsTable transactions={transactions} valuations={valuations} />
      )}

      {/* Charts Row 1 */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <PerformanceChart 
              data={performanceMetrics.monthlyReturns}
              title="Monthly & Cumulative Returns"
              showCumulative
              cumulativeData={performanceMetrics.cumulativeReturns}
            />
            <DrawdownChart data={performanceMetrics.drawdownSeries} />
          </div>

          {/* Allocation Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <AllocationChart data={assetTypeAllocation} title="Asset Class Allocation" />
            <AllocationChart data={geographyAllocation} title="Geographic Allocation" />
          </div>
        </>
      ) : (
        <div className="bloomberg-panel p-8 text-center">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">No Data Available</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            Add transactions and monthly valuations to see portfolio analytics.
          </p>
        </div>
      )}
    </div>
  );
}
