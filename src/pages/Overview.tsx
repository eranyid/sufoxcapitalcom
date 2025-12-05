import { useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { CashManagement } from '@/components/dashboard/CashManagement';
import { PolicyFitCheck } from '@/components/dashboard/PolicyFitCheck';
import { calculateAllocations, calculateCorrelationMatrix } from '@/lib/calculations';
import { generatePDFReport, MonteCarloResultsForPDF, CorrelationMatrixForPDF } from '@/lib/pdfReport';
import { computeFactorModel } from '@/lib/factorModel';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Activity, BarChart3, FileDown } from 'lucide-react';

// Monte Carlo helper functions
function toLogReturns(simpleReturns: number[]): number[] {
  return simpleReturns.map(r => Math.log(1 + r / 100));
}

function calculateStats(logReturns: number[]): { mean: number; std: number } {
  const n = logReturns.length;
  if (n === 0) return { mean: 0, std: 0 };
  const mean = logReturns.reduce((a, b) => a + b, 0) / n;
  const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  return { mean, std: Math.sqrt(variance) };
}

function generateNormalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function runMonteCarloForPDF(logReturns: number[], initialValue: number, years: number, numSims: number) {
  const stats = calculateStats(logReturns);
  const monthlyMean = stats.mean;
  const monthlyStd = stats.std;
  const totalSteps = years * 12;
  
  const finalValues: number[] = [];
  for (let sim = 0; sim < numSims; sim++) {
    let value = initialValue;
    for (let step = 0; step < totalSteps; step++) {
      const z = generateNormalRandom();
      const logReturn = monthlyMean - 0.5 * monthlyStd * monthlyStd + monthlyStd * z;
      value = value * Math.exp(logReturn);
    }
    finalValues.push(value);
  }
  return finalValues.sort((a, b) => a - b);
}

function getPercentile(sortedValues: number[], percentile: number): number {
  const index = Math.floor((percentile / 100) * sortedValues.length);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

export default function Overview() {
  const { transactions, valuations, performanceMetrics, riskMetrics, loading } = usePortfolio();

  // Compute factor model
  const factorModel = useMemo(() => {
    if (transactions.length === 0 || valuations.length === 0) return null;
    return computeFactorModel(transactions, valuations);
  }, [transactions, valuations]);

  // Compute Monte Carlo results for PDF
  const monteCarloResults = useMemo((): MonteCarloResultsForPDF | null => {
    if (!performanceMetrics || performanceMetrics.monthlyReturns.length < 3) return null;
    
    const monthlyReturns = performanceMetrics.monthlyReturns.map(r => r.return);
    const logReturns = toLogReturns(monthlyReturns);
    const stats = calculateStats(logReturns);
    const currentValue = performanceMetrics.totalValue;
    const numSims = 5000;
    
    const horizons = [20, 50, 65];
    const horizonResults = horizons.map(horizon => {
      const finalValues = runMonteCarloForPDF(logReturns, currentValue, horizon, numSims);
      const probGain = (finalValues.filter(v => v > currentValue).length / finalValues.length) * 100;
      const cutoffIndex = Math.floor(0.05 * finalValues.length);
      const p5Value = finalValues[cutoffIndex];
      const var95 = ((p5Value - currentValue) / currentValue) * 100;
      const tailValues = finalValues.slice(0, cutoffIndex + 1);
      const avgTail = tailValues.reduce((a, b) => a + b, 0) / tailValues.length;
      const cvar95 = ((avgTail - currentValue) / currentValue) * 100;
      
      return {
        horizon,
        p5: getPercentile(finalValues, 5),
        p25: getPercentile(finalValues, 25),
        p50: getPercentile(finalValues, 50),
        p75: getPercentile(finalValues, 75),
        p95: getPercentile(finalValues, 95),
        probGain,
        probLoss: 100 - probGain,
        var95,
        cvar95,
        expectedValue: finalValues.reduce((a, b) => a + b, 0) / finalValues.length,
      };
    });

    return {
      horizonResults,
      currentValue,
      annualizedReturn: (Math.exp(stats.mean * 12) - 1) * 100,
      annualizedVol: stats.std * Math.sqrt(12) * 100,
      numSimulations: numSims,
    };
  }, [performanceMetrics]);

  // Compute correlation matrix for PDF
  const correlationMatrix = useMemo((): CorrelationMatrixForPDF | null => {
    if (transactions.length === 0 || valuations.length === 0) return null;
    const result = calculateCorrelationMatrix(transactions, valuations);
    if (result.tickers.length < 2) return null;
    return result;
  }, [transactions, valuations]);

  const handleExportPDF = () => {
    generatePDFReport({
      transactions,
      valuations,
      performanceMetrics,
      riskMetrics,
      factorModel,
      monteCarlo: monteCarloResults,
      correlationMatrix,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-mono">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-spacing animate-fade-in">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="terminal-label text-sm sm:text-base">Portfolio Overview</h1>
          <p className="text-muted-foreground text-[10px] sm:text-[10px] font-mono mt-0.5">Real-time performance snapshot</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            size="sm" 
            className="gap-1.5 font-mono text-[10px] uppercase tracking-wider h-9 sm:h-7 px-3 sm:px-2 touch-target"
          >
            <FileDown className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <div className="text-right hidden sm:block">
            <p className="terminal-label">Last Updated</p>
            <p className="text-sm font-mono tabular-nums text-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Primary KPIs - Mobile Optimized 2-col grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-2">
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
          subtitle="Risk-adjusted"
        />
        <KPICard
          title="Max Drawdown"
          value={hasData ? `-${performanceMetrics.maxDrawdown.toFixed(2)}%` : '0.00%'}
          icon={TrendingDown}
          trend="down"
          subtitle="Peak to trough"
        />
      </div>

      {/* Secondary KPIs - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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

      {/* Cash Management & Policy Check - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2">
          <CashManagement />
        </div>
        <PolicyFitCheck />
      </div>

      {/* Current Holdings */}
      {transactions.length > 0 && valuations.length > 0 && (
        <HoldingsTable transactions={transactions} valuations={valuations} />
      )}

      {/* Charts - Stack on mobile */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <PerformanceChart 
              data={performanceMetrics.monthlyReturns}
              title="Monthly & Cumulative Returns"
              showCumulative
              cumulativeData={performanceMetrics.cumulativeReturns}
            />
            <DrawdownChart data={performanceMetrics.drawdownSeries} />
          </div>

          {/* Allocation Charts - Stack on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <AllocationChart data={assetTypeAllocation} title="Asset Class Allocation" />
            <AllocationChart data={geographyAllocation} title="Geographic Allocation" />
          </div>
        </>
      ) : (
        <div className="bloomberg-panel p-6 sm:p-8 text-center">
          <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">No Data Available</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            Add transactions and monthly valuations to see portfolio analytics.
          </p>
        </div>
      )}
    </div>
  );
}