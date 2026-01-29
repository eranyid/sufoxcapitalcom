import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { FamilyOfficeProfile } from '@/types/familyOfficeProfile';
import { Layers, Globe, DollarSign, Lock, TrendingUp, Leaf } from 'lucide-react';

interface Props {
  profile: FamilyOfficeProfile;
  onUpdate: <K extends keyof FamilyOfficeProfile>(section: K, data: Partial<FamilyOfficeProfile[K]>) => void;
}

export function AlternativesCurrencyStep({ profile, onUpdate }: Props) {
  const totalGeo = Object.values(profile.geographicCurrency.geographicPreferences).reduce((a, b) => a + b, 0);
  const totalAlts = Object.values(profile.alternativesPolicy.targetAllocations).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Geographic & Currency */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Geographic & Currency Preferences</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Base Currency</Label>
              <RadioGroup 
                value={profile.geographicCurrency.baseCurrency}
                onValueChange={(v) => onUpdate('geographicCurrency', { baseCurrency: v as any })}
                className="grid grid-cols-5 gap-2"
              >
                {['ILS', 'USD', 'EUR', 'CHF', 'GBP'].map((currency) => (
                  <label
                    key={currency}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.geographicCurrency.baseCurrency === currency
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={currency} className="sr-only" />
                    <span className="text-xs font-mono">{currency}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Geographic Allocation Targets</Label>
                <span className={`text-[10px] font-mono ${totalGeo === 100 ? 'text-green-400' : 'text-orange-400'}`}>
                  Total: {totalGeo}%
                </span>
              </div>
              
              <div className="space-y-2">
                {[
                  { key: 'israel', label: 'Israel', flag: '🇮🇱' },
                  { key: 'us', label: 'United States', flag: '🇺🇸' },
                  { key: 'europe', label: 'Europe', flag: '🇪🇺' },
                  { key: 'emergingMarkets', label: 'Emerging Markets', flag: '🌍' },
                  { key: 'other', label: 'Other', flag: '🌐' },
                ].map(({ key, label, flag }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-6 text-center">{flag}</span>
                    <span className="text-xs w-32">{label}</span>
                    <Slider
                      value={[profile.geographicCurrency.geographicPreferences[key as keyof typeof profile.geographicCurrency.geographicPreferences]]}
                      onValueChange={([v]) => onUpdate('geographicCurrency', {
                        geographicPreferences: {
                          ...profile.geographicCurrency.geographicPreferences,
                          [key]: v,
                        },
                      })}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-12 text-right">
                      {profile.geographicCurrency.geographicPreferences[key as keyof typeof profile.geographicCurrency.geographicPreferences]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Currency Hedge Ratio: {profile.geographicCurrency.hedgeRatio}%
              </Label>
              <Slider
                value={[profile.geographicCurrency.hedgeRatio]}
                onValueChange={([v]) => onUpdate('geographicCurrency', { hedgeRatio: v })}
                min={0}
                max={100}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Unhedged</span>
                <span>Fully Hedged</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternatives Policy */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Alternatives Policy</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Target Private Market Allocations</Label>
                <span className={`text-[10px] font-mono ${totalAlts <= 60 ? 'text-green-400' : 'text-orange-400'}`}>
                  Total: {totalAlts}%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'privateEquity', label: 'Private Equity' },
                  { key: 'ventureCapital', label: 'Venture Capital' },
                  { key: 'privateCredit', label: 'Private Credit' },
                  { key: 'infrastructure', label: 'Infrastructure' },
                  { key: 'realEstate', label: 'Real Estate' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={profile.alternativesPolicy.targetAllocations[key as keyof typeof profile.alternativesPolicy.targetAllocations]}
                      onChange={(e) => onUpdate('alternativesPolicy', {
                        targetAllocations: {
                          ...profile.alternativesPolicy.targetAllocations,
                          [key]: Number(e.target.value),
                        },
                      })}
                      className="h-8 w-16 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <Lock size={12} />
                  Max Lock-up
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={15}
                    value={profile.alternativesPolicy.maxLockupYears}
                    onChange={(e) => onUpdate('alternativesPolicy', { maxLockupYears: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">yrs</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <TrendingUp size={12} />
                  Min IRR Target
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={5}
                    max={40}
                    value={profile.alternativesPolicy.minimumIRR}
                    onChange={(e) => onUpdate('alternativesPolicy', { minimumIRR: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <DollarSign size={12} />
                  Co-Invest Ratio
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={profile.alternativesPolicy.coInvestmentRatio}
                    onChange={(e) => onUpdate('alternativesPolicy', { coInvestmentRatio: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ESG Policy */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Leaf size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">ESG / Values / Impact</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Sector Exclusions (comma-separated)</Label>
              <Input
                placeholder="e.g., Weapons, Fossil Fuels, Tobacco, Gambling, Crypto"
                value={profile.esgPolicy.sectorExclusions.join(', ')}
                onChange={(e) => onUpdate('esgPolicy', { 
                  sectorExclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Impact Allocation Required</Label>
                <p className="text-[10px] text-muted-foreground">Dedicated impact investing mandate</p>
              </div>
              <Switch
                checked={profile.esgPolicy.requiresImpactAllocation}
                onCheckedChange={(v) => onUpdate('esgPolicy', { requiresImpactAllocation: v })}
              />
            </div>

            {profile.esgPolicy.requiresImpactAllocation && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Impact allocation target:</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={profile.esgPolicy.impactAllocationPercent || 10}
                  onChange={(e) => onUpdate('esgPolicy', { impactAllocationPercent: Number(e.target.value) })}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Values vs. Financial Weight in Decisions</Label>
              <RadioGroup 
                value={profile.esgPolicy.valuesVsFinancialWeight}
                onValueChange={(v) => onUpdate('esgPolicy', { valuesVsFinancialWeight: v as any })}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { value: 'values_first', label: 'Values First', desc: 'ESG over returns' },
                  { value: 'balanced', label: 'Balanced', desc: 'Equal consideration' },
                  { value: 'financial_first', label: 'Financial First', desc: 'Returns priority' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      profile.esgPolicy.valuesVsFinancialWeight === value
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
    </div>
  );
}
