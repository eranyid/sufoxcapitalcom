import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { FxRate } from '@/lib/fxService';

interface FxRateTrendChartProps {
  rates: FxRate[];
  availablePairs: string[];
}

export function FxRateTrendChart({ rates, availablePairs }: FxRateTrendChartProps) {
  const [selectedPair, setSelectedPair] = useState<string>(availablePairs[0] || 'USD/ILS');

  // Filter and sort rates for selected pair
  const chartData = useMemo(() => {
    const [from, to] = selectedPair.split('/');
    const filtered = rates
      .filter(r => r.fromCurrency === from && r.toCurrency === to)
      .sort((a, b) => new Date(a.rateDate).getTime() - new Date(b.rateDate).getTime())
      .map(r => ({
        date: r.rateDate,
        rate: r.rate,
        formattedDate: format(parseISO(r.rateDate), 'MMM d, yyyy'),
      }));
    return filtered;
  }, [rates, selectedPair]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const ratesArr = chartData.map(d => d.rate);
    const latest = ratesArr[ratesArr.length - 1];
    const first = ratesArr[0];
    const min = Math.min(...ratesArr);
    const max = Math.max(...ratesArr);
    const avg = ratesArr.reduce((a, b) => a + b, 0) / ratesArr.length;
    const change = latest - first;
    const changePercent = first !== 0 ? ((latest - first) / first) * 100 : 0;

    return { latest, first, min, max, avg, change, changePercent };
  }, [chartData]);

  const [from, to] = selectedPair.split('/');

  if (availablePairs.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            FX Rate Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No rate history available. Add rates to see trends.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            FX Rate Trends
          </CardTitle>
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue>{to}/{from}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availablePairs.map(pair => {
                const [from, to] = pair.split('/');
                return (
                  <SelectItem key={pair} value={pair}>
                    {to}/{from}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-2 bg-muted/30 rounded-md">
              <p className="text-[10px] text-muted-foreground uppercase">Latest</p>
              <p className="text-lg font-mono font-semibold">{stats.latest.toFixed(4)}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-md">
              <p className="text-[10px] text-muted-foreground uppercase">Change</p>
              <div className="flex items-center gap-1">
                {stats.change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : stats.change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-lg font-mono font-semibold ${
                  stats.change > 0 ? 'text-green-500' : stats.change < 0 ? 'text-red-500' : ''
                }`}>
                  {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="p-2 bg-muted/30 rounded-md">
              <p className="text-[10px] text-muted-foreground uppercase">High</p>
              <p className="text-lg font-mono font-semibold text-green-500">{stats.max.toFixed(4)}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-md">
              <p className="text-[10px] text-muted-foreground uppercase">Low</p>
              <p className="text-lg font-mono font-semibold text-red-500">{stats.min.toFixed(4)}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(val) => val.toFixed(2)}
                  width={50}
                />
                {stats && (
                  <ReferenceLine
                    y={stats.avg}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [
                    <span className="font-mono">{value.toFixed(4)}</span>,
                    `1 ${to} =`
                  ]}
                  labelFormatter={(label) => format(parseISO(label), 'MMM d, yyyy')}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <p>No data for {selectedPair}. Add historical rates to see the trend.</p>
          </div>
        )}

        {/* Legend */}
        {chartData.length > 0 && stats && (
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-primary rounded" />
              <span>Rate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 border-t border-dashed border-primary" />
              <span>Avg: {stats.avg.toFixed(4)}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {chartData.length} data points
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
