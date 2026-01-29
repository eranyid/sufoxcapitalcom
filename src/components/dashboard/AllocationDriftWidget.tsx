import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { usePortfolio } from '@/context/PortfolioContext';
import { Target, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DriftLine {
  key: string;
  label: string;
  target: number;
  current: number;
  drift: number;
}

export function AllocationDriftWidget() {
  const navigate = useNavigate();
  const { activeTarget, targetLines, isLoading } = useTargetAllocation();
  const { transactions, valuations, performanceMetrics } = usePortfolio();

  // Calculate current allocation from portfolio holdings
  const currentAllocation = useMemo(() => {
    if (!performanceMetrics || !transactions.length || !valuations.length) {
      return { geography: {}, assetClass: {} };
    }

    const totalValue = performanceMetrics.totalValue;
    if (totalValue <= 0) return { geography: {}, assetClass: {} };

    // Get latest valuations per ticker
    const latestValuations = new Map<string, { value: number; geography: string; assetType: string }>();
    const sortedValuations = [...valuations].sort((a, b) => b.month.localeCompare(a.month));
    
    transactions.forEach(tx => {
      if (!latestValuations.has(tx.ticker)) {
        const val = sortedValuations.find(v => v.ticker === tx.ticker);
        if (val) {
          // Calculate position value
          const positionQty = transactions
            .filter(t => t.ticker === tx.ticker)
            .reduce((sum, t) => {
              return t.transactionType === 'buy' ? sum + t.quantity : sum - t.quantity;
            }, 0);
          
          const positionValue = positionQty * val.pricePerUnit * (val.fxRate || 1);
          
          latestValuations.set(tx.ticker, {
            value: positionValue,
            geography: tx.geography,
            assetType: tx.assetType,
          });
        }
      }
    });

    // Aggregate by geography and asset class
    const geoTotals: Record<string, number> = {};
    const assetTotals: Record<string, number> = {};

    latestValuations.forEach(({ value, geography, assetType }) => {
      // Map geography to our categories
      const geoKey = geography === 'israel' ? 'israel' :
        geography === 'north_america' ? 'usa' :
        geography === 'europe' ? 'europe' : 'other';
      
      geoTotals[geoKey] = (geoTotals[geoKey] || 0) + value;
      assetTotals[assetType] = (assetTotals[assetType] || 0) + value;
    });

    // Convert to percentages
    const geoPercent: Record<string, number> = {};
    const assetPercent: Record<string, number> = {};

    Object.entries(geoTotals).forEach(([key, val]) => {
      geoPercent[key] = (val / totalValue) * 100;
    });
    Object.entries(assetTotals).forEach(([key, val]) => {
      assetPercent[key] = (val / totalValue) * 100;
    });

    return { geography: geoPercent, assetClass: assetPercent };
  }, [transactions, valuations, performanceMetrics]);

  // Calculate drift
  const driftAnalysis = useMemo((): DriftLine[] => {
    if (!activeTarget || !targetLines.length) return [];

    const result: DriftLine[] = [];

    // Geography drift
    const geoLines = targetLines.filter(l => l.dimension_type === 'geography');
    geoLines.forEach(line => {
      const target = Number(line.target_weight);
      const current = currentAllocation.geography[line.key] || 0;
      result.push({
        key: `geo_${line.key}`,
        label: `${line.key.charAt(0).toUpperCase() + line.key.slice(1)} (Geo)`,
        target,
        current,
        drift: current - target,
      });
    });

    // Asset class drift  
    const assetLines = targetLines.filter(l => l.dimension_type === 'asset_class');
    assetLines.forEach(line => {
      const target = Number(line.target_weight);
      // Map our keys to transaction asset types
      const assetKey = line.key === 'equities' ? 'equity' : line.key;
      const current = currentAllocation.assetClass[assetKey] || 0;
      result.push({
        key: `asset_${line.key}`,
        label: `${line.key.charAt(0).toUpperCase() + line.key.slice(1)}`,
        target,
        current,
        drift: current - target,
      });
    });

    // Sort by absolute drift (biggest first)
    return result.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift)).slice(0, 6);
  }, [activeTarget, targetLines, currentAllocation]);

  const maxDrift = useMemo(() => {
    if (!driftAnalysis.length) return 0;
    return Math.max(...driftAnalysis.map(d => Math.abs(d.drift)));
  }, [driftAnalysis]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-6">
          <div className="animate-pulse h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!activeTarget) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target size={14} className="text-primary" />
            Target Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              No target allocation defined
            </p>
            <Button 
              size="sm" 
              onClick={() => navigate('/construction')}
              className="gap-2"
            >
              Create Target
              <ArrowRight size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target size={14} className="text-primary" />
            Allocation Drift
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px]",
              maxDrift > 10 ? "border-destructive text-destructive" :
              maxDrift > 5 ? "border-amber-500 text-amber-500" :
              "border-primary text-primary"
            )}
          >
            {maxDrift > 10 ? 'High Drift' : maxDrift > 5 ? 'Moderate' : 'On Target'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {driftAnalysis.map((line) => (
            <div key={line.key} className="flex items-center gap-2 text-xs">
              <span className="w-20 truncate text-muted-foreground">{line.label}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    line.drift > 0 ? "bg-primary" : "bg-amber-500"
                  )}
                  style={{ 
                    width: `${Math.min(Math.abs(line.drift) * 3, 100)}%`,
                    marginLeft: line.drift < 0 ? 'auto' : undefined,
                  }}
                />
              </div>
              <span className={cn(
                "w-14 text-right font-mono",
                Math.abs(line.drift) > 5 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {line.drift >= 0 ? '+' : ''}{line.drift.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground">
            Target: {activeTarget.name}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] gap-1"
            onClick={() => navigate('/construction')}
          >
            Edit
            <ArrowRight size={10} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
