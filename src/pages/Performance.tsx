import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { PerformanceCalendarHeatmap } from '@/components/dashboard/PerformanceCalendarHeatmap';
import { PriceSparkline } from '@/components/dashboard/PriceSparkline';
import { calculateContributions, calculateMonthlyReturns } from '@/lib/calculations';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Target, Award, Percent } from 'lucide-react';

export default function Performance() {
  const { transactions, valuations, performanceMetrics, settings } = usePortfolio();
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const contributions = calculateContributions(transactions, monthlyReturns, valuations);

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value);

  const hasData = performanceMetrics !== null;

  return (
    <div className="section-spacing animate-fade-in">
      <div className="border-b border-border pb-4">
        <h1 className="terminal-label text-base">Performance Analytics</h1>
        <p className="text-muted-foreground text-[10px] font-mono mt-0.5">Detailed return analysis and attribution</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KPICard
          title="Total Return"
          value={hasData ? formatPercent(performanceMetrics.totalReturn) : '0.00%'}
          icon={TrendingUp}
          trend={hasData && performanceMetrics.totalReturn >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Annualized Return"
          value={hasData ? formatPercent(performanceMetrics.irr) : '0.00%'}
          icon={Target}
          trend={hasData && performanceMetrics.irr >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Time-Weighted Return"
          value={hasData ? formatPercent(performanceMetrics.twr) : '0.00%'}
          icon={Award}
          trend={hasData && performanceMetrics.twr >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Win/Loss Ratio"
          value={hasData ? performanceMetrics.winLossRatio.toFixed(2) : '0.00'}
          icon={Percent}
          trend={hasData && performanceMetrics.winLossRatio >= 1 ? 'up' : 'neutral'}
        />
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
                    <TableHead className="text-center">Trend</TableHead>
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
                      <TableCell className="text-center">
                        <PriceSparkline ticker={c.ticker} valuations={valuations} />
                      </TableCell>
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
