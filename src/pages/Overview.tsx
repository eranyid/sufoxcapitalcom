import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '@/context/PortfolioContext';
import { useFxMode } from '@/context/FxModeContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/dashboard/KPICard';
import { FxModeToggle } from '@/components/dashboard/FxModeToggle';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { NavEquityCurve } from '@/components/dashboard/NavEquityCurve';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { CashManagement } from '@/components/dashboard/CashManagement';
import { PolicyFitCheck } from '@/components/dashboard/PolicyFitCheck';
import { NewsTicker } from '@/components/dashboard/NewsTicker';
import { OpenIssuesWidget } from '@/components/backoffice/OpenIssuesWidget';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { CapitalLedgerView } from '@/components/dashboard/CapitalLedgerView';
import { AllocationDriftWidget } from '@/components/dashboard/AllocationDriftWidget';
import { StaggeredContainer } from '@/components/StaggeredContainer';
import { ProspectusButton } from '@/components/ProspectusButton';


import { computeFactorModel } from '@/lib/factorModel';
import { calculateYTDReturn } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Activity, BarChart3, FileText } from 'lucide-react';

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
  const { transactions, valuations, performanceMetrics, riskMetrics, cashBalances, settings, loading, fxRates, previousMonthFxRates, computedData } = usePortfolio();
  const { fxMode, fxLabel } = useFxMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rssFeedUrl, setRssFeedUrl] = useState<string | null>(null);
  const { tasks } = useCrmTasks();

  // Calculate Real vs Nominal metrics
  // For holdings in base currency (USD), there's no FX impact - Real and Nominal should be the same
  // The FX difference only matters for:
  // 1. Holdings in foreign currency (comparing entry FX vs current FX)
  // 2. Cash in foreign currency (comparing value at different FX rates)
  const adjustedMetrics = useMemo(() => {
    if (!performanceMetrics) return null;
    
    const isNominal = fxMode === 'nominal';
    
    // fxPL from holdings only (calculated from entry vs current FX rates)
    const holdingsFxPL = performanceMetrics.fxPL;
    
    // In Nominal mode: subtract the FX component from unrealized P/L
    // unrealizedPL = marketPL + fxPL, so marketPL = unrealizedPL - fxPL
    const unrealizedPL = isNominal 
      ? performanceMetrics.unrealizedPL - holdingsFxPL 
      : performanceMetrics.unrealizedPL;
    
    const totalPL = isNominal
      ? performanceMetrics.realizedPL + unrealizedPL
      : performanceMetrics.totalPL;
    
    // Total value adjustment: in nominal mode, we subtract the FX component
    const totalValue = isNominal
      ? performanceMetrics.totalValue - holdingsFxPL
      : performanceMetrics.totalValue;
    
    return {
      ...performanceMetrics,
      unrealizedPL,
      totalPL,
      totalValue,
    };
  }, [performanceMetrics, fxMode]);

  // Calculate YTD Return using the new P/L-based formula
  const ytdData = useMemo(() => {
    if (transactions.length === 0 || valuations.length === 0) {
      return { ytdReturn: 0, ytdPL: 0, ytdFxPL: 0, janValue: 0, cashFxPL: 0 };
    }
    return calculateYTDReturn(
      transactions, 
      valuations, 
      cashBalances, 
      settings.baseCurrency as 'USD' | 'ILS',
      fxRates,
      previousMonthFxRates
    );
  }, [transactions, valuations, cashBalances, settings.baseCurrency, fxRates, previousMonthFxRates]);

  // Load RSS feed URL
  useEffect(() => {
    const loadRssFeed = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('portfolio_settings')
        .select('rss_feed_url')
        .eq('user_id', user.id)
        .single();
      setRssFeedUrl(data?.rss_feed_url || null);
    };
    loadRssFeed();
  }, [user]);

  // Compute factor model
  const factorModel = useMemo(() => {
    if (transactions.length === 0 || valuations.length === 0) return null;
    return computeFactorModel(transactions, valuations);
  }, [transactions, valuations]);

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


  const hasData = performanceMetrics !== null;

  // === RUNTIME FINGERPRINT + KPI VALIDATION ===
  useEffect(() => {
    if (!hasData || !adjustedMetrics) return;
    
    // Cross-check: computedData (portfolioEngine) vs performanceMetrics (calculations.ts)
    const engineUnrealizedPL = computedData.holdings.reduce((sum, h) => sum + h.unrealizedPL, 0);
    const engineCostBasis = computedData.holdings.reduce((sum, h) => sum + h.costBasis, 0);
    const engineUnrealizedPct = engineCostBasis > 0 ? (engineUnrealizedPL / engineCostBasis) * 100 : 0;
    
    // FINGERPRINT LOG — proves this version is running
    console.log("[KPI_ENGINE_VERSION] 2026-02-06-v1", {
      navToday: computedData.totalPortfolioValue,
      holdings: computedData.holdingsValue,
      cash: computedData.cashValue,
      costBasisUSD: engineCostBasis,
      unrealizedPnl: engineUnrealizedPL,
      unrealizedPct: engineUnrealizedPct.toFixed(2) + '%',
      ytd: ytdData.ytdReturn.toFixed(2) + '%',
      perfMetrics_totalCost: performanceMetrics.totalCost,
      perfMetrics_unrealizedPL: adjustedMetrics.unrealizedPL,
    });
    
    const debugTable = {
      NAV_today: computedData.totalPortfolioValue,
      Holdings_value: computedData.holdingsValue,
      Cash_value: computedData.cashValue,
      Engine_cost_basis: engineCostBasis,
      PerfMetrics_totalCost: performanceMetrics.totalCost,
      Engine_unrealizedPL: engineUnrealizedPL,
      PerfMetrics_unrealizedPL: adjustedMetrics.unrealizedPL,
      Engine_unrealized_pct: engineUnrealizedPct.toFixed(2) + '%',
      PerfMetrics_unrealized_pct: performanceMetrics.totalCost > 0 
        ? ((adjustedMetrics.unrealizedPL / performanceMetrics.totalCost) * 100).toFixed(2) + '%' 
        : 'N/A',
      Realized_PL: performanceMetrics.realizedPL,
      YTD_return: ytdData.ytdReturn.toFixed(2) + '%',
      YTD_PL: ytdData.ytdPL,
      NAV_Jan1: ytdData.janValue,
      Cash_FX_PL: ytdData.cashFxPL,
      FX_mode: fxMode,
    };
    console.table(debugTable);

    // Sanity gate: if Realized = 0 and all trades this year, YTD ≈ Unrealized%
    if (performanceMetrics.realizedPL === 0 && transactions.length > 0) {
      const currentYear = new Date().getFullYear();
      const allThisYear = transactions.every(t => t.date >= `${currentYear}-01-01`);
      if (allThisYear && engineCostBasis > 0) {
        const diff = Math.abs(ytdData.ytdReturn - engineUnrealizedPct);
        if (diff > 0.5) {
          console.warn(`[KPI Consistency] YTD (${ytdData.ytdReturn.toFixed(2)}%) ≠ Engine Unrealized (${engineUnrealizedPct.toFixed(2)}%). Diff: ${diff.toFixed(2)}pp. All trades this year + no realized = should match.`);
        }
      }
    }
    
    // Cross-engine consistency check
    const costDiff = Math.abs(engineCostBasis - performanceMetrics.totalCost);
    if (costDiff > 1) {
      console.warn(`[ENGINE MISMATCH] portfolioEngine costBasis=$${engineCostBasis.toFixed(0)} vs performanceMetrics totalCost=$${performanceMetrics.totalCost.toFixed(0)} (diff: $${costDiff.toFixed(0)})`);
    }
  }, [hasData, adjustedMetrics, performanceMetrics, ytdData, fxMode, transactions, computedData]);

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
    <div className="animate-fade-in">
      {/* News Ticker */}
      <NewsTicker rssUrl={rssFeedUrl} />
      
      {/* Hero section */}
      <div className="section-spacing sm:mt-0 -mt-1 -mx-3 px-3 sm:-mx-4 sm:px-4 py-4">
        {/* Header - Desktop */}
        <div className="hidden sm:flex flex-row items-center justify-between gap-3 py-0">
          <div className="flex-1 min-w-0">
            <h1 className="terminal-label text-base">Portfolio Overview</h1>
            <p className="text-muted-foreground text-[10px] font-mono mt-0.5 truncate">Real-time performance snapshot</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <FxModeToggle />
            <ProspectusButton className="h-7 px-2" />
            <Button 
              onClick={() => navigate('/reports')} 
              variant="outline" 
              size="sm" 
              className="gap-1.5 font-mono text-[10px] uppercase tracking-wider h-7 px-2"
            >
              <FileText className="h-3 w-3" />
              <span>Reports</span>
            </Button>
          </div>
        </div>

        {/* Header - Mobile */}
        <div className="sm:hidden flex items-center justify-end gap-2 py-1">
          <FxModeToggle />
          <ProspectusButton className="h-10 px-4 rounded-full" />
          <Button 
            onClick={() => navigate('/reports')} 
            variant="outline" 
            size="sm" 
            className="gap-1.5 font-mono text-[10px] uppercase tracking-wider h-10 px-4 rounded-full"
          >
            <FileText className="h-4 w-4" />
            <span>Report</span>
          </Button>
        </div>

        {/* Group 1: Total Portfolio Value (NAV = Cash + Holdings) - Always full width */}
        <div className="w-full mt-2">
          <KPICard
            title="Total Portfolio Value"
            value={hasData && adjustedMetrics ? formatCurrency(adjustedMetrics.totalValue) : '$0'}
            icon={DollarSign}
            trend={hasData && adjustedMetrics && adjustedMetrics.totalPL >= 0 ? 'up' : 'down'}
            trendValue={hasData && adjustedMetrics ? formatCurrency(adjustedMetrics.totalPL) : undefined}
            subLabel={fxLabel}
            tooltip={fxMode === 'real' 
              ? "Total portfolio value including cash and assets at current market rates, in base currency" 
              : "Total portfolio value excluding FX impact, as if exchange rates remained constant"}
          />
        </div>
      </div>

      <div className="section-spacing">
      <StaggeredContainer className="grid grid-cols-2 lg:grid-cols-4 gap-2" staggerDelay={60} baseDelay={100}>
        <KPICard
          title="YTD Return"
          value={hasData ? `${ytdData.ytdReturn >= 0 ? '+' : ''}${ytdData.ytdReturn.toFixed(2)}%` : '0.00%'}
          trend={ytdData.ytdReturn >= 0 ? 'up' : ytdData.ytdReturn < 0 ? 'down' : 'neutral'}
          subtitle={new Date().getFullYear().toString()}
          subLabel={fxLabel}
          tooltip="Performance since Jan 1: (Current total P/L − Jan 1 total P/L) / Portfolio Value at Jan 1. Cashflow-adjusted."
        />
        <KPICard
          title="Unrealized %"
          value={hasData && adjustedMetrics && performanceMetrics.totalCost > 0 
            ? formatPercent((adjustedMetrics.unrealizedPL / performanceMetrics.totalCost) * 100) 
            : '0.00%'}
          trend={hasData && adjustedMetrics && adjustedMetrics.unrealizedPL >= 0 ? 'up' : 'down'}
          subLabel={fxLabel}
          tooltip="Open positions P/L since purchase (all-time): (Market Value − Cost Basis) / Cost Basis"
        />
        <KPICard
          title="Unrealized P/L"
          value={hasData && adjustedMetrics ? formatCurrency(adjustedMetrics.unrealizedPL) : '$0'}
          trend={hasData && adjustedMetrics && adjustedMetrics.unrealizedPL >= 0 ? 'up' : 'down'}
          subLabel={fxLabel}
          warning={computedData.missingValuationCount > 0 
            ? `${computedData.missingValuationCount} holding${computedData.missingValuationCount > 1 ? 's' : ''} missing valuation` 
            : undefined}
          tooltip="Open positions P/L since purchase (all-time) in base currency"
        />
        <KPICard
          title="Realized P/L"
          value={hasData ? formatCurrency(performanceMetrics.realizedPL) : '$0'}
          trend={hasData && performanceMetrics.realizedPL >= 0 ? 'up' : 'down'}
          subLabel={fxLabel}
          tooltip={fxMode === 'real' 
            ? "Realized profit/loss from closed positions, including FX impact" 
            : "Realized profit/loss from closed positions, excluding FX impact"}
        />
      </StaggeredContainer>

      {/* Bottom row: FX P/L, Sharpe Ratio, Max Drawdown, Volatility */}
      <StaggeredContainer className="grid grid-cols-2 lg:grid-cols-4 gap-2" staggerDelay={60} baseDelay={340}>
        <KPICard
          title="Cash FX P/L"
          value={formatCurrency(ytdData.cashFxPL)}
          trend={ytdData.cashFxPL >= 0 ? 'up' : 'down'}
          subtitle="Foreign cash changes"
          tooltip="Profit/loss from exchange rate changes on non-USD cash holdings (EUR, ILS, GBP, CHF, JPY)"
        />
        <KPICard
          title="Sharpe Ratio"
          value={hasData ? performanceMetrics.sharpeRatio.toFixed(2) : '0.00'}
          icon={Activity}
          trend={hasData && performanceMetrics.sharpeRatio >= 1 ? 'up' : 'neutral'}
          subtitle="Risk-adjusted"
          subLabel={fxLabel}
          tooltip={fxMode === 'real' 
            ? "Risk-adjusted return metric including FX impact. Above 1 is considered good" 
            : "Risk-adjusted return metric excluding FX impact. Above 1 is considered good"}
        />
        <KPICard
          title="Max Drawdown"
          value={hasData ? `-${performanceMetrics.maxDrawdown.toFixed(2)}%` : '0.00%'}
          icon={TrendingDown}
          trend="down"
          subtitle="Peak to trough"
          subLabel={fxLabel}
          tooltip={fxMode === 'real' 
            ? "Maximum decline from peak to trough, including FX impact" 
            : "Maximum decline from peak to trough, excluding FX impact"}
        />
        <KPICard
          title="Volatility"
          value={hasData ? `${performanceMetrics.volatility.toFixed(2)}%` : '0.00%'}
          subtitle="Annualized"
          subLabel={fxLabel}
          tooltip={fxMode === 'real' 
            ? "Annualized standard deviation of returns, including FX impact" 
            : "Annualized standard deviation of returns, excluding FX impact"}
        />
      </StaggeredContainer>

      {/* NAV Equity Curve - Above Performance Chart */}
      {transactions.length > 0 && valuations.length > 0 && (
        <NavEquityCurve 
          transactions={transactions} 
          valuations={valuations} 
          cashBalances={cashBalances}
          baseCurrency={settings.baseCurrency === 'ILS' ? 'ILS' : 'USD'}
        />
      )}

      {/* Performance Chart - Above Cash */}
      {hasData && (
        <PerformanceChart 
          data={performanceMetrics.monthlyReturns}
          title="Monthly & Cumulative Returns"
          showCumulative
          cumulativeData={performanceMetrics.cumulativeReturns}
        />
      )}

      {/* Cash Management, Policy Check, Drift & Open Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <CashManagement />
        <PolicyFitCheck />
        <AllocationDriftWidget />
        <OpenIssuesWidget tasks={tasks} />
      </div>

      {/* Capital Ledger - Audit Trail */}
      <CapitalLedgerView compact />

      {/* Current Holdings */}
      {transactions.length > 0 && valuations.length > 0 && (
        <HoldingsTable transactions={transactions} valuations={valuations} />
      )}

      {/* Drawdown Chart */}
      {hasData ? (
        <DrawdownChart data={performanceMetrics.drawdownSeries} />
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
    </div>
  );
}