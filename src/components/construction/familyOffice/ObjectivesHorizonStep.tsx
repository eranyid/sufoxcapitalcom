import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { FamilyOfficeProfile } from '@/types/familyOfficeProfile';
import { Target, Clock, TrendingUp, Banknote, Calendar, Shield } from 'lucide-react';

interface Props {
  profile: FamilyOfficeProfile;
  onUpdate: <K extends keyof FamilyOfficeProfile>(section: K, data: Partial<FamilyOfficeProfile[K]>) => void;
}

export function ObjectivesHorizonStep({ profile, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      {/* Capital Objectives */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Capital Objectives</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Primary Purpose of Capital</Label>
              <RadioGroup 
                value={profile.capitalObjectives.primaryPurpose}
                onValueChange={(v) => onUpdate('capitalObjectives', { primaryPurpose: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'preservation', label: 'Intergenerational Preservation', icon: Shield },
                  { value: 'real_growth', label: 'Real Growth Above Inflation', icon: TrendingUp },
                  { value: 'income_generation', label: 'Stable Income Generation', icon: Banknote },
                  { value: 'mixed', label: 'Mixed Objectives', icon: Target },
                ].map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.capitalObjectives.primaryPurpose === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={value} className="sr-only" />
                    <Icon size={14} className="text-primary" />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {profile.capitalObjectives.primaryPurpose === 'mixed' && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <Label className="text-xs text-muted-foreground">Allocation Weights (%)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(['preservation', 'growth', 'income'] as const).map((key) => (
                    <div key={key}>
                      <Label className="text-[10px] uppercase text-muted-foreground">{key}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={profile.capitalObjectives.mixedWeights?.[key] || 0}
                        onChange={(e) => onUpdate('capitalObjectives', {
                          mixedWeights: {
                            ...profile.capitalObjectives.mixedWeights,
                            [key]: Number(e.target.value),
                          },
                        })}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Future Material Commitments</Label>
                <p className="text-[10px] text-muted-foreground">Acquisitions, philanthropy, leverage events</p>
              </div>
              <Switch
                checked={profile.capitalObjectives.hasFutureCommitments}
                onCheckedChange={(v) => onUpdate('capitalObjectives', { hasFutureCommitments: v })}
              />
            </div>

            {profile.capitalObjectives.hasFutureCommitments && (
              <Textarea
                placeholder="Describe upcoming capital commitments..."
                value={profile.capitalObjectives.commitmentDetails || ''}
                onChange={(e) => onUpdate('capitalObjectives', { commitmentDetails: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Formal Real Return Target</Label>
                <p className="text-[10px] text-muted-foreground">e.g., CPI + 3%</p>
              </div>
              <Switch
                checked={profile.capitalObjectives.hasRealReturnTarget}
                onCheckedChange={(v) => onUpdate('capitalObjectives', { hasRealReturnTarget: v })}
              />
            </div>

            {profile.capitalObjectives.hasRealReturnTarget && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">CPI +</span>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={profile.capitalObjectives.realReturnTarget || 3}
                  onChange={(e) => onUpdate('capitalObjectives', { realReturnTarget: Number(e.target.value) })}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Investment Horizon */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Intergenerational Horizon</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Effective Investment Horizon</Label>
              <RadioGroup 
                value={profile.investmentHorizon.effectiveHorizon}
                onValueChange={(v) => onUpdate('investmentHorizon', { effectiveHorizon: v as any })}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { value: '5_10', label: '5-10 Years' },
                  { value: '10_20', label: '10-20 Years' },
                  { value: '20_plus', label: '20+ Years' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.investmentHorizon.effectiveHorizon === value
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

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Intergenerational Transfer Policy</Label>
                <p className="text-[10px] text-muted-foreground">Trust / Holding structure in place</p>
              </div>
              <Switch
                checked={profile.investmentHorizon.hasIntergenerationalPolicy}
                onCheckedChange={(v) => onUpdate('investmentHorizon', { hasIntergenerationalPolicy: v })}
              />
            </div>

            {profile.investmentHorizon.hasIntergenerationalPolicy && (
              <Textarea
                placeholder="Describe transfer policy structure..."
                value={profile.investmentHorizon.policyDetails || ''}
                onChange={(e) => onUpdate('investmentHorizon', { policyDetails: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Beneficiary Diversity</Label>
                <p className="text-[10px] text-muted-foreground">Multiple beneficiaries with different needs</p>
              </div>
              <Switch
                checked={profile.investmentHorizon.hasBeneficiaryDiversity}
                onCheckedChange={(v) => onUpdate('investmentHorizon', { hasBeneficiaryDiversity: v })}
              />
            </div>

            {profile.investmentHorizon.hasBeneficiaryDiversity && (
              <Textarea
                placeholder="Describe beneficiary needs and mandate considerations..."
                value={profile.investmentHorizon.beneficiaryDetails || ''}
                onChange={(e) => onUpdate('investmentHorizon', { beneficiaryDetails: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Benchmarking */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Benchmarking & Success Metrics</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Primary Benchmark</Label>
              <RadioGroup 
                value={profile.benchmarkingPreferences.primaryBenchmark}
                onValueChange={(v) => onUpdate('benchmarkingPreferences', { primaryBenchmark: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'sp500', label: 'S&P 500' },
                  { value: '60_40', label: '60/40 Portfolio' },
                  { value: 'cpi_plus', label: 'CPI + X%' },
                  { value: 'custom_policy', label: 'Custom Policy Index' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.benchmarkingPreferences.primaryBenchmark === value
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

            {profile.benchmarkingPreferences.primaryBenchmark === 'cpi_plus' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Target: CPI +</span>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={profile.benchmarkingPreferences.cpiPlusTarget || 3}
                  onChange={(e) => onUpdate('benchmarkingPreferences', { cpiPlusTarget: Number(e.target.value) })}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Success Measured Against</Label>
              <RadioGroup 
                value={profile.benchmarkingPreferences.successMetric}
                onValueChange={(v) => onUpdate('benchmarkingPreferences', { successMetric: v as any })}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { value: 'vs_market', label: 'Market Benchmark' },
                  { value: 'vs_real_target', label: 'Real Return Target' },
                  { value: 'vs_peers', label: 'Peer Comparison' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.benchmarkingPreferences.successMetric === value
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
              <Label className="text-xs text-muted-foreground mb-2 block">
                Max Acceptable Tracking Error: {profile.benchmarkingPreferences.maxTrackingError}%
              </Label>
              <Slider
                value={[profile.benchmarkingPreferences.maxTrackingError]}
                onValueChange={([v]) => onUpdate('benchmarkingPreferences', { maxTrackingError: v })}
                min={2}
                max={20}
                step={1}
                className="py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
