import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FamilyOfficeProfile } from '@/types/familyOfficeProfile';
import { Wallet, Droplets, PieChart, AlertCircle, Building2 } from 'lucide-react';

interface Props {
  profile: FamilyOfficeProfile;
  onUpdate: <K extends keyof FamilyOfficeProfile>(section: K, data: Partial<FamilyOfficeProfile[K]>) => void;
}

export function WealthLiquidityStep({ profile, onUpdate }: Props) {
  const totalBreakdown = Object.values(profile.wealthStructure.assetBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Wealth Structure */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Total Balance Sheet View</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Liquid Assets: {profile.wealthStructure.liquidAssets}%
                </Label>
                <Slider
                  value={[profile.wealthStructure.liquidAssets]}
                  onValueChange={([v]) => onUpdate('wealthStructure', { 
                    liquidAssets: v, 
                    illiquidAssets: 100 - v 
                  })}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Illiquid Assets: {profile.wealthStructure.illiquidAssets}%
                </Label>
                <Slider
                  value={[profile.wealthStructure.illiquidAssets]}
                  onValueChange={([v]) => onUpdate('wealthStructure', { 
                    illiquidAssets: v, 
                    liquidAssets: 100 - v 
                  })}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <PieChart size={14} className="text-primary" />
                  Asset Breakdown
                </Label>
                <span className={`text-[10px] font-mono ${totalBreakdown === 100 ? 'text-green-400' : 'text-orange-400'}`}>
                  Total: {totalBreakdown}%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'publicMarkets', label: 'Public Markets' },
                  { key: 'privateEquity', label: 'Private Equity / VC' },
                  { key: 'realAssets', label: 'Real Assets' },
                  { key: 'operatingBusinesses', label: 'Operating Businesses' },
                  { key: 'cash', label: 'Cash & Equivalents' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={profile.wealthStructure.assetBreakdown[key as keyof typeof profile.wealthStructure.assetBreakdown]}
                      onChange={(e) => onUpdate('wealthStructure', {
                        assetBreakdown: {
                          ...profile.wealthStructure.assetBreakdown,
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

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Total Leverage Ratio: {profile.wealthStructure.totalLeverageRatio}%
              </Label>
              <Slider
                value={[profile.wealthStructure.totalLeverageRatio]}
                onValueChange={([v]) => onUpdate('wealthStructure', { totalLeverageRatio: v })}
                min={0}
                max={100}
                step={5}
                className="py-2"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Concentration Risk</Label>
                <p className="text-[10px] text-muted-foreground">Single-asset or sector concentration</p>
              </div>
              <Switch
                checked={profile.wealthStructure.hasConcentrationRisk}
                onCheckedChange={(v) => onUpdate('wealthStructure', { hasConcentrationRisk: v })}
              />
            </div>

            {profile.wealthStructure.hasConcentrationRisk && (
              <Textarea
                placeholder="Describe concentration details (e.g., 40% in family business, 25% in single stock)..."
                value={profile.wealthStructure.concentrationDetails || ''}
                onChange={(e) => onUpdate('wealthStructure', { concentrationDetails: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liquidity Profile */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Cash Flow Engineering</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <Label className="text-xs font-medium">Liquidity Requirements (% of portfolio)</Label>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-[10px] text-muted-foreground">T+1</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={profile.liquidityProfile.liquidityNeeds.t1}
                      onChange={(e) => onUpdate('liquidityProfile', {
                        liquidityNeeds: {
                          ...profile.liquidityProfile.liquidityNeeds,
                          t1: Number(e.target.value),
                        },
                      })}
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">30 Days</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={profile.liquidityProfile.liquidityNeeds.days30}
                      onChange={(e) => onUpdate('liquidityProfile', {
                        liquidityNeeds: {
                          ...profile.liquidityProfile.liquidityNeeds,
                          days30: Number(e.target.value),
                        },
                      })}
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">12 Months</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={profile.liquidityProfile.liquidityNeeds.months12}
                      onChange={(e) => onUpdate('liquidityProfile', {
                        liquidityNeeds: {
                          ...profile.liquidityProfile.liquidityNeeds,
                          months12: Number(e.target.value),
                        },
                      })}
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Annual Cashflow Requirement</Label>
                <p className="text-[10px] text-muted-foreground">Regular income distribution needed</p>
              </div>
              <Switch
                checked={profile.liquidityProfile.requiresAnnualCashflow}
                onCheckedChange={(v) => onUpdate('liquidityProfile', { requiresAnnualCashflow: v })}
              />
            </div>

            {profile.liquidityProfile.requiresAnnualCashflow && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Annual distribution:</span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={profile.liquidityProfile.annualCashflowPercent || 3}
                  onChange={(e) => onUpdate('liquidityProfile', { annualCashflowPercent: Number(e.target.value) })}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">% of portfolio</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Upcoming Liquidity Events</Label>
                <p className="text-[10px] text-muted-foreground">Expected within 24 months</p>
              </div>
              <Switch
                checked={profile.liquidityProfile.hasUpcomingLiquidityEvents}
                onCheckedChange={(v) => onUpdate('liquidityProfile', { hasUpcomingLiquidityEvents: v })}
              />
            </div>

            {profile.liquidityProfile.hasUpcomingLiquidityEvents && (
              <Textarea
                placeholder="Describe upcoming liquidity events (IPO, sale, distribution, etc.)..."
                value={profile.liquidityProfile.liquidityEventDetails || ''}
                onChange={(e) => onUpdate('liquidityProfile', { liquidityEventDetails: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regulatory & Tax */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Regulatory & Tax Structure</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Primary Tax Jurisdictions</Label>
              <Input
                placeholder="e.g., Israel, USA, Luxembourg"
                value={profile.regulatoryTax.primaryTaxJurisdictions.join(', ')}
                onChange={(e) => onUpdate('regulatoryTax', { 
                  primaryTaxJurisdictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <Label className="text-xs">Investment Restrictions</Label>
                <Switch
                  checked={profile.regulatoryTax.hasInvestmentRestrictions}
                  onCheckedChange={(v) => onUpdate('regulatoryTax', { hasInvestmentRestrictions: v })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <Label className="text-xs">Holding Structures</Label>
                <Switch
                  checked={profile.regulatoryTax.hasHoldingStructures}
                  onCheckedChange={(v) => onUpdate('regulatoryTax', { hasHoldingStructures: v })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="text-xs">Tax-Aware Allocation Required</Label>
                <p className="text-[10px] text-muted-foreground">Optimize for tax efficiency</p>
              </div>
              <Switch
                checked={profile.regulatoryTax.requiresTaxAwareAllocation}
                onCheckedChange={(v) => onUpdate('regulatoryTax', { requiresTaxAwareAllocation: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
