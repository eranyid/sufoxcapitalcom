import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, AlertTriangle, CheckCircle2, TrendingUp, 
  Shield, Wallet, Globe2, Layers, BarChart3 
} from 'lucide-react';
import { Position, ASSET_TYPE_LABELS } from '@/types/allocationBuilder';
import { StructuralInsightsPanel } from '@/components/construction/allocation/StructuralInsightsPanel';
import { AllocationSankey } from '@/components/construction/allocation/AllocationSankey';
import { cn } from '@/lib/utils';

interface PipelineInsightsStepProps {
  positions: Position[];
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  icon: React.ElementType;
}

export function PipelineInsightsStep({ positions }: PipelineInsightsStepProps) {
  // Calculate insights
  const totalAllocation = positions.reduce((sum, p) => sum + p.allocation, 0);
  
  // Asset class breakdown
  const assetClasses = positions.reduce((acc, p) => {
    acc[p.assetType] = (acc[p.assetType] || 0) + p.allocation;
    return acc;
  }, {} as Record<string, number>);

  // Liquidity breakdown
  const liquidityBreakdown = positions.reduce((acc, p) => {
    acc[p.liquidityBucket] = (acc[p.liquidityBucket] || 0) + p.allocation;
    return acc;
  }, {} as Record<string, number>);

  const highlyLiquid = liquidityBreakdown['highly_liquid'] || 0;
  const locked = liquidityBreakdown['locked'] || 0;

  // Generate insights
  const insights: Insight[] = [];

  // Concentration check
  const maxPosition = Math.max(...positions.map(p => p.allocation));
  if (maxPosition > 25) {
    insights.push({
      type: 'warning',
      title: 'High Concentration Risk',
      description: `Your largest position is ${maxPosition.toFixed(1)}%. Consider diversifying to reduce single-name risk.`,
      icon: AlertTriangle,
    });
  } else {
    insights.push({
      type: 'success',
      title: 'Good Diversification',
      description: 'No single position exceeds 25% of portfolio.',
      icon: CheckCircle2,
    });
  }

  // Equity exposure
  const equityExposure = assetClasses['equity'] || 0;
  if (equityExposure > 70) {
    insights.push({
      type: 'warning',
      title: 'High Equity Exposure',
      description: `${equityExposure.toFixed(0)}% in equities. Consider adding bonds for stability.`,
      icon: TrendingUp,
    });
  }

  // Liquidity check
  if (locked > 20) {
    insights.push({
      type: 'warning',
      title: 'Illiquidity Risk',
      description: `${locked.toFixed(0)}% in locked/illiquid assets. Ensure this matches your liquidity needs.`,
      icon: Wallet,
    });
  }

  if (highlyLiquid >= 20) {
    insights.push({
      type: 'success',
      title: 'Adequate Liquidity',
      description: `${highlyLiquid.toFixed(0)}% in highly liquid assets provides flexibility.`,
      icon: Shield,
    });
  }

  // Diversification check
  const uniqueRegions = new Set(positions.map(p => p.region)).size;
  if (uniqueRegions >= 3) {
    insights.push({
      type: 'success',
      title: 'Geographic Diversification',
      description: `Exposure to ${uniqueRegions} regions provides geographic spread.`,
      icon: Globe2,
    });
  } else if (uniqueRegions < 2) {
    insights.push({
      type: 'info',
      title: 'Limited Geographic Spread',
      description: 'Consider adding international exposure for diversification.',
      icon: Globe2,
    });
  }

  return (
    <div className="space-y-4">
      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Card 
              key={index}
              className={cn(
                "border-2",
                insight.type === 'success' && "border-emerald-500/20 bg-emerald-500/5",
                insight.type === 'warning' && "border-amber-500/20 bg-amber-500/5",
                insight.type === 'info' && "border-blue-500/20 bg-blue-500/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    insight.type === 'success' && "bg-emerald-500/20",
                    insight.type === 'warning' && "bg-amber-500/20",
                    insight.type === 'info' && "bg-blue-500/20"
                  )}>
                    <Icon 
                      size={18} 
                      className={cn(
                        insight.type === 'success' && "text-emerald-400",
                        insight.type === 'warning' && "text-amber-400",
                        insight.type === 'info' && "text-blue-400"
                      )} 
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Layers className="mx-auto mb-2 text-muted-foreground" size={20} />
            <p className="text-2xl font-mono font-bold">{positions.length}</p>
            <p className="text-xs text-muted-foreground">Positions</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <BarChart3 className="mx-auto mb-2 text-muted-foreground" size={20} />
            <p className="text-2xl font-mono font-bold">{Object.keys(assetClasses).length}</p>
            <p className="text-xs text-muted-foreground">Asset Classes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Globe2 className="mx-auto mb-2 text-muted-foreground" size={20} />
            <p className="text-2xl font-mono font-bold">{uniqueRegions}</p>
            <p className="text-xs text-muted-foreground">Regions</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto mb-2 text-muted-foreground" size={20} />
            <p className="text-2xl font-mono font-bold">{highlyLiquid.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Highly Liquid</p>
          </CardContent>
        </Card>
      </div>

      {/* Flow Diagram */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb size={14} className="text-primary" />
            Allocation Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AllocationSankey positions={positions} />
        </CardContent>
      </Card>
    </div>
  );
}
