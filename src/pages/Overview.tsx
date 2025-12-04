import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { CashManagement } from '@/components/dashboard/CashManagement';
import { calculateAllocations } from '@/lib/calculations';
import { generatePDFReport } from '@/lib/pdfReport';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, 
  BarChart3, FileDown, FileSpreadsheet, Calendar
} from 'lucide-react';

export default function Overview() {
  const { transactions, valuations, performanceMetrics, riskMetrics, loading } = usePortfolio();

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

  // Calculate best/worst month
  const bestMonth = hasData && performanceMetrics.monthlyReturns.length > 0
    ? Math.max(...performanceMetrics.monthlyReturns.map(m => m.return))
    : 0;
  const worstMonth = hasData && performanceMetrics.monthlyReturns.length > 0
    ? Math.min(...performanceMetrics.monthlyReturns.map(m => m.return))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-muted-foreground text-xs font-mono">LOADING PORTFOLIO DATA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header Block */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header justify-between">
          <div className="flex items-center gap-4">
            <span className="bloomberg-header-title">OVRV</span>
            <span className="text-muted-foreground text-xxs font-mono">Portfolio Overview</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="h-6 px-2 text-xxs font-mono uppercase gap-1">
              <FileDown className="h-3 w-3" />
              PDF
            </Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xxs font-mono uppercase gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              EXCEL
            </Button>
          </div>
        </div>
        <div className="p-2 flex items-center justify-between text-xxs font-mono">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">PORTFOLIO: </span>
              <span className="text-foreground">SUFOX Capital Master Fund</span>
            </div>
            <div>
              <span className="text-muted-foreground">INCEPTION: </span>
              <span className="text-foreground">Jan 2024</span>
            </div>
            <div>
              <span className="text-muted-foreground">BENCHMARK: </span>
              <span className="text-foreground">SPX / 60-40</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Last Update: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid - Row 1: Value & Returns */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <KPICard
          title="Total Portfolio Value"
          value={hasData ? formatCurrency(performanceMetrics.totalValue) : '$0'}
          icon={DollarSign}
          trend={hasData && performanceMetrics.totalPL >= 0 ? 'up' : 'down'}
          trendValue={hasData ? `${performanceMetrics.totalPL >= 0 ? '+' : ''}${formatCurrency(performanceMetrics.totalPL)} P/L` : undefined}
          tooltip="Current market value of all holdings"
          size="lg"
        />
        <KPICard
          title="Total Return"
          value={hasData ? formatPercent(performanceMetrics.totalReturn) : '0.00%'}
          icon={TrendingUp}
          trend={hasData && performanceMetrics.totalReturn >= 0 ? 'up' : 'down'}
          subtitle="Since inception"
          tooltip="Time-weighted return since portfolio inception"
          size="lg"
        />
        <KPICard
          title="IRR"
          value={hasData ? `${performanceMetrics.irr.toFixed(2)}%` : '0.00%'}
          trend={hasData && performanceMetrics.irr >= 0 ? 'up' : 'down'}
          subtitle="Internal Rate of Return"
          tooltip="Money-weighted return accounting for cash flows"
          size="lg"
        />
        <KPICard
          title="TWR"
          value={hasData ? formatPercent(performanceMetrics.twr) : '0.00%'}
          trend={hasData && performanceMetrics.twr >= 0 ? 'up' : 'down'}
          subtitle="Time-Weighted Return"
          tooltip="Return excluding impact of cash flows"
          size="lg"
        />
      </div>

      {/* KPI Grid - Row 2: Risk */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <KPICard
          title="Volatility"
          value={hasData ? `${performanceMetrics.volatility.toFixed(2)}%` : '0.00%'}
          icon={Activity}
          subtitle="Annualized"
          tooltip="Standard deviation of monthly returns, annualized"
        />
        <KPICard
          title="Sharpe Ratio"
          value={hasData ? performanceMetrics.sharpeRatio.toFixed(2) : '0.00'}
          trend={hasData && performanceMetrics.sharpeRatio >= 1 ? 'up' : 'neutral'}
          subtitle="Risk-Adj Return"
          tooltip="Excess return per unit of risk (higher is better)"
        />
        <KPICard
          title="Max Drawdown"
          value={hasData ? `-${performanceMetrics.maxDrawdown.toFixed(2)}%` : '0.00%'}
          icon={TrendingDown}
          trend="down"
          subtitle="Peak to Trough"
          tooltip="Largest decline from peak to trough"
        />
        <KPICard
          title="Win/Loss Ratio"
          value={hasData ? performanceMetrics.winLossRatio.toFixed(2) : '0.00'}
          subtitle="Positive/Negative Months"
          tooltip="Ratio of winning months to losing months"
        />
      </div>

      {/* KPI Grid - Row 3: P&L */}
      <div className="grid grid-cols-4 gap-px bg-border">
        <KPICard
          title="Unrealized P/L"
          value={hasData ? formatCurrency(performanceMetrics.unrealizedPL) : '$0'}
          trend={hasData && performanceMetrics.unrealizedPL >= 0 ? 'up' : 'down'}
          tooltip="Profit/Loss on open positions"
        />
        <KPICard
          title="Realized P/L"
          value={hasData ? formatCurrency(performanceMetrics.realizedPL) : '$0'}
          trend={hasData && performanceMetrics.realizedPL >= 0 ? 'up' : 'down'}
          tooltip="Profit/Loss on closed positions"
        />
        <KPICard
          title="Best Month"
          value={hasData ? formatPercent(bestMonth) : '0.00%'}
          trend="up"
          tooltip="Best performing month"
        />
        <KPICard
          title="Worst Month"
          value={hasData ? formatPercent(worstMonth) : '0.00%'}
          trend="down"
          tooltip="Worst performing month"
        />
      </div>

      {/* Cash Management */}
      <CashManagement />

      {/* Current Holdings */}
      {transactions.length > 0 && valuations.length > 0 && (
        <HoldingsTable transactions={transactions} valuations={valuations} />
      )}

      {/* Charts Row 1 */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
            <PerformanceChart 
              data={performanceMetrics.monthlyReturns}
              title="Monthly & Cumulative Returns"
              showCumulative
              cumulativeData={performanceMetrics.cumulativeReturns}
            />
            <DrawdownChart data={performanceMetrics.drawdownSeries} />
          </div>

          {/* Allocation Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            <AllocationChart data={assetTypeAllocation} title="Asset Class Allocation" />
            <AllocationChart data={geographyAllocation} title="Geographic Allocation" />
          </div>
        </>
      ) : (
        <div className="bloomberg-panel p-6 text-center">
          <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-sm font-mono font-medium mb-1 text-primary">NO DATA AVAILABLE</h3>
          <p className="text-muted-foreground text-xxs font-mono max-w-md mx-auto">
            Add transactions and monthly valuations to see portfolio analytics.
          </p>
        </div>
      )}
    </div>
  );
}