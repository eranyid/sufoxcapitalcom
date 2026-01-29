import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  WizardData, 
  ObjectiveType, 
  RiskLevel, 
  LiquidityRequirement,
  TargetConstraints,
  OBJECTIVE_LABELS,
  RISK_LABELS,
  LIQUIDITY_LABELS,
} from '@/types/construction';
import { Target, Shield, Clock, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ObjectiveStepProps {
  data: WizardData;
  onUpdateObjective: (value: ObjectiveType) => void;
  onUpdateRiskLevel: (value: RiskLevel) => void;
  onUpdateConstraints: (value: TargetConstraints) => void;
}

export function ObjectiveStep({ data, onUpdateObjective, onUpdateRiskLevel, onUpdateConstraints }: ObjectiveStepProps) {
  const updateConstraint = (key: keyof TargetConstraints, value: number | LiquidityRequirement) => {
    onUpdateConstraints({ ...data.constraints, [key]: value });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Objective Selection */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/50 via-transparent to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Target size={14} className="text-primary" />
            </div>
            <span className="font-mono tracking-wide">INVESTMENT OBJECTIVE</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.objective}
            onValueChange={(val) => onUpdateObjective(val as ObjectiveType)}
            className="space-y-2"
          >
            {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
              <div 
                key={value} 
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                  data.objective === value 
                    ? "border-primary/50 bg-primary/10" 
                    : "border-border/30 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <RadioGroupItem value={value} id={value} />
                <Label htmlFor={value} className="cursor-pointer text-sm font-medium flex-1">
                  {label}
                </Label>
                {data.objective === value && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Risk Tolerance */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Shield size={14} className="text-primary" />
            </div>
            <span className="font-mono tracking-wide">RISK PROFILE</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={data.riskLevel}
            onValueChange={(val) => onUpdateRiskLevel(val as RiskLevel)}
            className="flex gap-2"
          >
            {Object.entries(RISK_LABELS).map(([value, label]) => (
              <div 
                key={value} 
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                  data.riskLevel === value 
                    ? "border-primary/50 bg-primary/10" 
                    : "border-border/30 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <RadioGroupItem value={value} id={`risk-${value}`} />
                <Label htmlFor={`risk-${value}`} className="cursor-pointer text-sm font-medium">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">HORIZON:</span>
              <span className="text-xs font-medium">Long-term (Default)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minimum Constraints */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 md:col-span-2">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium font-mono tracking-wide">
            ALLOCATION CONSTRAINTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {/* Min Equities */}
            <div className="space-y-3 p-4 bg-muted/10 rounded-lg border border-border/30">
              <Label className="text-xs text-muted-foreground font-mono">MIN EQUITIES</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data.constraints.minEquities]}
                  onValueChange={([val]) => updateConstraint('minEquities', val)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <div className="w-14 h-8 rounded bg-background border border-border/50 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-primary">{data.constraints.minEquities}%</span>
                </div>
              </div>
            </div>

            {/* Min Cash */}
            <div className="space-y-3 p-4 bg-muted/10 rounded-lg border border-border/30">
              <Label className="text-xs text-muted-foreground font-mono">MIN CASH</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data.constraints.minCash]}
                  onValueChange={([val]) => updateConstraint('minCash', val)}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <div className="w-14 h-8 rounded bg-background border border-border/50 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-primary">{data.constraints.minCash}%</span>
                </div>
              </div>
            </div>

            {/* Min Hedge */}
            <div className="space-y-3 p-4 bg-muted/10 rounded-lg border border-border/30">
              <Label className="text-xs text-muted-foreground font-mono">MIN HEDGE</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data.constraints.minHedge]}
                  onValueChange={([val]) => updateConstraint('minHedge', val)}
                  max={30}
                  step={1}
                  className="flex-1"
                />
                <div className="w-14 h-8 rounded bg-background border border-border/50 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-primary">{data.constraints.minHedge}%</span>
                </div>
              </div>
            </div>

            {/* Liquidity */}
            <div className="space-y-3 p-4 bg-muted/10 rounded-lg border border-border/30">
              <Label className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Droplets size={12} />
                LIQUIDITY REQ
              </Label>
              <RadioGroup
                value={data.constraints.liquidityRequirement}
                onValueChange={(val) => updateConstraint('liquidityRequirement', val as LiquidityRequirement)}
                className="flex gap-1"
              >
                {Object.entries(LIQUIDITY_LABELS).map(([value, label]) => (
                  <div 
                    key={value} 
                    className={cn(
                      "flex-1 flex items-center justify-center p-2 rounded border transition-all cursor-pointer text-center",
                      data.constraints.liquidityRequirement === value 
                        ? "border-primary/50 bg-primary/10" 
                        : "border-border/30 hover:border-primary/30"
                    )}
                  >
                    <RadioGroupItem value={value} id={`liq-${value}`} className="sr-only" />
                    <Label htmlFor={`liq-${value}`} className="cursor-pointer text-[10px] font-medium">
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}