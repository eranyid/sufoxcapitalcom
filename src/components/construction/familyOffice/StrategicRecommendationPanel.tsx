import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StrategicRecommendation } from '@/types/familyOfficeProfile';
import { 
  Target, Shield, Globe, Droplets, Leaf, 
  TrendingUp, AlertTriangle, CheckCircle2, BarChart3,
  Percent, Clock
} from 'lucide-react';

interface Props {
  recommendation: StrategicRecommendation;
  riskScore: number;
}

export function StrategicRecommendationPanel({ recommendation, riskScore }: Props) {
  const getRiskBandColor = (band: string) => {
    switch (band) {
      case 'conservative': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'balanced': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'growth': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'aggressive': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-muted-foreground bg-muted/20 border-muted/40';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return 'text-blue-400';
    if (score <= 50) return 'text-green-400';
    if (score <= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center">
              <Target className="text-primary" size={32} />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-bold">Strategic Allocation Recommendation</h2>
        <p className="text-xs text-muted-foreground">Based on your Family Office profile assessment</p>
      </div>

      {/* Risk Score & Band */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">Risk Score</span>
            </div>
            <div className={`text-4xl font-bold font-mono ${getRiskScoreColor(riskScore)}`}>
              {riskScore}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">out of 100</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">Risk Profile</span>
            </div>
            <Badge className={`text-lg px-4 py-1 ${getRiskBandColor(recommendation.riskBand)}`}>
              {recommendation.riskBand.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation Ranges */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Percent size={14} className="text-primary" />
            <h3 className="text-sm font-semibold">Suggested Asset Allocation Ranges</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Equities', range: recommendation.equityRange, color: 'bg-blue-500' },
              { label: 'Fixed Income', range: recommendation.fixedIncomeRange, color: 'bg-green-500' },
              { label: 'Alternatives', range: recommendation.alternativesRange, color: 'bg-purple-500' },
              { label: 'Cash', range: recommendation.cashRange, color: 'bg-gray-500' },
            ].map(({ label, range, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{label}</span>
                  <span className="font-mono text-muted-foreground">{range.min}% - {range.max}%</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden relative">
                  <div 
                    className={`absolute h-full ${color} opacity-60`}
                    style={{ left: `${range.min}%`, width: `${range.max - range.min}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Parameters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <Clock size={14} className="mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground">Illiquidity Budget</div>
            <div className="text-lg font-bold font-mono">{recommendation.illiquidityBudget}%</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <Shield size={14} className="mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground">Hedge Budget</div>
            <div className="text-lg font-bold font-mono">{recommendation.hedgeBudget}%</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <Droplets size={14} className="mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground">Liquidity Buffer</div>
            <div className="text-lg font-bold font-mono">{recommendation.liquidityBuffer}%</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <TrendingUp size={14} className="mx-auto text-primary mb-1" />
            <div className="text-[10px] text-muted-foreground">Benchmark</div>
            <div className="text-xs font-medium truncate">{recommendation.suggestedBenchmark}</div>
          </CardContent>
        </Card>
      </div>

      {/* Geography Tilt */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} className="text-primary" />
            <h3 className="text-sm font-semibold">Geographic Allocation</h3>
          </div>

          <div className="flex gap-2 flex-wrap">
            {Object.entries(recommendation.geographyTilt).map(([region, weight]) => (
              <Badge key={region} variant="outline" className="text-xs">
                {region.replace(/([A-Z])/g, ' $1').trim()}: {weight}%
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ESG Constraints */}
      {recommendation.esgConstraints.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={14} className="text-primary" />
              <h3 className="text-sm font-semibold">ESG Constraints</h3>
            </div>

            <div className="flex gap-2 flex-wrap">
              {recommendation.esgConstraints.map((constraint, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-red-500/10 border-red-500/40 text-red-400">
                  {constraint}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Considerations */}
      {recommendation.keyConsiderations.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-primary" />
              <h3 className="text-sm font-semibold">Key Considerations</h3>
            </div>

            <div className="space-y-2">
              {recommendation.keyConsiderations.map((consideration, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">{consideration}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
