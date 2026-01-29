import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  SystemRecommendation,
  RiskProfileType,
  RISK_PROFILE_LABELS,
  RISK_PROFILE_COLORS,
} from '@/types/needsProfile';
import { 
  Target, 
  TrendingUp, 
  Shield, 
  Percent, 
  ArrowRight,
  Activity,
  Globe,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface SystemRecommendationPanelProps {
  recommendation: SystemRecommendation;
  onContinue: () => void;
}

export function SystemRecommendationPanel({ recommendation, onContinue }: SystemRecommendationPanelProps) {
  const { riskProfile, riskScore } = recommendation;

  const profileConfig: Record<RiskProfileType, { 
    color: string; 
    bgColor: string; 
    borderColor: string;
    icon: React.ReactNode;
    description: string;
  }> = {
    conservative: {
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      icon: <Shield size={24} className="text-blue-400" />,
      description: 'Focus on capital preservation with modest growth. Lower volatility, steady returns.',
    },
    balanced: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      icon: <Activity size={24} className="text-emerald-400" />,
      description: 'Balanced approach between growth and stability. Moderate risk for moderate returns.',
    },
    growth: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      icon: <TrendingUp size={24} className="text-amber-400" />,
      description: 'Emphasis on capital appreciation. Accept higher volatility for higher returns.',
    },
    aggressive: {
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      icon: <Zap size={24} className="text-red-400" />,
      description: 'Maximum growth focus. High volatility tolerance for potentially high returns.',
    },
  };

  const config = profileConfig[riskProfile];

  return (
    <div className="space-y-6">
      {/* Hero Profile Card */}
      <Card className={cn(
        "relative overflow-hidden border-2",
        config.borderColor,
        config.bgColor
      )}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" 
             style={{ color: config.color.replace('text-', '') }} />
        
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Profile Icon */}
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center",
              config.bgColor,
              "border",
              config.borderColor
            )}>
              {config.icon}
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={cn("text-2xl font-bold font-mono", config.color)}>
                  {RISK_PROFILE_LABELS[riskProfile].toUpperCase()}
                </h2>
                <Badge variant="outline" className={cn("font-mono text-xs", config.borderColor, config.color)}>
                  SCORE: {riskScore}/100
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
              
              {/* Risk Score Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">RISK TOLERANCE</span>
                  <span className={cn("font-mono font-bold", config.color)}>{riskScore}%</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", config.bgColor.replace('/10', ''))}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Asset Allocation Ranges */}
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/50 via-transparent to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target size={14} className="text-primary" />
              <span className="font-mono tracking-wide">SUGGESTED ALLOCATION RANGES</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AllocationRangeBar 
              label="Equities" 
              range={recommendation.equityRange}
              color="bg-emerald-500"
            />
            <AllocationRangeBar 
              label="Bonds" 
              range={recommendation.bondsRange}
              color="bg-blue-500"
            />
            <AllocationRangeBar 
              label="Hedging" 
              range={recommendation.hedgingRange}
              color="bg-amber-500"
            />
            <AllocationRangeBar 
              label="Alternatives" 
              range={recommendation.alternativesRange}
              color="bg-purple-500"
            />
            <AllocationRangeBar 
              label="Cash" 
              range={recommendation.cashRange}
              color="bg-slate-400"
            />
          </CardContent>
        </Card>

        {/* Geography Tilt */}
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe size={14} className="text-primary" />
              <span className="font-mono tracking-wide">GEOGRAPHY TILT</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <GeographyRangeBar 
              label="🇮🇱 Israel" 
              range={recommendation.geographyTilt.israel}
            />
            <GeographyRangeBar 
              label="🇺🇸 USA" 
              range={recommendation.geographyTilt.usa}
            />
            <GeographyRangeBar 
              label="🇪🇺 Europe" 
              range={recommendation.geographyTilt.europe}
            />
            <GeographyRangeBar 
              label="🌍 Other" 
              range={recommendation.geographyTilt.other}
            />
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          icon={<AlertTriangle size={16} className="text-amber-500" />}
          label="Max Drawdown Tolerance"
          value={`-${recommendation.maxDrawdownTolerance}%`}
          description="Maximum acceptable annual decline"
        />
        <MetricCard 
          icon={<Activity size={16} className="text-blue-500" />}
          label="Volatility Band"
          value={`${recommendation.volatilityBand.min}% - ${recommendation.volatilityBand.max}%`}
          description="Expected portfolio volatility range"
        />
        <MetricCard 
          icon={<Shield size={16} className="text-emerald-500" />}
          label="Risk Profile"
          value={RISK_PROFILE_LABELS[riskProfile]}
          description="Based on your needs assessment"
        />
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={onContinue}
          size="lg"
          className="gap-3 px-8 font-mono relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span>CONTINUE TO PORTFOLIO CONSTRUCTION</span>
          <ArrowRight size={18} />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        These recommendations will be applied as defaults. You can adjust any values in the next steps.
      </p>
    </div>
  );
}

function AllocationRangeBar({ 
  label, 
  range, 
  color 
}: { 
  label: string; 
  range: { min: number; max: number }; 
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{range.min}% – {range.max}%</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden relative">
        <div 
          className={cn("h-full rounded-full opacity-60", color)}
          style={{ 
            marginLeft: `${range.min}%`,
            width: `${range.max - range.min}%`
          }}
        />
      </div>
    </div>
  );
}

function GeographyRangeBar({ 
  label, 
  range 
}: { 
  label: string; 
  range: { min: number; max: number };
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/10 rounded-lg border border-border/30">
      <span className="text-sm">{label}</span>
      <Badge variant="outline" className="font-mono text-xs">
        {range.min}% – {range.max}%
      </Badge>
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  description 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  description: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{label}</p>
            <p className="text-lg font-mono font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
