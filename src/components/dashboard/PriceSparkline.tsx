import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { MonthlyValuation } from '@/types/investment';

interface PriceSparklineProps {
  ticker: string;
  valuations: MonthlyValuation[];
  width?: number;
  height?: number;
}

export function PriceSparkline({ ticker, valuations, width = 80, height = 24 }: PriceSparklineProps) {
  const data = useMemo(() => {
    const tickerVals = valuations
      .filter(v => v.ticker === ticker)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(v => ({
        month: v.month,
        price: v.pricePerUnit * (v.fxRate || 1)
      }));
    
    return tickerVals;
  }, [ticker, valuations]);

  if (data.length < 2) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const isPositive = lastPrice >= firstPrice;

  return (
    <div style={{ width, height }} className="inline-block">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
