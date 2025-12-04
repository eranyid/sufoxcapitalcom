import { calculateCorrelationMatrix } from '@/lib/calculations';
import { Transaction, MonthlyValuation } from '@/types/investment';

interface CorrelationMatrixProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
}

export function CorrelationMatrix({ transactions, valuations }: CorrelationMatrixProps) {
  const { tickers, matrix } = calculateCorrelationMatrix(transactions, valuations);

  if (tickers.length < 2) {
    return (
      <div className="bloomberg-panel p-4">
        <div className="bloomberg-header mb-4">
          <span className="text-primary">■</span> Correlation Matrix
        </div>
        <p className="text-muted-foreground text-xs text-center py-4">
          Need at least 2 assets with 3+ months of data
        </p>
      </div>
    );
  }

  const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return 'bg-success/80 text-background';
    if (value >= 0.3) return 'bg-success/40';
    if (value >= -0.3) return 'bg-muted/40';
    if (value >= -0.7) return 'bg-destructive/40';
    return 'bg-destructive/80 text-background';
  };

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="text-primary">■</span> Correlation Matrix
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="terminal-label text-left py-2 px-1"></th>
              {tickers.map(ticker => (
                <th key={ticker} className="terminal-label text-center py-2 px-1 font-mono">
                  {ticker.slice(0, 5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((rowTicker, i) => (
              <tr key={rowTicker}>
                <td className="font-mono text-xs py-1 px-1 text-primary font-medium">
                  {rowTicker.slice(0, 5)}
                </td>
                {matrix[i].map((corr, j) => (
                  <td key={j} className="py-1 px-1">
                    <div 
                      className={`text-center py-1 px-1 font-mono tabular-nums ${getCorrelationColor(corr)}`}
                    >
                      {corr.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success/80"></div>
            <span>High +</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-muted/40"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive/80"></div>
            <span>High -</span>
          </div>
        </div>
      </div>
    </div>
  );
}