import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MonthlyValuation } from '@/types/investment';

interface PriceSparklineProps {
  ticker: string;
  valuations: MonthlyValuation[];
  width?: number;
  height?: number;
}

export function PriceSparkline({ ticker, valuations, width = 72, height = 24 }: PriceSparklineProps) {
  const { data, isPositive, minPrice, maxPrice } = useMemo(() => {
    const tickerVals = valuations
      .filter(v => v.ticker === ticker)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-2) // Last 2 months only
      .map(v => ({
        month: v.month,
        price: v.pricePerUnit * (v.fxRate || 1)
      }));

    if (tickerVals.length < 2) {
      return { data: tickerVals, isPositive: true, minPrice: 0, maxPrice: 0 };
    }

    // Interpolate points for smoother curve (Bloomberg style with more data points)
    const [prev, curr] = tickerVals;
    const interpolated = [];
    const steps = 8;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      interpolated.push({
        index: i,
        price: prev.price + (curr.price - prev.price) * t
      });
    }

    const prices = interpolated.map(d => d.price);
    return {
      data: interpolated,
      isPositive: curr.price >= prev.price,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  }, [ticker, valuations]);

  if (data.length < 2) {
    return <span className="text-muted-foreground/50 text-[10px] font-mono">—</span>;
  }

  // Bloomberg-style colors
  const gradientId = `bloomberg-${ticker.replace(/[^a-zA-Z0-9]/g, '')}`;
  const fillColorStart = isPositive ? '#1a472a' : '#4a1a1a';
  const fillColorEnd = isPositive ? '#0d2818' : '#2d0f0f';

  return (
    <div 
      style={{ width, height }} 
      className="inline-flex items-center bg-black/80 rounded-[2px] overflow-hidden relative"
    >
      {/* Dotted vertical divider at midpoint */}
      <div 
        className="absolute left-1/2 top-0 bottom-0 w-px"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(255,255,255,0.25) 2px, rgba(255,255,255,0.25) 4px)',
        }}
      />
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 3, right: 1, bottom: 3, left: 1 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColorStart} stopOpacity={0.9} />
              <stop offset="100%" stopColor={fillColorEnd} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={1}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
            baseValue={minPrice - (maxPrice - minPrice) * 0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
