import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { Transaction, MonthlyValuation } from '@/types/investment';

interface CompanyValueChartProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  ticker: string;
}

interface ChartDataPoint {
  month: string;
  displayMonth: string;
  value: number;
  quantity: number;
}

interface BuyEvent {
  month: string;
  date: string;
  quantity: number;
  price: number;
  value: number;
}

export function CompanyValueChart({ transactions, valuations, ticker }: CompanyValueChartProps) {
  const { chartData, buyEvents } = useMemo(() => {
    const normalizedTicker = ticker.toUpperCase();

    // Get all transactions for this ticker
    const companyTxs = transactions
      .filter(t => t.ticker.toUpperCase() === normalizedTicker)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get all valuations for this ticker
    const companyVals = valuations
      .filter(v => v.ticker.toUpperCase() === normalizedTicker)
      .sort((a, b) => a.month.localeCompare(b.month));

    if (companyVals.length === 0) {
      return { chartData: [], buyEvents: [] };
    }

    // Track quantity over time
    const txByMonth: Record<string, { qty: number; buys: { date: string; qty: number; price: number }[] }> = {};
    companyTxs.forEach(tx => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!txByMonth[month]) {
        txByMonth[month] = { qty: 0, buys: [] };
      }
      if (tx.transactionType === 'buy') {
        txByMonth[month].qty += tx.quantity;
        txByMonth[month].buys.push({ date: tx.date, qty: tx.quantity, price: tx.pricePerUnit });
      } else {
        txByMonth[month].qty -= tx.quantity;
      }
    });

    // Build chart data with running quantity
    const data: ChartDataPoint[] = [];
    const buys: BuyEvent[] = [];
    let runningQty = 0;

    // Get all months from first transaction to latest valuation
    const allMonths = new Set<string>();
    companyVals.forEach(v => allMonths.add(v.month));
    Object.keys(txByMonth).forEach(m => allMonths.add(m));
    
    const sortedMonths = Array.from(allMonths).sort();

    sortedMonths.forEach(month => {
      // Apply transactions for this month
      if (txByMonth[month]) {
        runningQty += txByMonth[month].qty;
        // Record buy events
        txByMonth[month].buys.forEach(buy => {
          const val = companyVals.find(v => v.month === month);
          const priceAtMonth = val?.pricePerUnit || buy.price;
          buys.push({
            month,
            date: buy.date,
            quantity: buy.qty,
            price: buy.price,
            value: runningQty * priceAtMonth,
          });
        });
      }

      // Get valuation for this month
      const val = companyVals.find(v => v.month === month);
      if (val && runningQty > 0) {
        data.push({
          month,
          displayMonth: format(parseISO(month + '-01'), 'MMM yy'),
          value: runningQty * val.pricePerUnit,
          quantity: runningQty,
        });
      }
    });

    return { chartData: data, buyEvents: buys };
  }, [transactions, valuations, ticker]);

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        No valuation data available for this ticker
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="displayMonth"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Value']}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
          />
          {/* Buy markers */}
          {buyEvents.map((buy, idx) => {
            const dataPoint = chartData.find(d => d.month === buy.month);
            if (!dataPoint) return null;
            return (
              <ReferenceDot
                key={idx}
                x={dataPoint.displayMonth}
                y={dataPoint.value}
                r={6}
                fill="hsl(var(--chart-2))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
      {buyEvents.length > 0 && (
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Position Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-chart-2" />
            <span>Buy Date</span>
          </div>
        </div>
      )}
    </div>
  );
}
