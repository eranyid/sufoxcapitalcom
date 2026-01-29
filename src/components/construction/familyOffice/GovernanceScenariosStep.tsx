import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { FamilyOfficeProfile } from '@/types/familyOfficeProfile';
import { Users, AlertTriangle, Shield, Calendar, TrendingDown, Flame } from 'lucide-react';

interface Props {
  profile: FamilyOfficeProfile;
  onUpdate: <K extends keyof FamilyOfficeProfile>(section: K, data: Partial<FamilyOfficeProfile[K]>) => void;
}

export function GovernanceScenariosStep({ profile, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      {/* Governance */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Governance & Decision Process</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Final Investment Decision Maker</Label>
              <RadioGroup 
                value={profile.governance.decisionMaker}
                onValueChange={(v) => onUpdate('governance', { decisionMaker: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'principal', label: 'Principal / Family Head', desc: 'Direct decision authority' },
                  { value: 'family_office', label: 'Family Office CIO', desc: 'Delegated authority' },
                  { value: 'investment_committee', label: 'Investment Committee', desc: 'Committee approval' },
                  { value: 'external_advisor', label: 'External Advisor', desc: 'Advisory-led decisions' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.governance.decisionMaker === value
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
              <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                <Calendar size={12} />
                Rebalancing Frequency
              </Label>
              <RadioGroup 
                value={profile.governance.rebalancingFrequency}
                onValueChange={(v) => onUpdate('governance', { rebalancingFrequency: v as any })}
                className="grid grid-cols-5 gap-2"
              >
                {[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'semi_annual', label: 'Semi-Annual' },
                  { value: 'annual', label: 'Annual' },
                  { value: 'opportunistic', label: 'Opportunistic' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all ${
                      profile.governance.rebalancingFrequency === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="text-[10px]">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <Label className="text-xs">Investment Committee</Label>
                  <p className="text-[10px] text-muted-foreground">Formal IC structure</p>
                </div>
                <Switch
                  checked={profile.governance.hasInvestmentCommittee}
                  onCheckedChange={(v) => onUpdate('governance', { hasInvestmentCommittee: v })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <Label className="text-xs">Separate Risk Officer</Label>
                  <p className="text-[10px] text-muted-foreground">Dedicated CRO role</p>
                </div>
                <Switch
                  checked={profile.governance.hasSeparateRiskOfficer}
                  onCheckedChange={(v) => onUpdate('governance', { hasSeparateRiskOfficer: v })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Scenarios */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Stress & Crisis Scenarios</h3>
          </div>

          <div className="space-y-5">
            {/* Market Crash */}
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-red-400" />
                <Label className="text-xs font-medium">If markets drop 40%:</Label>
              </div>
              <RadioGroup 
                value={profile.crisisScenarios.market40PercentDrop}
                onValueChange={(v) => onUpdate('crisisScenarios', { market40PercentDrop: v as any })}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { value: 'buy', label: 'Buy Aggressively', color: 'border-green-500 bg-green-500/10' },
                  { value: 'hold', label: 'Hold Positions', color: 'border-yellow-500 bg-yellow-500/10' },
                  { value: 'reduce', label: 'Reduce Exposure', color: 'border-red-500 bg-red-500/10' },
                ].map(({ value, label, color }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.crisisScenarios.market40PercentDrop === value
                        ? color
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* High Inflation */}
            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-orange-400" />
                <Label className="text-xs font-medium">If inflation exceeds 8% for two years:</Label>
              </div>
              <RadioGroup 
                value={profile.crisisScenarios.highInflationResponse}
                onValueChange={(v) => onUpdate('crisisScenarios', { highInflationResponse: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'change_allocation', label: 'Change Allocation', desc: 'Shift to inflation hedges' },
                  { value: 'no_change', label: 'Maintain Strategy', desc: 'Stay the course' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.crisisScenarios.highInflationResponse === value
                        ? 'border-orange-500 bg-orange-500/10'
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

            {/* Geopolitical Crisis */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-blue-400" />
                <Label className="text-xs font-medium">In case of regional geopolitical crisis:</Label>
              </div>
              <RadioGroup 
                value={profile.crisisScenarios.geopoliticalCrisisResponse}
                onValueChange={(v) => onUpdate('crisisScenarios', { geopoliticalCrisisResponse: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'reduce_israel', label: 'Reduce Israel Exposure', desc: 'Geographic de-risking' },
                  { value: 'maintain', label: 'Maintain Exposure', desc: 'Long-term conviction' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.crisisScenarios.geopoliticalCrisisResponse === value
                        ? 'border-blue-500 bg-blue-500/10'
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
    </div>
  );
}
