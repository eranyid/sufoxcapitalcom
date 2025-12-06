import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { RiskContributionTable } from '@/components/dashboard/RiskContributionTable';
import { MonteCarloSimulation } from '@/components/dashboard/MonteCarloSimulation';
import { FactorExposureTable } from '@/components/dashboard/FactorExposureTable';
import { FactorRiskChart } from '@/components/dashboard/FactorRiskChart';
import { SystematicRiskPie } from '@/components/dashboard/SystematicRiskPie';
import { FactorCorrelationHeatmap } from '@/components/dashboard/FactorCorrelationHeatmap';
import { computeFactorModel } from '@/lib/factorModel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, Activity, TrendingDown, Target, Gauge, Crosshair, Layers } from 'lucide-react';
import { useMemo } from 'react';

export default function Risk() {
  const { performanceMetrics, riskMetrics, settings, transactions, valuations } = usePortfolio();

  const hasData = riskMetrics !== null && performanceMetrics !== null;

  // Compute factor model results
  const factorModelResults = useMemo(() => {
    if (!hasData) return null;
    return computeFactorModel(transactions, valuations);
  }, [transactions, valuations, hasData]);

  return (
    <div className="section-spacing animate-fade-in">
      <div>
        <h1 className="terminal-label text-base">Risk Dashboard</h1>
        <p className="text-muted-foreground text-[10px] font-mono mt-0.5">Risk metrics and volatility analysis</p>
      </div>

      {/* Risk KPIs */}
      <div className="kpi-grid">
        <KPICard
          title="Volatility"
          value={hasData ? `${riskMetrics.volatility.toFixed(2)}%` : '0.00%'}
          icon={Activity}
          subtitle="Annualized"
        />
        <KPICard
          title="Sharpe"
          value={hasData ? riskMetrics.sharpeRatio.toFixed(2) : '0.00'}
          icon={Target}
          trend={hasData && riskMetrics.sharpeRatio >= 1 ? 'up' : 'neutral'}
          subtitle={`Rf: ${settings.riskFreeRate}%`}
        />
        <KPICard
          title="Sortino"
          value={hasData ? riskMetrics.sortinoRatio.toFixed(2) : '0.00'}
          icon={Target}
          trend={hasData && riskMetrics.sortinoRatio >= 1 ? 'up' : 'neutral'}
          subtitle="Downside"
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
      </div>

      {hasData ? (
        <>
          {/* Risk Contribution */}
          <RiskContributionTable transactions={transactions} valuations={valuations} />

          {/* Monte Carlo Simulation */}
          <MonteCarloSimulation 
            monthlyReturns={performanceMetrics.monthlyReturns.map(m => m.return)} 
            currentValue={performanceMetrics.totalValue}
            portfolioCAGR={performanceMetrics.twr > 0 ? performanceMetrics.twr : undefined}
            portfolioVolatility={riskMetrics.volatility}
            portfolioSharpe={riskMetrics.sharpeRatio}
            riskFreeRate={settings.riskFreeRate}
          />

          {/* Drawdown Chart */}
          <DrawdownChart data={performanceMetrics.drawdownSeries} />

          {/* Rolling Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {/* Rolling Volatility */}
            <div className="bloomberg-panel">
              <div className="bloomberg-header">
                <span className="bloomberg-header-title">Rolling 12M Volatility</span>
              </div>
              <div className="p-3">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskMetrics.rollingVolatility} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                        tickFormatter={(v) => v.slice(5)}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        width={30}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0',
                          fontSize: '11px',
                          fontFamily: 'JetBrains Mono'
                        }}
                        labelStyle={{ color: 'hsl(var(--primary))' }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Vol']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="volatility" 
                        stroke="hsl(var(--warning))"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Rolling Sharpe */}
            <div className="bloomberg-panel">
              <div className="bloomberg-header">
                <span className="bloomberg-header-title">Rolling 12M Sharpe Ratio</span>
              </div>
              <div className="p-3">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskMetrics.rollingSharpe} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                        tickFormatter={(v) => v.slice(5)}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        width={30}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0',
                          fontSize: '11px',
                          fontFamily: 'JetBrains Mono'
                        }}
                        labelStyle={{ color: 'hsl(var(--primary))' }}
                        formatter={(value: number) => [value.toFixed(2), 'Sharpe']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sharpe" 
                        stroke="hsl(var(--chart-gold))"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Factor Model Section */}
          {factorModelResults && (
            <>
              {/* Factor Model Header */}
              <div className="bloomberg-panel bg-secondary/30">
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
                  <h4 className="text-primary font-semibold mb-0.5">Sharpe Ratio</h4>
                  <p className="text-muted-foreground">Risk-adjusted return (&gt;1 good)</p>
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
