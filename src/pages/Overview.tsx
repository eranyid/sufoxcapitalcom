import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { calculateAllocations } from '@/lib/calculations';
import { DollarSign, TrendingUp, TrendingDown, Activity, BarChart3, PieChart } from 'lucide-react';

export default function Overview() {
  const { transactions, valuations, performanceMetrics } = usePortfolio();

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time performance snapshot</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="text-lg font-medium">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Charts Row 1 */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart 
              data={performanceMetrics.monthlyReturns}
              title="Monthly & Cumulative Returns"
              showCumulative
              cumulativeData={performanceMetrics.cumulativeReturns}
            />
            <DrawdownChart data={performanceMetrics.drawdownSeries} />
          </div>

          {/* Allocation Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AllocationChart data={assetTypeAllocation} title="Asset Class Allocation" />
            <AllocationChart data={geographyAllocation} title="Geographic Allocation" />
          </div>
        </>
      ) : (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start by adding transactions and monthly valuations to see your portfolio analytics and performance metrics.
          </p>
        </div>
      )}
    </div>
  );
}
