import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { calculateContributions, calculateMonthlyReturns } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Target, Award, Percent } from 'lucide-react';

export default function Performance() {
  const { transactions, valuations, performanceMetrics, settings } = usePortfolio();

  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const contributions = calculateContributions(transactions, monthlyReturns);

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
            <Card variant="panel" size="md">
              <CardHeader className="pb-2">
                <CardTitle>Monthly Returns History</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Holdings Contribution Table */}
          <Card variant="panel">
            <CardHeader className="pb-2">
              <CardTitle>Holdings Contribution Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card variant="panel" size="md">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-sm font-medium mb-2 text-primary">No Performance Data</h3>
            <p className="text-muted-foreground text-xs">Add transactions and valuations to view performance analytics.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
