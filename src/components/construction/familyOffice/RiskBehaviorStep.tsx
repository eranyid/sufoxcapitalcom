import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FamilyOfficeProfile } from '@/types/familyOfficeProfile';
import { Shield, Brain, AlertTriangle, Activity, TrendingDown, Zap } from 'lucide-react';

interface Props {
  profile: FamilyOfficeProfile;
  onUpdate: <K extends keyof FamilyOfficeProfile>(section: K, data: Partial<FamilyOfficeProfile[K]>) => void;
}

export function RiskBehaviorStep({ profile, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      {/* Drawdown Tolerance */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Drawdown Tolerance</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                If liquid portfolio drops 20% in one quarter, you would:
              </Label>
              <RadioGroup 
                value={profile.drawdownTolerance.quarterlyDrawdownReaction}
                onValueChange={(v) => onUpdate('drawdownTolerance', { quarterlyDrawdownReaction: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'no_change', label: 'No Change', desc: 'Stay the course' },
                  { value: 'rebalance', label: 'Rebalance', desc: 'Opportunistic buying' },
                  { value: 'reduce_risk', label: 'Reduce Risk', desc: 'De-risk exposure' },
                  { value: 'strategic_change', label: 'Strategic Change', desc: 'Review entire strategy' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.drawdownTolerance.quarterlyDrawdownReaction === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Maximum Acceptable Annual Drawdown</Label>
              <RadioGroup 
                value={profile.drawdownTolerance.maxAcceptableDrawdown}
                onValueChange={(v) => onUpdate('drawdownTolerance', { maxAcceptableDrawdown: v as any })}
                className="grid grid-cols-4 gap-2"
              >
                {[
                  { value: '10', label: '10%', color: 'text-green-400' },
                  { value: '20', label: '20%', color: 'text-yellow-400' },
                  { value: '30', label: '30%', color: 'text-orange-400' },
                  { value: '40_plus', label: '40%+', color: 'text-red-400' },
                ].map(({ value, label, color }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.drawdownTolerance.maxAcceptableDrawdown === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className={`text-sm font-mono ${color}`}>{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Primary Risk Priority</Label>
              <RadioGroup 
                value={profile.drawdownTolerance.riskPriority}
                onValueChange={(v) => onUpdate('drawdownTolerance', { riskPriority: v as any })}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { value: 'minimize_volatility', label: 'Minimize Volatility', icon: Activity },
                  { value: 'maximize_return', label: 'Maximize Return', icon: Zap },
                  { value: 'tail_risk_control', label: 'Tail Risk Control', icon: Shield },
                ].map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.drawdownTolerance.riskPriority === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <Icon size={16} className="text-primary" />
                    <span className="text-[10px] text-center">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Profile */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Behavioral Profile (Reality Check)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                During 2020-2022 market volatility, what did you actually do?
              </Label>
              <RadioGroup 
                value={profile.behavioralProfile.covidPeriodBehavior}
                onValueChange={(v) => onUpdate('behavioralProfile', { covidPeriodBehavior: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'bought_dip', label: 'Bought the Dip', desc: 'Added risk aggressively' },
                  { value: 'held_steady', label: 'Held Steady', desc: 'Maintained positions' },
                  { value: 'reduced_exposure', label: 'Reduced Exposure', desc: 'Trimmed positions' },
                  { value: 'panicked', label: 'Exited Quickly', desc: 'Significant de-risking' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.behavioralProfile.covidPeriodBehavior === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                At a 15% loss, what would you typically do?
              </Label>
              <RadioGroup 
                value={profile.behavioralProfile.at15PercentLoss}
                onValueChange={(v) => onUpdate('behavioralProfile', { at15PercentLoss: v as any })}
                className="grid grid-cols-4 gap-2"
              >
                {[
                  { value: 'bought_more', label: 'Buy More' },
                  { value: 'held', label: 'Hold' },
                  { value: 'reduced', label: 'Reduce' },
                  { value: 'sold_all', label: 'Exit' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.behavioralProfile.at15PercentLoss === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Self-Assessment as Investor</Label>
              <RadioGroup 
                value={profile.behavioralProfile.selfAssessment}
                onValueChange={(v) => onUpdate('behavioralProfile', { selfAssessment: v as any })}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { value: 'rational', label: 'Rational', desc: 'Data-driven decisions' },
                  { value: 'reactive', label: 'Reactive', desc: 'Emotion-influenced' },
                  { value: 'opportunistic', label: 'Opportunistic', desc: 'Contrarian approach' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.behavioralProfile.selfAssessment === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Philosophy */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Investment Beliefs</h3>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Do you believe in:</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'marketEfficiency', label: 'Market Efficiency' },
                { key: 'activeAlpha', label: 'Active Alpha Generation' },
                { key: 'factorInvesting', label: 'Factor Investing' },
                { key: 'illiquidityPremium', label: 'Illiquidity Premium' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    profile.investmentPhilosophy.beliefs[key as keyof typeof profile.investmentPhilosophy.beliefs]
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onUpdate('investmentPhilosophy', {
                    beliefs: {
                      ...profile.investmentPhilosophy.beliefs,
                      [key]: !profile.investmentPhilosophy.beliefs[key as keyof typeof profile.investmentPhilosophy.beliefs],
                    },
                  })}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    profile.investmentPhilosophy.beliefs[key as keyof typeof profile.investmentPhilosophy.beliefs]
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {profile.investmentPhilosophy.beliefs[key as keyof typeof profile.investmentPhilosophy.beliefs] && (
                      <span className="text-[10px] text-primary-foreground">✓</span>
                    )}
                  </div>
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>

            <div className="pt-3">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Max allocation to non-transparent strategies: {profile.investmentPhilosophy.blackBoxAllocationPercent}%
              </Label>
              <input
                type="range"
                min={0}
                max={50}
                value={profile.investmentPhilosophy.blackBoxAllocationPercent}
                onChange={(e) => onUpdate('investmentPhilosophy', { blackBoxAllocationPercent: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
