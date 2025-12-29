import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown, ExternalLink, Percent, Scale, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DetailsData {
  type: 'core' | 'asset-class' | 'sector' | 'position';
  name: string;
  weight: number;
  value: number;
  riskContribution?: number;
  plPercent?: number;
  positions?: number;
  ticker?: string;
  geography?: string;
  currency?: string;
}

interface ArchitectureDetailsPanelProps {
  data: DetailsData | null;
  onClose: () => void;
  className?: string;
}

export function ArchitectureDetailsPanel({ data, onClose, className }: ArchitectureDetailsPanelProps) {
  if (!data) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getTypeLabel = (type: DetailsData['type']) => {
    switch (type) {
      case 'core': return 'Strategy Core';
      case 'asset-class': return 'Asset Class';
      case 'sector': return 'Sector / Theme';
      case 'position': return 'Position';
    }
  };

  return (
    <Card className={cn(
      "bg-card/95 backdrop-blur-sm border-border/50 p-4 animate-in slide-in-from-right-5 duration-200",
      className
    )}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-primary font-mono">
              {getTypeLabel(data.type)}
            </span>
            <h3 className="text-lg font-semibold text-foreground mt-0.5">
              {data.name}
            </h3>
            {data.ticker && (
              <span className="text-xs font-mono text-muted-foreground">{data.ticker}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Percent size={12} />
              <span className="text-[10px] uppercase tracking-wider">Weight</span>
            </div>
            <p className="text-xl font-mono font-semibold text-foreground">
              {data.weight.toFixed(2)}%
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span className="text-[10px] uppercase tracking-wider">Value</span>
            </div>
            <p className="text-xl font-mono font-semibold text-foreground">
              {formatCurrency(data.value)}
            </p>
          </div>

          {data.riskContribution !== undefined && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Scale size={12} />
                <span className="text-[10px] uppercase tracking-wider">Risk Contrib.</span>
              </div>
              <p className="text-xl font-mono font-semibold text-foreground">
                {data.riskContribution.toFixed(1)}%
              </p>
            </div>
          )}

          {data.plPercent !== undefined && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                {data.plPercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span className="text-[10px] uppercase tracking-wider">P&L</span>
              </div>
              <p className={cn(
                "text-xl font-mono font-semibold",
                data.plPercent >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {data.plPercent >= 0 ? '+' : ''}{data.plPercent.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        {data.positions !== undefined && (
          <div className="border-t border-border/50 pt-3">
            <span className="text-xs text-muted-foreground">
              Contains <span className="text-foreground font-mono">{data.positions}</span> positions
            </span>
          </div>
        )}

        {(data.geography || data.currency) && (
          <div className="border-t border-border/50 pt-3 space-y-1">
            {data.geography && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Geography</span>
                <span className="font-mono text-foreground">{data.geography}</span>
              </div>
            )}
            {data.currency && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-mono text-foreground">{data.currency}</span>
              </div>
            )}
          </div>
        )}

        {data.type === 'position' && data.ticker && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              // Future: navigate to company page
            }}
          >
            <ExternalLink size={12} className="mr-1.5" />
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
}
