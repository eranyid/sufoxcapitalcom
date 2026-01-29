import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  NeedsAnswers,
  PurposeType,
  TimeHorizonAnswer,
  LossReactionType,
  MaxDrawdownTolerance,
  MonthsReserve,
  BearMarketPatience,
  PreferenceType,
  GeoPreference,
  PURPOSE_LABELS,
  TIME_HORIZON_LABELS,
  LOSS_REACTION_LABELS,
  MAX_DRAWDOWN_LABELS,
  MONTHS_RESERVE_LABELS,
  BEAR_MARKET_LABELS,
  PREFERENCE_LABELS,
  GEO_PREFERENCE_LABELS,
} from '@/types/needsProfile';
import { 
  Target, 
  Clock, 
  TrendingDown, 
  Shield, 
  Wallet, 
  Calendar, 
  Heart,
  Globe,
  AlertTriangle,
  DollarSign,
  Banknote,
  Activity
} from 'lucide-react';

interface NeedsProfilingStepProps {
  answers: NeedsAnswers;
  onUpdate: (updates: Partial<NeedsAnswers>) => void;
  currentSection: number;
}

export function NeedsProfilingStep({ answers, onUpdate, currentSection }: NeedsProfilingStepProps) {
  const renderSection = () => {
    switch (currentSection) {
      case 1:
        return <PurposeSection answers={answers} onUpdate={onUpdate} />;
      case 2:
        return <BehavioralRiskSection answers={answers} onUpdate={onUpdate} />;
      case 3:
        return <FinancialStabilitySection answers={answers} onUpdate={onUpdate} />;
      case 4:
        return <TimeHorizonSection answers={answers} onUpdate={onUpdate} />;
      case 5:
        return <PreferencesSection answers={answers} onUpdate={onUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderSection()}
    </div>
  );
}

// Section A: Purpose
function PurposeSection({ answers, onUpdate }: { answers: NeedsAnswers; onUpdate: (u: Partial<NeedsAnswers>) => void }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/50 via-transparent to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Target size={14} className="text-primary" />
            </div>
            <span className="font-mono tracking-wide">INVESTMENT PURPOSE</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">What is this money intended for?</p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.purpose}
            onValueChange={(val) => onUpdate({ purpose: val as PurposeType })}
            className="space-y-2"
          >
            {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                isSelected={answers.purpose === value}
                icon={value === 'capital_growth' ? <TrendingDown className="rotate-180" size={14} /> : 
                      value === 'income' ? <DollarSign size={14} /> :
                      value === 'capital_preservation' ? <Shield size={14} /> : 
                      <Activity size={14} />}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Clock size={14} className="text-primary" />
            </div>
            <span className="font-mono tracking-wide">TIME TO USE</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">When do you expect to use this money?</p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.timeHorizon}
            onValueChange={(val) => onUpdate({ timeHorizon: val as TimeHorizonAnswer })}
            className="space-y-2"
          >
            {Object.entries(TIME_HORIZON_LABELS).map(([value, label]) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                isSelected={answers.timeHorizon === value}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// Section B: Behavioral Risk
function BehavioralRiskSection({ answers, onUpdate }: { answers: NeedsAnswers; onUpdate: (u: Partial<NeedsAnswers>) => void }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-destructive/50 via-transparent to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-destructive/20 flex items-center justify-center">
              <AlertTriangle size={14} className="text-destructive" />
            </div>
            <span className="font-mono tracking-wide">LOSS REACTION</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            If your portfolio dropped 20% overnight, what would you most likely do?
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.lossReaction}
            onValueChange={(val) => onUpdate({ lossReaction: val as LossReactionType })}
            className="space-y-2"
          >
            {Object.entries(LOSS_REACTION_LABELS).map(([value, label]) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                isSelected={answers.lossReaction === value}
                variant={value === 'sell_all' ? 'danger' : value === 'buy_more' ? 'success' : 'default'}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
              <TrendingDown size={14} className="text-amber-500" />
            </div>
            <span className="font-mono tracking-wide">MAX DRAWDOWN TOLERANCE</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Maximum annual decline you can absorb without changing strategy?
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.maxDrawdown}
            onValueChange={(val) => onUpdate({ maxDrawdown: val as MaxDrawdownTolerance })}
            className="grid grid-cols-2 gap-2"
          >
            {Object.entries(MAX_DRAWDOWN_LABELS).map(([value, label]) => (
              <div
                key={value}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                  answers.maxDrawdown === value
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/30 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <RadioGroupItem value={value} id={`dd-${value}`} />
                <Label htmlFor={`dd-${value}`} className="cursor-pointer text-sm font-mono font-bold">
                  -{label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// Section C: Financial Stability
function FinancialStabilitySection({ answers, onUpdate }: { answers: NeedsAnswers; onUpdate: (u: Partial<NeedsAnswers>) => void }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/50 via-transparent to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
              <Banknote size={14} className="text-emerald-500" />
            </div>
            <span className="font-mono tracking-wide">STABLE INCOME</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Do you have a stable income source outside this portfolio?
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/30 bg-muted/10">
            <div className="flex items-center gap-3">
              <Wallet size={20} className="text-muted-foreground" />
              <span className="text-sm font-medium">External Income Source</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">
                {answers.hasStableIncome ? 'YES' : 'NO'}
              </span>
              <Switch
                checked={answers.hasStableIncome}
                onCheckedChange={(checked) => onUpdate({ hasStableIncome: checked })}
              />
            </div>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Stable income provides a safety net and allows for higher risk tolerance in the portfolio.
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
              <Shield size={14} className="text-blue-500" />
            </div>
            <span className="font-mono tracking-wide">EMERGENCY RESERVE</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            How many months of living expenses do you have outside this portfolio?
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.monthsReserve}
            onValueChange={(val) => onUpdate({ monthsReserve: val as MonthsReserve })}
            className="space-y-2"
          >
            {Object.entries(MONTHS_RESERVE_LABELS).map(([value, label]) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                isSelected={answers.monthsReserve === value}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// Section D: Psychological Time Horizon
function TimeHorizonSection({ answers, onUpdate }: { answers: NeedsAnswers; onUpdate: (u: Partial<NeedsAnswers>) => void }) {
  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 max-w-2xl mx-auto">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/50 via-primary/30 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <Calendar size={14} className="text-primary" />
          </div>
          <span className="font-mono tracking-wide">PSYCHOLOGICAL ENDURANCE</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How long are you truly willing to stay invested during a bear market?
        </p>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={answers.bearMarketPatience}
          onValueChange={(val) => onUpdate({ bearMarketPatience: val as BearMarketPatience })}
          className="grid grid-cols-2 gap-3"
        >
          {Object.entries(BEAR_MARKET_LABELS).map(([value, label]) => (
            <div
              key={value}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                answers.bearMarketPatience === value
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/30 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <RadioGroupItem value={value} id={`bear-${value}`} className="sr-only" />
              <Label 
                htmlFor={`bear-${value}`} 
                className="cursor-pointer text-sm font-medium text-center"
              >
                {label}
              </Label>
              {answers.bearMarketPatience === value && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          ))}
        </RadioGroup>
        
        <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border/30">
          <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
            💡 TIP: Honest self-assessment here is crucial. Overestimating your patience can lead to panic selling during downturns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Section E: Preferences
function PreferencesSection({ answers, onUpdate }: { answers: NeedsAnswers; onUpdate: (u: Partial<NeedsAnswers>) => void }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/50 via-transparent to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Heart size={14} className="text-primary" />
            </div>
            <span className="font-mono tracking-wide">PRIMARY PRIORITY</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">What matters most to you?</p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.primaryPreference}
            onValueChange={(val) => onUpdate({ primaryPreference: val as PreferenceType })}
            className="space-y-2"
          >
            {Object.entries(PREFERENCE_LABELS).map(([value, label]) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                isSelected={answers.primaryPreference === value}
                description={
                  value === 'liquidity' ? 'Access funds quickly when needed' :
                  value === 'stability' ? 'Minimize portfolio volatility' :
                  'Maximize long-term returns'
                }
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Globe size={14} className="text-primary" />
            </div>
            <span className="font-mono tracking-wide">GEOGRAPHIC PREFERENCE</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">What geographic exposure do you prefer?</p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.geoPreference}
            onValueChange={(val) => onUpdate({ geoPreference: val as GeoPreference })}
            className="space-y-2"
          >
            {Object.entries(GEO_PREFERENCE_LABELS).map(([value, label]) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                isSelected={answers.geoPreference === value}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// Reusable Option Card
function OptionCard({ 
  value, 
  label, 
  isSelected, 
  icon,
  description,
  variant = 'default'
}: { 
  value: string; 
  label: string; 
  isSelected: boolean;
  icon?: React.ReactNode;
  description?: string;
  variant?: 'default' | 'danger' | 'success';
}) {
  const borderColor = variant === 'danger' 
    ? 'border-destructive/50' 
    : variant === 'success' 
      ? 'border-emerald-500/50' 
      : 'border-primary/50';
  
  const bgColor = variant === 'danger'
    ? 'bg-destructive/10'
    : variant === 'success'
      ? 'bg-emerald-500/10'
      : 'bg-primary/10';

  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
        isSelected
          ? `${borderColor} ${bgColor}`
          : "border-border/30 hover:border-primary/30 hover:bg-primary/5"
      )}
    >
      <RadioGroupItem value={value} id={value} />
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="flex-1">
        <Label htmlFor={value} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </div>
  );
}
