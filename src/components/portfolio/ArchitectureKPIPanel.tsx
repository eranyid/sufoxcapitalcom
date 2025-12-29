import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, PieChart, Hash, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIData {
  totalValue: number;
  totalExposure: number;
  cashPercent: number;
  positionCount: number;
  topContributors: { name: string; contribution: number }[];
}

interface ArchitectureKPIPanelProps {
  data: KPIData;
  className?: string;
}

export function ArchitectureKPIPanel({ data, className }: ArchitectureKPIPanelProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card className={cn("bg-card/80 backdrop-blur-sm border-border/50 p-4", className)}>
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Portfolio Metrics
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wallet size={12} />
              <span className="text-[10px] uppercase tracking-wider">NAV</span>
            </div>
            <p className="text-lg font-mono font-semibold text-foreground">
              {formatCurrency(data.totalValue)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <PieChart size={12} />
              <span className="text-[10px] uppercase tracking-wider">Exposure</span>
            </div>
            <p className="text-lg font-mono font-semibold text-foreground">
              {formatCurrency(data.totalExposure)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[10px] uppercase tracking-wider">Cash %</span>
            </div>
            <p className="text-lg font-mono font-semibold text-primary">
              {data.cashPercent.toFixed(1)}%
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Hash size={12} />
              <span className="text-[10px] uppercase tracking-wider">Positions</span>
            </div>
            <p className="text-lg font-mono font-semibold text-foreground">
              {data.positionCount}
            </p>
          </div>
        </div>
        
        <div className="border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Trophy size={12} />
            <span className="text-[10px] uppercase tracking-wider">Top Contributors</span>
          </div>
          <div className="space-y-1.5">
            {data.topContributors.slice(0, 3).map((contributor, idx) => (
              <div key={contributor.name} className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  {idx + 1}. {contributor.name}
                </span>
                <span className={cn(
                  "text-xs font-mono",
                  contributor.contribution >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {contributor.contribution >= 0 ? '+' : ''}{contributor.contribution.toFixed(1)}%
                </span>
              </div>
            ))}
            {data.topContributors.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No data</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
