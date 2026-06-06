import { usePortfolio } from '@/context/PortfolioContext';
import { useFxMode } from '@/context/FxModeContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { FxModeToggle } from '@/components/dashboard/FxModeToggle';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { PerformanceCalendarHeatmap } from '@/components/dashboard/PerformanceCalendarHeatmap';
import { calculateContributions, calculateMonthlyReturns } from '@/lib/calculations';
import { StaggeredContainer } from '@/components/StaggeredContainer';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Target, Award, Percent, ArrowRightLeft, DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { formatCurrency as _formatCurrency, formatPercent } from '@/lib/formatters';

export default function Performance() {
  const { transactions, valuations, performanceMetrics, settings, computedData } = usePortfolio();
  const { fxMode, fxLabel } = useFxMode();
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const contributions = calculateContributions(transactions, monthlyReturns, valuations);

  const formatCurrency = (value: number) => _formatCurrency(value, { currency: settings.baseCurrency || 'USD' });

  const hasData = performanceMetrics !== null;

  // Calculate aggregated P/L with and without FX impact
  // Use same costBasis as performanceMetrics to ensure matching percentages
  const plBreakdown = useMemo(() => {
    if (!computedData || computedData.holdings.length === 0 || !performanceMetrics) {
      return { totalPL: 0, marketPL: 0, fxPL: 0, costBasis: 0, realizedPL: 0, unrealizedPL: 0 };
    }
    
    // Sum unrealized P/L components from holdings
    const unrealizedPL = computedData.holdings.reduce((sum, h) => sum + h.unrealizedPL, 0);
    const marketPL = computedData.holdings.reduce((sum, h) => sum + h.marketPL, 0);
    const fxPL = computedData.holdings.reduce((sum, h) => sum + h.fxPL, 0);
    const costBasis = computedData.holdings.reduce((sum, h) => sum + h.costBasis, 0);
    
    // Get realized P/L from performanceMetrics (already calculated properly)
    const realizedPL = performanceMetrics.realizedPL || 0;
    
    // Total P/L = Realized + Unrealized (matching performanceMetrics.totalReturn)
    const totalPL = realizedPL + unrealizedPL;
    
    return { totalPL, marketPL, fxPL, costBasis, realizedPL, unrealizedPL };
  }, [computedData, performanceMetrics]);

  // SINGLE SOURCE OF TRUTH: Total Return = cost-basis return from performanceMetrics
  // This is (totalPL / totalCost) * 100 = unrealized % when no sells
  // Matches Overview's YTD calculation for portfolios started in current year
  const totalPLPercent = hasData ? performanceMetrics.totalReturn : 0;
  
  // Market and FX percentages relative to costBasis (consistent with how total is calculated)
  const marketPLPercent = plBreakdown.costBasis > 0 
    ? (plBreakdown.marketPL / plBreakdown.costBasis) * 100 
    : 0;
  const fxPLPercent = plBreakdown.costBasis > 0 
    ? (plBreakdown.fxPL / plBreakdown.costBasis) * 100 
    : 0;

  // Adjusted metrics based on FX mode
  const adjustedMetrics = useMemo(() => {
    if (!performanceMetrics) return null;
    
    const isNominal = fxMode === 'nominal';
    
    // In Nominal mode, use marketPL% (excludes FX)
    // In Real mode, use cost-basis total return (includes FX)
    // Both derived from the SAME performanceMetrics source
    const totalReturn = isNominal ? marketPLPercent : performanceMetrics.totalReturn;
    
    return {
      ...performanceMetrics,
      totalReturn,
    };
  }, [performanceMetrics, fxMode, marketPLPercent]);

  return (
    <div className="section-spacing animate-fade-in">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="terminal-label text-base">Performance Analytics</h1>
          <p className="text-muted-foreground text-[10px] font-mono mt-0.5">
            Detailed return analysis and attribution • Base Currency: {settings.baseCurrency || 'USD'}
          </p>
        </div>
        <FxModeToggle />
      </div>

      {/* Key Metrics */}
      <StaggeredContainer className="grid grid-cols-2 md:grid-cols-4 gap-2" staggerDelay={60} baseDelay={50}>
        <KPICard
          title="Total Return"
          value={hasData && adjustedMetrics ? formatPercent(adjustedMetrics.totalReturn) : '0.00%'}
          icon={TrendingUp}
          trend={hasData && adjustedMetrics && adjustedMetrics.totalReturn >= 0 ? 'up' : 'down'}
          subLabel={fxLabel}
        />
        <KPICard
          title="Annualized Return"
          value={hasData ? formatPercent(performanceMetrics.irr) : '0.00%'}
          icon={Target}
          trend={hasData && performanceMetrics.irr >= 0 ? 'up' : 'down'}
          subLabel={fxLabel}
        />
        <KPICard
          title="Time-Weighted Return"
          value={hasData ? formatPercent(performanceMetrics.twr) : '0.00%'}
          icon={Award}
          trend={hasData && performanceMetrics.twr >= 0 ? 'up' : 'down'}
          subLabel={fxLabel}
        />
        <KPICard
          title="Win/Loss Ratio"
          value={hasData && performanceMetrics.winLossRatio > 0 ? performanceMetrics.winLossRatio.toFixed(2) : 'N/A'}
          icon={Percent}
          trend={hasData && performanceMetrics.winLossRatio >= 1 ? 'up' : 'neutral'}
          subLabel={hasData && performanceMetrics.winLossRatio === 0 ? "No completed trades" : undefined}
        />
      </StaggeredContainer>

      {/* P/L Breakdown: Market vs FX */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">P/L Breakdown: Market vs FX Impact</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Market P/L (without FX) */}
            <div className="bg-muted/20 border border-border/30 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Market P/L (excl. FX)</span>
              </div>
              <p className={`font-mono text-xl tabular-nums ${plBreakdown.marketPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(plBreakdown.marketPL)}
              </p>
              <p className={`font-mono text-sm tabular-nums ${marketPLPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercent(marketPLPercent)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Price change only, at entry FX rate
              </p>
            </div>

            {/* FX P/L */}
            <div className="bg-muted/20 border border-border/30 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">FX P/L</span>
              </div>
              <p className={`font-mono text-xl tabular-nums ${plBreakdown.fxPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(plBreakdown.fxPL)}
              </p>
              <p className={`font-mono text-sm tabular-nums ${fxPLPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercent(fxPLPercent)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Currency impact since entry
              </p>
            </div>

            {/* Total P/L (with FX) */}
            <div className="bg-muted/20 border border-border/30 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total P/L (incl. FX)</span>
              </div>
              <p className={`font-mono text-xl tabular-nums ${plBreakdown.totalPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(plBreakdown.totalPL)}
              </p>
              <p className={`font-mono text-sm tabular-nums ${totalPLPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercent(totalPLPercent)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Total unrealized gain/loss
              </p>
            </div>
          </div>
          
          <p className="text-[9px] text-muted-foreground mt-3 text-center">
            All values converted to {settings.baseCurrency || 'USD'} at current exchange rates
          </p>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Performance Charts */}
          <div className="chart-grid">
            <PerformanceChart 
              data={performanceMetrics.monthlyReturns}
              title="Monthly Returns"
              color="hsl(var(--chart-gold))"
            />
            <PerformanceChart 
              data={performanceMetrics.cumulativeReturns}
              title="Cumulative Returns"
              color="hsl(var(--success))"
            />
          </div>

          {/* Contribution Analysis */}
          <div className="chart-grid">
            <ContributionChart data={contributions} />
            
            {/* Monthly Returns Table */}
            <div className="bloomberg-panel">
              <div className="bloomberg-header">
                <span className="bloomberg-header-title">Monthly Returns History</span>
              </div>
              <div className="p-3">
                <div className="max-h-[200px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Return</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...monthlyReturns].reverse().slice(0, 12).map(({ month, return: ret, value }) => (
                        <TableRow key={month}>
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className={`text-right ${ret >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercent(ret)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Heatmap - After Contribution */}
          <PerformanceCalendarHeatmap data={performanceMetrics.monthlyReturns} />

          {/* Holdings Contribution Table */}
          <div className="bloomberg-panel">
            <div className="bloomberg-header">
              <span className="bloomberg-header-title">Holdings Contribution Detail</span>
            </div>
            <div className="p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
                    <TableHead className="text-right">P/L%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((c) => (
                    <TableRow key={c.ticker}>
                      <TableCell className="font-medium text-primary">{c.ticker}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right">{c.weight.toFixed(1)}%</TableCell>
                      <TableCell className={`text-right ${c.contribution >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(c.contribution)}
                      </TableCell>
                      <TableCell className={`text-right ${c.plPercent >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(c.plPercent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

        </>
      ) : (
        <div className="bloomberg-panel">
          <div className="bloomberg-header">
            <span className="bloomberg-header-title">Performance Data</span>
          </div>
          <div className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-sm font-medium mb-2 text-primary">No Performance Data</h3>
            <p className="text-muted-foreground text-xs">Add transactions and valuations to view performance analytics.</p>
          </div>
        </div>
      )}
    </div>
  );
}
