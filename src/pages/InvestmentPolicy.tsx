import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Save, FileText, Shield, Globe, Percent, Clock, Scale, Loader2, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface GeographicLimit {
  min: number;
  max: number;
}

interface PolicyFormData {
  strategy_philosophy: string;
  equity_min_pct: number;
  equity_max_pct: number;
  fixed_income_min_pct: number;
  fixed_income_max_pct: number;
  alternatives_min_pct: number;
  alternatives_max_pct: number;
  cash_min_pct: number;
  cash_max_pct: number;
  max_single_position_pct: number;
  max_sector_allocation_pct: number;
  max_volatility_pct: number | null;
  geographic_limits: Record<string, GeographicLimit>;
  risk_tolerance: 'low' | 'medium' | 'high';
  investment_horizon_years: number;
  leverage_allowed: boolean;
  max_leverage_ratio: number;
  min_liquid_assets_pct: number;
  special_constraints: string;
}

const defaultPolicy: PolicyFormData = {
  strategy_philosophy: '',
  equity_min_pct: 0,
  equity_max_pct: 100,
  fixed_income_min_pct: 0,
  fixed_income_max_pct: 100,
  alternatives_min_pct: 0,
  alternatives_max_pct: 100,
  cash_min_pct: 5,
  cash_max_pct: 100,
  max_single_position_pct: 25,
  max_sector_allocation_pct: 40,
  max_volatility_pct: null,
  geographic_limits: {
    north_america: { min: 0, max: 100 },
    europe: { min: 0, max: 100 },
    israel: { min: 0, max: 100 },
    emerging_markets: { min: 0, max: 100 },
  },
  risk_tolerance: 'medium',
  investment_horizon_years: 10,
  leverage_allowed: false,
  max_leverage_ratio: 1.0,
  min_liquid_assets_pct: 20,
  special_constraints: '',
};

const GEOGRAPHIES = ['north_america', 'europe', 'israel', 'emerging_markets', 'global', 'other'];

