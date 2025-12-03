import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Shield, AlertTriangle, Activity, TrendingDown, Target, Gauge } from 'lucide-react';

export default function Risk() {
  const { performanceMetrics, riskMetrics, settings } = usePortfolio();

  const hasData = riskMetrics !== null && performanceMetrics !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Risk Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Risk metrics and volatility analysis</p>
      </div>

      {/* Risk KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <KPICard
          title="Volatility"
          value={hasData ? `${riskMetrics.volatility.toFixed(2)}%` : '0.00%'}
          icon={Activity}
          subtitle="Annualized"
        />
        <KPICard
          title="Sharpe Ratio"
          value={hasData ? riskMetrics.sharpeRatio.toFixed(2) : '0.00'}
          icon={Target}
          trend={hasData && riskMetrics.sharpeRatio >= 1 ? 'up' : 'neutral'}
          subtitle={`Rf: ${settings.riskFreeRate}%`}
        />
        <KPICard
          title="Sortino Ratio"
          value={hasData ? riskMetrics.sortinoRatio.toFixed(2) : '0.00'}
          icon={Target}
          trend={hasData && riskMetrics.sortinoRatio >= 1 ? 'up' : 'neutral'}
          subtitle="Downside risk"
        />
        <KPICard
          title="Max Drawdown"
          value={hasData ? `-${riskMetrics.maxDrawdown.toFixed(2)}%` : '0.00%'}
          icon={TrendingDown}
          trend="down"
        />
        <KPICard
          title="VaR (95%)"
          value={hasData ? `${riskMetrics.var95.toFixed(2)}%` : '0.00%'}
          icon={AlertTriangle}
          subtitle="Monthly"
        />
        <KPICard
          title="VaR (99%)"
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
      </div>

      {hasData ? (
        <>
          {/* Drawdown Chart */}
          <DrawdownChart data={performanceMetrics.drawdownSeries} />

          {/* Rolling Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rolling Volatility */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Rolling 12M Volatility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskMetrics.rollingVolatility} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Volatility']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="volatility" 
                        stroke="hsl(var(--warning))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Rolling Sharpe */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Rolling 12M Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskMetrics.rollingSharpe} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [value.toFixed(2), 'Sharpe']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sharpe" 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Explanation Card */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Risk Metrics Explained</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Volatility</h4>
                  <p className="text-muted-foreground">Standard deviation of monthly returns, annualized. Higher values indicate greater price variability.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Sharpe Ratio</h4>
                  <p className="text-muted-foreground">Risk-adjusted return. Values above 1.0 are considered good; above 2.0 is excellent.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Sortino Ratio</h4>
                  <p className="text-muted-foreground">Like Sharpe but only penalizes downside volatility. Better for asymmetric return distributions.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Maximum Drawdown</h4>
                  <p className="text-muted-foreground">Largest peak-to-trough decline. Critical for understanding worst-case scenarios.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Value at Risk (VaR)</h4>
                  <p className="text-muted-foreground">Maximum expected loss at specified confidence level using variance-covariance method.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Beta</h4>
                  <p className="text-muted-foreground">Sensitivity to benchmark. Beta of 1.0 means same volatility as market; &lt;1 is less volatile.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Risk-Free Rate</h4>
                  <p className="text-muted-foreground">Currently set to {settings.riskFreeRate}%. Adjust in Settings based on current Treasury yields.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Risk Data Available</h3>
            <p className="text-muted-foreground">Add transactions and valuations to calculate risk metrics.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
