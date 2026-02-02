import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, TrendingUp, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AllocationObjectives } from '@/pages/AllocationBuilder';

interface PipelineObjectivesStepProps {
  objectives: AllocationObjectives;
  onChange: (objectives: AllocationObjectives) => void;
}

const OBJECTIVES = [
  { id: 'growth', label: 'Growth', description: 'Maximize capital appreciation', icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'balanced', label: 'Balanced', description: 'Growth with income', icon: Target, color: 'text-primary bg-primary/10 border-primary/30' },
  { id: 'income', label: 'Income', description: 'Generate cash flow', icon: Shield, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'preservation', label: 'Preservation', description: 'Protect capital', icon: Shield, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
];

const RISK_LEVELS = [
  { id: 'conservative', label: 'Conservative', description: 'Low volatility, stable returns', color: 'border-emerald-500/50 bg-emerald-500/5' },
  { id: 'moderate', label: 'Moderate', description: 'Balanced risk/reward', color: 'border-amber-500/50 bg-amber-500/5' },
  { id: 'aggressive', label: 'Aggressive', description: 'Higher risk for higher returns', color: 'border-rose-500/50 bg-rose-500/5' },
];

const HORIZONS = [
  { id: 'short', label: '1-3 Years', description: 'Short-term' },
  { id: 'medium', label: '3-7 Years', description: 'Medium-term' },
  { id: 'long', label: '7+ Years', description: 'Long-term' },
];

export function PipelineObjectivesStep({ objectives, onChange }: PipelineObjectivesStepProps) {
  return (
    <div className="space-y-6">
      {/* Allocation Name */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target size={16} className="text-primary" />
            Allocation Name
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={objectives.name}
            onChange={(e) => onChange({ ...objectives, name: e.target.value })}
            placeholder="e.g., Primary Portfolio, Retirement Fund..."
            className="text-base"
          />
        </CardContent>
      </Card>

      {/* Investment Objective */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Investment Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {OBJECTIVES.map((obj) => {
              const Icon = obj.icon;
              const isSelected = objectives.objective === obj.id;
              return (
                <button
                  key={obj.id}
                  onClick={() => onChange({ ...objectives, objective: obj.id as any })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    isSelected ? obj.color : "border-border/50 hover:border-border"
                  )}
                >
                  <Icon size={20} className={cn("mb-2", isSelected ? "" : "text-muted-foreground")} />
                  <div className="font-medium text-sm">{obj.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{obj.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Risk Tolerance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {RISK_LEVELS.map((risk) => {
              const isSelected = objectives.riskLevel === risk.id;
              return (
                <button
                  key={risk.id}
                  onClick={() => onChange({ ...objectives, riskLevel: risk.id as any })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    isSelected ? risk.color : "border-border/50 hover:border-border"
                  )}
                >
                  <div className="font-medium text-sm">{risk.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{risk.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Horizon */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            Investment Horizon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {HORIZONS.map((horizon) => {
              const isSelected = objectives.horizon === horizon.id;
              return (
                <button
                  key={horizon.id}
                  onClick={() => onChange({ ...objectives, horizon: horizon.id as any })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    isSelected 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <div className="font-mono text-lg font-bold">{horizon.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{horizon.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
