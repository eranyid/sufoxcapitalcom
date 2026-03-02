import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { RiskContributionTable } from '@/components/dashboard/RiskContributionTable';
import { FactorExposureTable } from '@/components/dashboard/FactorExposureTable';
import { FactorRiskChart } from '@/components/dashboard/FactorRiskChart';
import { SystematicRiskPie } from '@/components/dashboard/SystematicRiskPie';
import { FactorCorrelationHeatmap } from '@/components/dashboard/FactorCorrelationHeatmap';
import { computeFactorModel } from '@/lib/factorModel';

import { Shield, AlertTriangle, Activity, TrendingDown, Target, Gauge, Crosshair, Layers, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { StaggeredContainer } from '@/components/StaggeredContainer';

export default function Risk() {
  const { performanceMetrics, riskMetrics, settings, transactions, valuations, fxRates } = usePortfolio();

  const hasData = riskMetrics !== null && performanceMetrics !== null;

  // Compute factor model results with error protection
  const factorModelResults = useMemo(() => {
    if (!hasData) return null;
    try {
      return computeFactorModel(transactions, valuations);
    } catch (e) {
      console.error('[Risk] Factor model computation failed:', e);
      return null;
    }
  }, [transactions, valuations, hasData]);

  // Calculate YTD Turnover
  const turnoverYTD = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const ytdTransactions = transactions.filter(t => {
      const txYear = new Date(t.date).getFullYear();
      return txYear === currentYear;
    });
    
    const totalTraded = ytdTransactions.reduce((sum, t) => {
      const localAmount = t.quantity * t.pricePerUnit;
      // Convert to base currency
      let amountBase = localAmount;
      if (t.currency !== (settings.baseCurrency || 'USD')) {
        if (t.fxRateAtEntry) {
          amountBase = localAmount * t.fxRateAtEntry;
        } else if (fxRates && fxRates[t.currency] && fxRates[t.currency] > 0) {
          amountBase = (settings.baseCurrency || 'USD') === 'USD'
            ? localAmount / fxRates[t.currency]
            : localAmount * fxRates[t.currency];
        }
      }
      return sum + amountBase;
    }, 0);
    
    // Calculate as percentage of current portfolio value
    if (performanceMetrics && performanceMetrics.totalValue > 0) {
      return (totalTraded / performanceMetrics.totalValue) * 100;
    }
    return 0;
  }, [transactions, performanceMetrics]);

  return (
    <div className="section-spacing animate-fade-in">
      <div>
        <h1 className="terminal-label text-base">Risk Dashboard</h1>
        <p className="text-muted-foreground text-[10px] font-mono mt-0.5">Risk metrics and volatility analysis</p>
      </div>

      {/* Risk KPIs */}
      <StaggeredContainer className="kpi-grid" staggerDelay={50} baseDelay={50}>
        <KPICard
          title="Volatility"
          value={hasData ? `${riskMetrics.volatility.toFixed(2)}%` : '0.00%'}
          icon={Activity}
          subtitle="Annualized"
        />
        <KPICard
          title="Sortino"
          value={hasData ? riskMetrics.sortinoRatio.toFixed(2) : '0.00'}
          icon={Target}
          trend={hasData && riskMetrics.sortinoRatio >= 1 ? 'up' : 'neutral'}
          subtitle="Downside"
        />
        <KPICard
          title="Turnover YTD"
          value={`${turnoverYTD.toFixed(1)}%`}
          icon={RefreshCw}
          subtitle="Year-to-Date"
        />
        <KPICard
          title="Max DD"
          value={hasData ? `-${riskMetrics.maxDrawdown.toFixed(2)}%` : '0.00%'}
          icon={TrendingDown}
          trend="down"
        />
        <KPICard
          title="VaR 95%"
          value={hasData ? `${riskMetrics.var95.toFixed(2)}%` : '0.00%'}
          icon={AlertTriangle}
          subtitle="Monthly"
        />
        <KPICard
          title="VaR 99%"
          value={hasData ? `${riskMetrics.var99.toFixed(2)}%` : '0.00%'}
          icon={Shield}
          subtitle="Monthly"
        />
        <KPICard
          title="Beta"
          value={hasData ? riskMetrics.beta.toFixed(2) : '1.00'}
          icon={Gauge}
          subtitle="vs Benchmark"
        />
        <KPICard
          title="Track Err"
          value={hasData ? `${riskMetrics.trackingError.toFixed(2)}%` : '0.00%'}
          icon={Crosshair}
          subtitle="Annualized"
        />
      </StaggeredContainer>

      {hasData ? (
        <>
          {/* Risk Contribution */}
          <RiskContributionTable transactions={transactions} valuations={valuations} baseCurrency={settings.baseCurrency === 'ILS' ? 'ILS' : 'USD'} fxRates={fxRates} />

          {/* Drawdown Chart */}
          <DrawdownChart data={performanceMetrics.drawdownSeries} />


          {/* Factor Model Section */}
          {factorModelResults && (
            <>
              {/* Factor Model Header */}
              <div className="bloomberg-panel bg-secondary">
                <div className="px-3 py-2 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-primary font-semibold text-xs uppercase tracking-wide">
                    Factor Model Analysis
                  </span>
                  <span className="text-muted-foreground text-[9px] ml-auto">
                    Bloomberg PORT / MSCI Barra Style
                  </span>
                </div>
              </div>

              {/* Factor Exposures and Risk Decomposition */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <FactorExposureTable exposures={factorModelResults.exposures} />
                <SystematicRiskPie 
                  systematicPct={factorModelResults.systematicPct}
                  specificPct={factorModelResults.specificPct}
                  residualVolatility={factorModelResults.residualVolatility}
                />
              </div>

              {/* Factor Risk Contribution */}
              <FactorRiskChart 
                riskBreakdown={factorModelResults.risk}
                specificPct={factorModelResults.specificPct}
              />

              {/* Factor Correlation Matrix */}
              <FactorCorrelationHeatmap 
                correlationMatrix={factorModelResults.factorCorrelation}
              />
            </>
          )}

          {/* Risk Explanation */}
          <div className="bloomberg-panel">
            <div className="bloomberg-header">
              <span className="bloomberg-header-title">Risk Metrics Reference</span>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">Volatility</h4>
                  <p className="text-muted-foreground">Std dev of returns, annualized</p>
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">Turnover</h4>
                  <p className="text-muted-foreground">Trading volume vs. AUM</p>
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">Sortino Ratio</h4>
                  <p className="text-muted-foreground">Downside deviation only</p>
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">Max Drawdown</h4>
                  <p className="text-muted-foreground">Peak-to-trough decline</p>
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">VaR</h4>
                  <p className="text-muted-foreground">Max loss at confidence level</p>
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">Beta</h4>
                  <p className="text-muted-foreground">Sensitivity to benchmark</p>
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">Systematic Risk</h4>
                  <p className="text-muted-foreground">Factor-driven variance</p>
                </div>
                <div>
                  <h4 className="text-primary font-semibold mb-0.5">Specific Risk</h4>
                  <p className="text-muted-foreground">Idiosyncratic variance</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bloomberg-panel p-8 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">No Risk Data Available</h3>
          <p className="text-muted-foreground text-xs">Add transactions and valuations to calculate risk metrics.</p>
        </div>
      )}
    </div>
  );
}
