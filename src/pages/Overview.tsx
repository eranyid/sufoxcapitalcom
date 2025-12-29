import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { NavEquityCurve } from '@/components/dashboard/NavEquityCurve';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { CashManagement } from '@/components/dashboard/CashManagement';
import { PolicyFitCheck } from '@/components/dashboard/PolicyFitCheck';
import { NewsTicker } from '@/components/dashboard/NewsTicker';
import CrmSummaryWidget from '@/components/dashboard/CrmSummaryWidget';
import { computeFactorModel } from '@/lib/factorModel';
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
  const { transactions, valuations, performanceMetrics, riskMetrics, cashBalances, settings, loading } = usePortfolio();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rssFeedUrl, setRssFeedUrl] = useState<string | null>(null);

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
      
      <div className="section-spacing">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 py-1 sm:py-0">
        <div className="flex-1 min-w-0">
          <h1 className="terminal-label text-sm sm:text-base">Portfolio Overview</h1>
          <p className="text-muted-foreground text-[10px] font-mono mt-0.5 truncate">Real-time performance snapshot</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button 
            onClick={() => navigate('/reports')} 
            variant="outline" 
            size="sm" 
            className="gap-1.5 font-mono text-[10px] uppercase tracking-wider h-11 sm:h-7 min-w-[44px] px-3 sm:px-2"
          >
            <FileText className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Reports</span>
            <span className="sm:hidden">Report</span>
          </Button>
          <div className="text-right hidden sm:block">
            <p className="terminal-label">Last Updated</p>
            <p className="text-sm font-mono tabular-nums text-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Group 1: Total Portfolio Value (NAV = Cash + Holdings) - Always full width */}
      <div className="w-full">
        <KPICard
          title="Total Portfolio Value"
          value={hasData ? formatCurrency(performanceMetrics.totalValue) : '$0'}
          icon={DollarSign}
          trend={hasData && performanceMetrics.totalPL >= 0 ? 'up' : 'down'}
          trendValue={hasData ? formatCurrency(performanceMetrics.totalPL) : undefined}
        />
      </div>

      {/* Group 2: Remaining 8 KPIs - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
        <KPICard
          title="YTD Return"
          value={hasData ? (() => {
            const currentYear = new Date().getFullYear().toString();
            const ytdReturns = performanceMetrics.monthlyReturns.filter(r => r.month.startsWith(currentYear));
            if (ytdReturns.length === 0) return '0.00%';
            const ytdReturn = ytdReturns.reduce((acc, r) => acc * (1 + r.return / 100), 1) - 1;
            return `${ytdReturn >= 0 ? '+' : ''}${(ytdReturn * 100).toFixed(2)}%`;
          })() : '0.00%'}
          trend={hasData ? (() => {
            const currentYear = new Date().getFullYear().toString();
            const ytdReturns = performanceMetrics.monthlyReturns.filter(r => r.month.startsWith(currentYear));
            if (ytdReturns.length === 0) return 'neutral';
            const ytdReturn = ytdReturns.reduce((acc, r) => acc * (1 + r.return / 100), 1) - 1;
            return ytdReturn >= 0 ? 'up' : 'down';
          })() : 'neutral'}
          subtitle={new Date().getFullYear().toString()}
        />
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
      </div>

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

      {/* Cash Management, Policy Check & CRM Summary - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <CashManagement />
        <PolicyFitCheck />
        <CrmSummaryWidget />
      </div>

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