import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
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
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target size={16} className="text-primary" />
            Investment Objective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.objective}
            onValueChange={(val) => onUpdateObjective(val as ObjectiveType)}
            className="space-y-2"
          >
            {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                <RadioGroupItem value={value} id={value} />
                <Label htmlFor={value} className="cursor-pointer text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Risk Tolerance */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            Risk Tolerance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={data.riskLevel}
            onValueChange={(val) => onUpdateRiskLevel(val as RiskLevel)}
            className="flex gap-4"
          >
            {Object.entries(RISK_LABELS).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`risk-${value}`} />
                <Label htmlFor={`risk-${value}`} className="cursor-pointer text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="pt-4 border-t border-border">
            <Label className="text-xs text-muted-foreground flex items-center gap-2 mb-3">
              <Clock size={14} />
              Investment Horizon: Long-term (default)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Minimum Constraints */}
      <Card className="bg-card border-border md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Allocation Constraints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Min Equities %</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data.constraints.minEquities]}
                  onValueChange={([val]) => updateConstraint('minEquities', val)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={data.constraints.minEquities}
                  onChange={(e) => updateConstraint('minEquities', Number(e.target.value))}
                  className="w-16 h-8 text-center text-xs"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Min Cash %</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data.constraints.minCash]}
                  onValueChange={([val]) => updateConstraint('minCash', val)}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={data.constraints.minCash}
                  onChange={(e) => updateConstraint('minCash', Number(e.target.value))}
                  className="w-16 h-8 text-center text-xs"
                  min={0}
                  max={50}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Min Hedge/Short %</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data.constraints.minHedge]}
                  onValueChange={([val]) => updateConstraint('minHedge', val)}
                  max={30}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={data.constraints.minHedge}
                  onChange={(e) => updateConstraint('minHedge', Number(e.target.value))}
                  className="w-16 h-8 text-center text-xs"
                  min={0}
                  max={30}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Droplets size={12} />
                Liquidity Requirement
              </Label>
              <RadioGroup
                value={data.constraints.liquidityRequirement}
                onValueChange={(val) => updateConstraint('liquidityRequirement', val as LiquidityRequirement)}
                className="flex gap-2"
              >
                {Object.entries(LIQUIDITY_LABELS).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-1">
                    <RadioGroupItem value={value} id={`liq-${value}`} className="h-3 w-3" />
                    <Label htmlFor={`liq-${value}`} className="cursor-pointer text-xs">
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
