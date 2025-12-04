import { calculateRiskContribution } from '@/lib/calculations';
import { Transaction, MonthlyValuation } from '@/types/investment';

interface RiskContributionTableProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
}

export function RiskContributionTable({ transactions, valuations }: RiskContributionTableProps) {
  const riskContributions = calculateRiskContribution(transactions, valuations);

  if (riskContributions.length === 0) {
    return (
      <div className="bloomberg-panel p-4">
        <div className="bloomberg-header mb-4">
          <span className="text-primary">■</span> Risk Contribution
        </div>
        <p className="text-muted-foreground text-xs text-center py-4">
          No data available
        </p>
      </div>
    );
  }

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="text-primary">■</span> Risk Contribution by Asset
      </div>
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="terminal-label text-left py-2">Asset</th>
              <th className="terminal-label text-right py-2">Weight</th>
              <th className="terminal-label text-right py-2">Vol (Ann.)</th>
              <th className="terminal-label text-right py-2">Risk %</th>
              <th className="terminal-label text-right py-2 w-32">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {riskContributions.slice(0, 10).map((item) => (
              <tr key={item.ticker} className="border-b border-border/20 hover:bg-primary/5">
                <td className="py-2">
                  <span className="font-mono text-xs text-primary font-medium">{item.ticker}</span>
                  <span className="text-muted-foreground text-[10px] ml-2">{item.name}</span>
                </td>
                <td className="font-mono text-xs text-right tabular-nums">
                  {item.weight.toFixed(2)}%
                </td>
                <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                  {item.marginalRisk.toFixed(2)}%
                </td>
                <td className="font-mono text-xs text-right tabular-nums font-medium">
                  {item.riskPct.toFixed(2)}%
                </td>
                <td className="py-2 pl-4">
                  <div className="h-3 bg-muted/30 rounded-sm overflow-hidden">
                    <div 
                      className="h-full bg-warning rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(item.riskPct, 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-muted-foreground mt-3 font-mono">
          Risk contribution shows how each asset contributes to total portfolio volatility
        </p>
      </div>
    </div>
  );
}