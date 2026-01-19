import { calculateRiskContribution } from '@/lib/calculations';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldAlert } from 'lucide-react';

interface RiskContributionTableProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
}

export function RiskContributionTable({ transactions, valuations }: RiskContributionTableProps) {
  const riskContributions = calculateRiskContribution(transactions, valuations);

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Risk Contribution by Asset</span>
      </div>
      <div className="p-4">
        {riskContributions.length === 0 ? (
          <EmptyState 
            icon={ShieldAlert}
            title="No Risk Data"
            description="Add transactions and valuations to see risk contribution analysis"
          />
        ) : (
          <>
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
                      <span className="font-mono text-sm text-primary font-semibold">{item.ticker}</span>
                      <span className="text-foreground/70 text-xs ml-2">{item.name}</span>
                    </td>
                    <td className="font-mono text-sm text-foreground text-right tabular-nums">
                      {item.weight.toFixed(2)}%
                    </td>
                    <td className="font-mono text-sm text-right tabular-nums text-foreground/80">
                      {item.marginalRisk.toFixed(2)}%
                    </td>
                    <td className="font-mono text-sm text-right tabular-nums font-semibold text-foreground">
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
          </>
        )}
      </div>
    </div>
  );
}