export default function InvestmentPolicy() {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<PolicyFormData>(defaultPolicy);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingPolicy, setHasExistingPolicy] = useState(false);
  const [prospectusUrl, setProspectusUrl] = useState<string | null>(null);
  const [isUploadingProspectus, setIsUploadingProspectus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadPolicy();
      loadProspectus();
    }
  }, [user]);

  const loadProspectus = async () => {
    if (!user) return;
    
    const { data } = await supabase.storage
      .from('policy-documents')
      .list(user.id, { limit: 1, search: 'prospectus' });
    
    if (data && data.length > 0) {
      const { data: urlData } = supabase.storage
        .from('policy-documents')
        .getPublicUrl(`${user.id}/${data[0].name}`);
      setProspectusUrl(urlData.publicUrl);
    }
  };

  const handleProspectusUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploadingProspectus(true);
    try {
      // Delete existing prospectus if any
      const { data: existingFiles } = await supabase.storage
        .from('policy-documents')
        .list(user.id, { search: 'prospectus' });
      
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('policy-documents')
          .remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      // Upload new file
      const fileName = `prospectus_${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from('policy-documents')
        .upload(`${user.id}/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('policy-documents')
        .getPublicUrl(`${user.id}/${fileName}`);
      
      setProspectusUrl(urlData.publicUrl);
      toast.success('Prospectus uploaded successfully');
    } catch (error) {
      console.error('Error uploading prospectus:', error);
      toast.error('Failed to upload prospectus');
    } finally {
      setIsUploadingProspectus(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openProspectus = () => {
    if (prospectusUrl) {
      window.open(prospectusUrl, '_blank');
    }
  };

  const loadPolicy = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('investment_policies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasExistingPolicy(true);
        setPolicy({
          strategy_philosophy: data.strategy_philosophy || '',
          equity_min_pct: data.equity_min_pct || 0,
          equity_max_pct: data.equity_max_pct || 100,
          fixed_income_min_pct: data.fixed_income_min_pct || 0,
          fixed_income_max_pct: data.fixed_income_max_pct || 100,
          alternatives_min_pct: data.alternatives_min_pct || 0,
          alternatives_max_pct: data.alternatives_max_pct || 100,
          cash_min_pct: data.cash_min_pct || 0,
          cash_max_pct: (data as any).cash_max_pct ?? 100,
          max_single_position_pct: data.max_single_position_pct || 100,
          max_sector_allocation_pct: data.max_sector_allocation_pct || 100,
          max_volatility_pct: (data as any).max_volatility_pct ?? null,
          geographic_limits: (data.geographic_limits as unknown as Record<string, GeographicLimit>) || defaultPolicy.geographic_limits,
          risk_tolerance: (data.risk_tolerance as 'low' | 'medium' | 'high') || 'medium',
          investment_horizon_years: data.investment_horizon_years || 10,
          leverage_allowed: data.leverage_allowed || false,
          max_leverage_ratio: data.max_leverage_ratio || 1.0,
          min_liquid_assets_pct: data.min_liquid_assets_pct || 0,
          special_constraints: data.special_constraints || '',
        });
      }
    } catch (error) {
      console.error('Error loading policy:', error);
      toast.error('Failed to load investment policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        strategy_philosophy: policy.strategy_philosophy,
        equity_min_pct: policy.equity_min_pct,
        equity_max_pct: policy.equity_max_pct,
        fixed_income_min_pct: policy.fixed_income_min_pct,
        fixed_income_max_pct: policy.fixed_income_max_pct,
        alternatives_min_pct: policy.alternatives_min_pct,
        alternatives_max_pct: policy.alternatives_max_pct,
        cash_min_pct: policy.cash_min_pct,
        cash_max_pct: policy.cash_max_pct,
        max_single_position_pct: policy.max_single_position_pct,
        max_sector_allocation_pct: policy.max_sector_allocation_pct,
        max_volatility_pct: policy.max_volatility_pct,
        geographic_limits: JSON.parse(JSON.stringify(policy.geographic_limits)),
        risk_tolerance: policy.risk_tolerance,
        investment_horizon_years: policy.investment_horizon_years,
        leverage_allowed: policy.leverage_allowed,
        max_leverage_ratio: policy.max_leverage_ratio,
        min_liquid_assets_pct: policy.min_liquid_assets_pct,
        special_constraints: policy.special_constraints,
      };

      let error;
      if (hasExistingPolicy) {
        const result = await supabase
          .from('investment_policies')
          .update(payload as any)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('investment_policies')
          .insert(payload as any);
        error = result.error;
        if (!error) setHasExistingPolicy(true);
      }

      if (error) throw error;
      toast.success('Investment policy saved');
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Failed to save investment policy');
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeoLimit = (geo: string, field: 'min' | 'max', value: number) => {
    setPolicy(prev => ({
      ...prev,
      geographic_limits: {
        ...prev.geographic_limits,
        [geo]: {
          ...prev.geographic_limits[geo],
          [field]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="section-spacing animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Investment Policy</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">Define your strategy, constraints & compliance rules</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleProspectusUpload}
            className="hidden"
          />
          {prospectusUrl ? (
            <Button
              variant="outline"
              onClick={openProspectus}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Prospectus
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingProspectus}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              {isUploadingProspectus ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Prospectus
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gradient-gold text-primary-foreground">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Policy
          </Button>
        </div>
      </div>

      {/* Strategy & Philosophy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Strategy & Philosophy
          </CardTitle>
          <CardDescription>
            Describe your investment philosophy, long-term goals, approach to risk, and overall strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={policy.strategy_philosophy}
            onChange={(e) => setPolicy(prev => ({ ...prev, strategy_philosophy: e.target.value }))}
            placeholder="Example: Long-term value investor focused on quality companies with strong moats. I prefer a balanced portfolio with 60-70% equities, moderate fixed income exposure, and limited alternatives. I avoid highly speculative positions and prioritize capital preservation over aggressive growth. Willing to accept short-term volatility for long-term returns..."
            className="min-h-[200px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Asset Allocation Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Asset Allocation Limits
          </CardTitle>
          <CardDescription>
            Define minimum and maximum allocation percentages by asset class
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Equity */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Equity Allocation</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Min %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.equity_min_pct}
                    onChange={(e) => setPolicy(prev => ({ ...prev, equity_min_pct: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.equity_max_pct}
                    onChange={(e) => setPolicy(prev => ({ ...prev, equity_max_pct: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Fixed Income */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Fixed Income Allocation</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Min %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.fixed_income_min_pct}
                    onChange={(e) => setPolicy(prev => ({ ...prev, fixed_income_min_pct: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.fixed_income_max_pct}
                    onChange={(e) => setPolicy(prev => ({ ...prev, fixed_income_max_pct: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Alternatives */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Alternatives (PE, HF, etc.)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Min %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.alternatives_min_pct}
                    onChange={(e) => setPolicy(prev => ({ ...prev, alternatives_min_pct: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={policy.alternatives_max_pct}
                    onChange={(e) => setPolicy(prev => ({ ...prev, alternatives_max_pct: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Cash %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={policy.cash_min_pct}
                onChange={(e) => setPolicy(prev => ({ ...prev, cash_min_pct: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Maximum Cash %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={policy.cash_max_pct}
                onChange={(e) => setPolicy(prev => ({ ...prev, cash_max_pct: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Single Position %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={policy.max_single_position_pct}
                onChange={(e) => setPolicy(prev => ({ ...prev, max_single_position_pct: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Sector Allocation %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={policy.max_sector_allocation_pct}
                onChange={(e) => setPolicy(prev => ({ ...prev, max_sector_allocation_pct: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Geographic Allocation Limits
          </CardTitle>
          <CardDescription>
            Set min/max allocation percentages by region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GEOGRAPHIES.slice(0, 4).map((geo) => (
              <div key={geo} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium capitalize">{geo.replace(/_/g, ' ')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Min %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={policy.geographic_limits[geo]?.min || 0}
                      onChange={(e) => updateGeoLimit(geo, 'min', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={policy.geographic_limits[geo]?.max || 100}
                      onChange={(e) => updateGeoLimit(geo, 'max', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk & Horizon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Risk Profile & Time Horizon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Risk Tolerance</Label>
              <Select
                value={policy.risk_tolerance}
                onValueChange={(v: 'low' | 'medium' | 'high') => setPolicy(prev => ({ ...prev, risk_tolerance: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Capital preservation focus</SelectItem>
                  <SelectItem value="medium">Medium - Balanced growth & safety</SelectItem>
                  <SelectItem value="high">High - Aggressive growth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Investment Horizon (years)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={policy.investment_horizon_years}
                onChange={(e) => setPolicy(prev => ({ ...prev, investment_horizon_years: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Liquid Assets %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={policy.min_liquid_assets_pct}
                onChange={(e) => setPolicy(prev => ({ ...prev, min_liquid_assets_pct: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Volatility % (Std Dev)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                placeholder="e.g., 15"
                value={policy.max_volatility_pct ?? ''}
                onChange={(e) => setPolicy(prev => ({ 
                  ...prev, 
                  max_volatility_pct: e.target.value === '' ? null : Number(e.target.value) 
                }))}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Leverage Allowed</Label>
                  <p className="text-xs text-muted-foreground">Enable use of margin or borrowed funds</p>
                </div>
                <Switch
                  checked={policy.leverage_allowed}
                  onCheckedChange={(v) => setPolicy(prev => ({ ...prev, leverage_allowed: v }))}
                />
              </div>
              {policy.leverage_allowed && (
                <div className="space-y-2">
                  <Label className="text-sm">Max Leverage Ratio</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[policy.max_leverage_ratio]}
                      onValueChange={([v]) => setPolicy(prev => ({ ...prev, max_leverage_ratio: v }))}
                      min={1}
                      max={5}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{policy.max_leverage_ratio.toFixed(1)}x</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Special Constraints
          </CardTitle>
          <CardDescription>
            Any additional rules, exclusions, or requirements (e.g., no crypto, ESG requirements, no small caps, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={policy.special_constraints}
            onChange={(e) => setPolicy(prev => ({ ...prev, special_constraints: e.target.value }))}
            placeholder="Example: No cryptocurrency positions. Avoid tobacco and weapons manufacturers. Prefer companies with strong ESG scores. Minimum market cap $1B for individual stocks..."
            className="min-h-[100px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gradient-gold text-primary-foreground">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Investment Policy
        </Button>
      </div>
    </div>
  );
}
