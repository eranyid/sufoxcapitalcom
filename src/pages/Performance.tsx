import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { PerformanceCalendarHeatmap } from '@/components/dashboard/PerformanceCalendarHeatmap';
import { calculateContributions, calculateMonthlyReturns } from '@/lib/calculations';
import { useLatestResearchByTicker, useResearchByTicker, ResearchEntry } from '@/hooks/useCompanyResearch';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Award, Percent, BookOpen, Calculator, HelpCircle, FileText, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function Performance() {
  const { transactions, valuations, performanceMetrics, settings } = usePortfolio();
  const { getLatestForTicker } = useLatestResearchByTicker();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const { entries: tickerEntries, loading: entriesLoading } = useResearchByTicker(selectedTicker);

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
                    <TableHead>Research</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((c) => {
                    const latestResearch = getLatestForTicker(c.ticker);
                    return (
                      <TableRow key={c.ticker}>
                        <TableCell className="font-medium text-primary">{c.ticker}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell className="text-right">{c.weight.toFixed(1)}%</TableCell>
                        <TableCell className={`text-right ${c.contribution >= 0 ? 'positive' : 'negative'}`}>
                          {formatCurrency(c.contribution)}
                        </TableCell>
                        <TableCell>
                          {latestResearch ? (
                            <button
                              onClick={() => setSelectedTicker(c.ticker)}
                              className="text-xs text-left max-w-[150px] truncate text-primary hover:underline cursor-pointer"
                              title={latestResearch.output_summary || latestResearch.title}
                            >
                              {latestResearch.output_summary || latestResearch.title}
                            </button>
                          ) : (
                            <span 
                              className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                              onClick={() => setSelectedTicker(c.ticker)}
                            >
                              No research
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Research Side Panel */}
          <Sheet open={!!selectedTicker} onOpenChange={(open) => !open && setSelectedTicker(null)}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <BookOpen size={18} />
                  Research: {selectedTicker}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {entriesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : tickerEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No research entries for this holding.</p>
                ) : (
                  tickerEntries.map(entry => {
                    const IconMap = {
                      CALCULATION: Calculator,
                      QUESTION: HelpCircle,
                      ANSWER: MessageSquare,
                      NOTE: FileText,
                    };
                    const Icon = IconMap[entry.entry_type as keyof typeof IconMap] || FileText;
                    return (
                      <div key={entry.id} className="border border-border/50 rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs gap-1">
                            <Icon size={10} />
                            {entry.entry_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{entry.title}</p>
                        {entry.output_summary && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.output_summary}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </SheetContent>
          </Sheet>
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
