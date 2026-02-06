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
import { Target, Shield, Droplets } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Section 1: Objective & Risk — side by side */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Objective — wider */}
        <div className="md:col-span-3 rounded-xl border border-border/40 bg-card/40 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider uppercase">
            <Target size={12} className="text-primary" />
            Investment Objective
          </div>
          <RadioGroup
            value={data.objective}
            onValueChange={(val) => onUpdateObjective(val as ObjectiveType)}
            className="grid grid-cols-2 gap-2"
          >
            {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200",
                  data.objective === value
                    ? "border-primary/50 bg-primary/8"
                    : "border-border/30 hover:border-border/60 hover:bg-muted/10"
                )}
              >
                <RadioGroupItem value={value} id={value} />
                <span className="text-sm font-medium">{label}</span>
                {data.objective === value && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Risk Profile — narrower */}
        <div className="md:col-span-2 rounded-xl border border-border/40 bg-card/40 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider uppercase">
            <Shield size={12} className="text-primary" />
            Risk Profile
          </div>
          <RadioGroup
            value={data.riskLevel}
            onValueChange={(val) => onUpdateRiskLevel(val as RiskLevel)}
            className="flex gap-2"
          >
            {Object.entries(RISK_LABELS).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all duration-200 text-center",
                  data.riskLevel === value
                    ? "border-primary/50 bg-primary/8"
                    : "border-border/30 hover:border-border/60 hover:bg-muted/10"
                )}
              >
                <RadioGroupItem value={value} id={`risk-${value}`} className="sr-only" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </RadioGroup>

          <div className="p-3 rounded-lg bg-muted/15 border border-border/20">
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider">HORIZON</span>
            <p className="text-sm font-medium mt-0.5">Long-term (Default)</p>
          </div>
        </div>
      </div>

      {/* Section 2: Constraints — horizontal strip */}
      <div className="rounded-xl border border-border/40 bg-card/40 p-5 space-y-4">
        <div className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
          Allocation Constraints
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Min Equities */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground font-mono">MIN EQUITIES</Label>
              <span className="text-sm font-mono font-bold text-primary">{data.constraints.minEquities}%</span>
            </div>
            <Slider
              value={[data.constraints.minEquities]}
              onValueChange={([val]) => updateConstraint('minEquities', val)}
              max={100}
              step={5}
            />
          </div>

          {/* Min Cash */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground font-mono">MIN CASH</Label>
              <span className="text-sm font-mono font-bold text-primary">{data.constraints.minCash}%</span>
            </div>
            <Slider
              value={[data.constraints.minCash]}
              onValueChange={([val]) => updateConstraint('minCash', val)}
              max={50}
              step={1}
            />
          </div>

          {/* Min Hedge */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground font-mono">MIN HEDGE</Label>
              <span className="text-sm font-mono font-bold text-primary">{data.constraints.minHedge}%</span>
            </div>
            <Slider
              value={[data.constraints.minHedge]}
              onValueChange={([val]) => updateConstraint('minHedge', val)}
              max={30}
              step={1}
            />
          </div>

          {/* Liquidity */}
          <div className="space-y-2.5">
            <Label className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
              <Droplets size={10} />
              LIQUIDITY REQ
            </Label>
            <RadioGroup
              value={data.constraints.liquidityRequirement}
              onValueChange={(val) => updateConstraint('liquidityRequirement', val as LiquidityRequirement)}
              className="flex gap-1.5"
            >
              {Object.entries(LIQUIDITY_LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex-1 flex items-center justify-center py-2 rounded-lg border cursor-pointer transition-all text-center",
                    data.constraints.liquidityRequirement === value
                      ? "border-primary/50 bg-primary/8"
                      : "border-border/30 hover:border-border/60"
                  )}
                >
                  <RadioGroupItem value={value} id={`liq-${value}`} className="sr-only" />
                  <span className="text-[10px] font-medium">{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
