import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, Layers, Globe, Briefcase, DollarSign, Droplets, TrendingUp } from 'lucide-react';
import { StructuralInsights, Position } from '@/types/allocationBuilder';
import { generateStructuralInsights } from '@/lib/allocationAnalytics';
import { cn } from '@/lib/utils';

interface StructuralInsightsPanelProps {
  positions: Position[];
}

export function StructuralInsightsPanel({ positions }: StructuralInsightsPanelProps) {
  const insights = generateStructuralInsights(positions);
  
  const getDiversificationColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getConcentrationRisk = (hhi: number) => {
    if (hhi < 1500) return { label: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (hhi < 2500) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'High', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const concentrationRisk = getConcentrationRisk(insights.concentration.herfindahlIndex);

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Structural Insights</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Add positions to see insights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Imbalances / Warnings */}
      {insights.imbalances.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-500">Imbalance Warnings</p>
                <ul className="space-y-1">
                  {insights.imbalances.map((warning, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Diversification Score */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            Diversification Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={cn("text-4xl font-bold font-mono", getDiversificationColor(insights.diversification.overall))}>
              {insights.diversification.overall}
            </span>
            <Badge variant="outline" className={getDiversificationColor(insights.diversification.overall)}>
              {insights.diversification.overall >= 70 ? 'Well Diversified' : 
               insights.diversification.overall >= 40 ? 'Moderately Diversified' : 'Concentrated'}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'Asset Type', value: insights.diversification.assetTypeDiversity, icon: Layers },
              { label: 'Geographic', value: insights.diversification.geographicDiversity, icon: Globe },
              { label: 'Sector', value: insights.diversification.sectorDiversity, icon: Briefcase },
              { label: 'Currency', value: insights.diversification.currencyDiversity, icon: DollarSign },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <item.icon size={12} />
                    {item.label}
                  </span>
                  <span className={cn("font-mono", getDiversificationColor(item.value))}>
                    {item.value}
                  </span>
                </div>
                <Progress value={item.value} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Concentration Metrics */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers size={14} className="text-primary" />
              Concentration
            </span>
            <Badge variant="outline" className={cn(concentrationRisk.color, concentrationRisk.bg)}>
              {concentrationRisk.label} Risk
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">HHI Index</p>
              <p className="text-lg font-mono font-semibold">{insights.concentration.herfindahlIndex}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Effective Positions</p>
              <p className="text-lg font-mono font-semibold">{insights.concentration.effectivePositions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Largest Position</p>
              <p className="text-lg font-mono font-semibold">{insights.concentration.largestPosition.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Top 5 Concentration</p>
              <p className="text-lg font-mono font-semibold">{insights.concentration.top5Concentration.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity Exposure */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Droplets size={14} className="text-primary" />
              Liquidity Profile
            </span>
            <Badge variant="outline" className="font-mono">
              Score: {insights.liquidity.weightedLiquidityScore}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'Highly Liquid', value: insights.liquidity.highlyLiquid, color: 'bg-green-500' },
              { label: 'Liquid', value: insights.liquidity.liquid, color: 'bg-emerald-500' },
              { label: 'Semi-Liquid', value: insights.liquidity.semiLiquid, color: 'bg-amber-500' },
              { label: 'Illiquid', value: insights.liquidity.illiquid, color: 'bg-orange-500' },
              { label: 'Locked', value: insights.liquidity.locked, color: 'bg-red-500' },
            ].map(bucket => (
              <div key={bucket.label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground">{bucket.label}</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", bucket.color)}
                    style={{ width: `${bucket.value}%` }}
                  />
                </div>
                <div className="w-12 text-right text-xs font-mono">{bucket.value.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Currency Exposure */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            Currency Exposure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.currencies.slice(0, 5).map(curr => (
              <div key={curr.currency} className="flex items-center gap-3">
                <Badge variant="outline" className="w-12 justify-center font-mono text-xs">
                  {curr.currency}
                </Badge>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${curr.allocation}%` }}
                  />
                </div>
                <div className="w-16 text-right text-xs font-mono">
                  {curr.allocation.toFixed(1)}%
                </div>
                <div className="w-8 text-right text-xs text-muted-foreground">
                  ({curr.positionCount})
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
