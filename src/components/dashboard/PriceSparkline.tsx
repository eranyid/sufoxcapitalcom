import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { MonthlyValuation } from '@/types/investment';

interface PriceSparklineProps {
  ticker: string;
  valuations: MonthlyValuation[];
  width?: number;
  height?: number;
}

export function PriceSparkline({ ticker, valuations, width = 60, height = 28 }: PriceSparklineProps) {
  const data = useMemo(() => {
    const tickerVals = valuations
      .filter(v => v.ticker === ticker)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-2) // Last 2 months only
      .map(v => ({
        month: v.month,
        price: v.pricePerUnit * (v.fxRate || 1)
      }));
    
    return tickerVals;
  }, [ticker, valuations]);

  if (data.length < 2) {
    return <span className="text-muted-foreground text-[10px]">—</span>;
  }

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const isPositive = lastPrice >= firstPrice;
  const color = isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  return (
    <div 
      style={{ width, height }} 
      className="inline-block bg-background/50 rounded-sm border border-border/30"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#gradient-${ticker})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
