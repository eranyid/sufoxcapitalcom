import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PortfolioPoint } from '@/lib/efficientFrontier';
import { Target, Crosshair, TrendingUp, PieChart } from 'lucide-react';

interface PortfolioWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioPoint | null;
  portfolioType: 'current' | 'minVar' | 'maxSharpe' | null;
}

export function PortfolioWeightsModal({ 
  isOpen, 
  onClose, 
  portfolio, 
  portfolioType 
}: PortfolioWeightsModalProps) {
  if (!portfolio) return null;

  const config = {
    current: {
      title: 'Current Portfolio',
      icon: Target,
      color: 'hsl(30, 100%, 50%)',
      description: 'Your current portfolio allocation'
    },
    minVar: {
      title: 'Minimum Variance Portfolio',
      icon: Crosshair,
      color: 'hsl(210, 100%, 55%)',
      description: 'Portfolio with the lowest possible risk'
    },
    maxSharpe: {
      title: 'Maximum Sharpe Portfolio',
      icon: TrendingUp,
      color: 'hsl(120, 60%, 40%)',
      description: 'Optimal risk-adjusted return portfolio (tangency)'
    }
  };

  const typeConfig = portfolioType ? config[portfolioType] : config.current;
  const Icon = typeConfig.icon;

  // Sort weights by absolute value descending
  const sortedWeights = Object.entries(portfolio.weights)
    .filter(([_, w]) => Math.abs(w) > 0.0001)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const totalWeight = sortedWeights.reduce((sum, [_, w]) => sum + w, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <Icon className="h-5 w-5" style={{ color: typeConfig.color }} />
            <span style={{ color: typeConfig.color }}>{typeConfig.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Portfolio Metrics */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/30 rounded-sm border border-border/30">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-mono mb-1">Expected Return</p>
              <p className={`font-mono text-sm font-medium ${portfolio.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                {portfolio.return.toFixed(2)}%
              </p>
            </div>
            <div className="text-center border-x border-border/30">
              <p className="text-[10px] text-muted-foreground font-mono mb-1">Volatility</p>
              <p className="font-mono text-sm font-medium text-muted-foreground">
                {portfolio.volatility.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-mono mb-1">Sharpe Ratio</p>
              <p className={`font-mono text-sm font-medium ${portfolio.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                {portfolio.sharpe.toFixed(3)}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground font-mono">{typeConfig.description}</p>

          {/* Weights Table */}
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border/30">
                  <th className="text-[10px] text-muted-foreground font-mono text-left py-2">Asset</th>
                  <th className="text-[10px] text-muted-foreground font-mono text-right py-2">Weight</th>
                  <th className="text-[10px] text-muted-foreground font-mono text-left py-2 pl-3 w-32">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {sortedWeights.map(([ticker, weight]) => (
                  <tr key={ticker} className="border-b border-border/20 hover:bg-primary/5">
                    <td className="py-2 font-mono text-xs text-primary">{ticker}</td>
                    <td className={`font-mono text-xs text-right tabular-nums ${weight >= 0 ? 'text-foreground' : 'text-chart-negative'}`}>
                      {(weight * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary/50 rounded-sm overflow-hidden">
                          <div 
                            className="h-full rounded-sm transition-all"
                            style={{ 
                              width: `${Math.min(Math.abs(weight) * 100, 100)}%`,
                              backgroundColor: weight >= 0 ? typeConfig.color : 'hsl(0, 70%, 50%)'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border/50">
                  <td className="py-2 font-mono text-xs font-medium text-muted-foreground">Total</td>
                  <td className="font-mono text-xs text-right tabular-nums font-medium">
                    {(totalWeight * 100).toFixed(2)}%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-2 border-t border-border/30">
            <div className="flex items-center gap-1">
              <PieChart className="h-3 w-3" />
              <span>{portfolio.numAssets} assets in portfolio</span>
            </div>
            <span>Click outside to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
