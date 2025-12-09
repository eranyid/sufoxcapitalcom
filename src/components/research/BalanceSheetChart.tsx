import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BalanceSheetData } from '@/hooks/useAlpacaFundamentals';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: BalanceSheetData[] | null;
  loading: boolean;
  formatNumber: (value: number) => string;
  period: 'quarterly' | 'annual';
}

export const BalanceSheetChart = ({ data, loading, formatNumber, period }: Props) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    
    return data.map(item => ({
      ...item,
      debtToAssets: item.totalAssets > 0 ? (item.totalLiabilities / item.totalAssets) * 100 : 0,
    }));
  }, [data]);

  const latestData = chartData[chartData.length - 1];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>No balance sheet data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Chart */}
      <div className="h-[240px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="period" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={45}
              tickFormatter={(value) => {
                if (value >= 1e9) return `${(value / 1e9).toFixed(0)}B`;
                if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
                return value.toString();
              }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={35}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Debt-to-Assets') return [`${value.toFixed(2)}%`, name];
                return [formatNumber(value), name];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '5px', fontSize: '10px' }}
              iconSize={10}
              formatter={(value) => <span className="text-[10px] sm:text-xs text-muted-foreground">{value}</span>}
            />
            <Bar 
              yAxisId="left"
              dataKey="totalAssets" 
              name="Total Assets" 
              fill="hsl(var(--foreground))" 
              opacity={0.9}
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              yAxisId="left"
              dataKey="totalLiabilities" 
              name="Total Liabilities" 
              fill="hsl(var(--primary))" 
              opacity={0.9}
              radius={[2, 2, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="debtToAssets" 
              name="Debt-to-Assets" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))', r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      {latestData && (
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-mono text-muted-foreground">
                {latestData.period}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Millions USD</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Total Assets</p>
                <p className="font-mono text-sm sm:text-lg text-foreground">{formatNumber(latestData.totalAssets)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Total Liabilities</p>
                <p className="font-mono text-sm sm:text-lg text-foreground">{formatNumber(latestData.totalLiabilities)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Total Equity</p>
                <p className={`font-mono text-sm sm:text-lg ${latestData.totalEquity >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatNumber(latestData.totalEquity)}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Debt-to-Assets</p>
                <p className={`font-mono text-sm sm:text-lg ${latestData.debtToAssets <= 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {latestData.debtToAssets.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
