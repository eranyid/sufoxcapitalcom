import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building2, Plus, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/context/SessionContext';
import type { Position, AssetType, Region, LiquidityBucket } from '@/types/allocationBuilder';
import {
  ASSET_TYPE_LABELS,
  REGION_LABELS,
  LIQUIDITY_LABELS,
  COMMON_SECTORS,
  COMMON_CURRENCIES,
  COUNTRIES_BY_REGION,
} from '@/types/allocationBuilder';

interface ImportFromAnalysisDialogProps {
  onImport: (positions: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  existingNames: string[];
  trigger?: React.ReactNode;
}

interface AnalysisCompany {
  id: string;
  company_name: string;
  ticker: string | null;
  sector: string | null;
  geography: string | null;
  asset_type: string | null;
  status: string;
}

interface DraftPosition {
  companyId: string;
  name: string;
  ticker: string | null;
  assetType: AssetType | null;
  region: Region | null;
  sector: string | null;
  currency: string;
  liquidityBucket: LiquidityBucket;
  country: string;
  // Track what was auto-filled
  autoFilled: {
    assetType: boolean;
    region: boolean;
    sector: boolean;
  };
}

const ASSET_TYPE_MAP: Record<string, AssetType> = {
  equity: 'equity',
  stock: 'equity',
  bond: 'fixed_income',
  'fixed income': 'fixed_income',
  fixed_income: 'fixed_income',
  'real estate': 'real_estate',
  real_estate: 'real_estate',
  reit: 'real_estate',
  commodity: 'commodities',
  commodities: 'commodities',
  alternative: 'alternatives',
  alternatives: 'alternatives',
  crypto: 'crypto',
  cash: 'cash',
};

const REGION_MAP: Record<string, Region> = {
  us: 'north_america',
  usa: 'north_america',
  'united states': 'north_america',
  'north america': 'north_america',
  north_america: 'north_america',
  europe: 'europe',
  asia: 'asia_pacific',
  'asia pacific': 'asia_pacific',
  asia_pacific: 'asia_pacific',
  israel: 'middle_east',
  'middle east': 'middle_east',
  middle_east: 'middle_east',
  'latin america': 'latin_america',
  latin_america: 'latin_america',
  africa: 'africa',
  global: 'global',
};

const CURRENCY_MAP: Record<string, string> = {
  north_america: 'USD',
  europe: 'EUR',
  asia_pacific: 'JPY',
  middle_east: 'ILS',
  latin_america: 'USD',
  africa: 'USD',
  global: 'USD',
};

function mapAssetType(raw: string | null): AssetType | null {
  if (!raw) return null;
  return ASSET_TYPE_MAP[raw.toLowerCase()] || null;
}

function mapRegion(raw: string | null): Region | null {
  if (!raw) return null;
  return REGION_MAP[raw.toLowerCase()] || null;
}

function mapSector(raw: string | null): string | null {
  if (!raw) return null;
  const match = COMMON_SECTORS.find(s => s.toLowerCase() === raw.toLowerCase());
  return match || raw;
}

export function ImportFromAnalysisDialog({ onImport, existingNames, trigger }: ImportFromAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'review'>('select');
  const [companies, setCompanies] = useState<AnalysisCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<DraftPosition[]>([]);
  const { user } = useAuth();
  const { session, isContextSet } = useSession();

  const activeClientId = session.scope === 'client' ? session.clientId : null;

  useEffect(() => {
    if (!open || !user || !isContextSet) return;
    setLoading(true);
    
    let query = supabase
      .from('crm_companies')
      .select('id, company_name, ticker, sector, geography, asset_type, status')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (activeClientId) {
      query = query.eq('client_id', activeClientId);
    } else {
      query = query.is('client_id', null);
    }

    query.order('company_name').then(({ data, error }) => {
      if (!error && data) {
        setCompanies(data as AnalysisCompany[]);
      }
      setLoading(false);
    });
  }, [open, user, isContextSet, activeClientId]);

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(q) ||
      (c.ticker && c.ticker.toLowerCase().includes(q)) ||
      (c.sector && c.sector.toLowerCase().includes(q))
    );
  });

  const alreadyImported = new Set(existingNames.map(n => n.toLowerCase()));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const buildDrafts = () => {
    const selectedCompanies = companies.filter(c => selected.has(c.id));
    const newDrafts: DraftPosition[] = selectedCompanies.map(c => {
      const assetType = mapAssetType(c.asset_type);
      const region = mapRegion(c.geography);
      const sector = mapSector(c.sector);
      const inferredCurrency = region ? (CURRENCY_MAP[region] || 'USD') : 'USD';
      const inferredCountry = region ? (COUNTRIES_BY_REGION[region]?.[0] || '') : '';

      return {
        companyId: c.id,
        name: c.ticker || c.company_name,
        ticker: c.ticker,
        assetType,
        region,
        sector,
        currency: inferredCurrency,
        liquidityBucket: 'liquid' as LiquidityBucket,
        country: inferredCountry,
        autoFilled: {
          assetType: assetType !== null,
          region: region !== null,
          sector: sector !== null,
        },
      };
    });
    setDrafts(newDrafts);
  };

  const hasMissingFields = useMemo(() => {
    return drafts.some(d => !d.assetType || !d.region || !d.sector);
  }, [drafts]);

  const allFieldsComplete = useMemo(() => {
    return drafts.every(d => d.assetType && d.region && d.sector);
  }, [drafts]);

  const updateDraft = (companyId: string, field: keyof DraftPosition, value: any) => {
    setDrafts(prev => prev.map(d => {
      if (d.companyId !== companyId) return d;
      const updated = { ...d, [field]: value };
      // Auto-update currency and country when region changes
      if (field === 'region' && value) {
        updated.currency = CURRENCY_MAP[value as Region] || 'USD';
        updated.country = COUNTRIES_BY_REGION[value as Region]?.[0] || '';
      }
      return updated;
    }));
  };

  const handleProceedToReview = () => {
    buildDrafts();
    setStep('review');
  };

  const handleImport = () => {
    const positions = drafts.map(d => ({
      name: d.name,
      assetType: d.assetType || 'equity' as AssetType,
      allocation: 0,
      region: d.region || 'global' as Region,
      country: d.country,
      sector: d.sector || 'Other',
      industry: '',
      currency: d.currency,
      liquidityBucket: d.liquidityBucket,
      styleTags: [] as Position['styleTags'],
    }));

    onImport(positions);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelected(new Set());
    setSearch('');
    setStep('select');
    setDrafts([]);
    setOpen(false);
  };

  const missingCount = drafts.filter(d => !d.assetType || !d.region || !d.sector).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <Building2 size={14} />
            Import from Analysis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={16} />
            {step === 'select' ? 'Select from Analysis' : 'Review & Complete'}
            {step === 'review' && missingCount > 0 && (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px] gap-1">
                <AlertCircle size={10} />
                {missingCount} need details
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' ? (
          <>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ticker, or sector..."
                className="pl-9 h-9"
              />
            </div>

            <ScrollArea className="flex-1 min-h-0 h-[360px] border rounded-lg">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading companies...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {companies.length === 0 ? 'No companies in Analysis yet' : 'No matches found'}
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filtered.map(c => {
                    const isExisting = alreadyImported.has((c.ticker || c.company_name).toLowerCase());
                    const hasAssetType = !!mapAssetType(c.asset_type);
                    const hasRegion = !!mapRegion(c.geography);
                    const hasSector = !!c.sector;
                    const completeness = [hasAssetType, hasRegion, hasSector].filter(Boolean).length;

                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors ${isExisting ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          checked={selected.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                          disabled={isExisting}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{c.company_name}</span>
                            {c.ticker && (
                              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                {c.ticker}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.sector && <span className="text-[11px] text-muted-foreground">{c.sector}</span>}
                            {c.geography && <span className="text-[11px] text-muted-foreground">· {c.geography}</span>}
                            {c.asset_type && <span className="text-[11px] text-muted-foreground">· {c.asset_type}</span>}
                            {isExisting && <span className="text-[10px] text-primary">Already added</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {completeness === 3 ? (
                            <Badge variant="secondary" className="text-[10px] text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                              <Check size={10} className="mr-1" /> Complete
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] text-amber-400 bg-amber-500/10 border-amber-500/20">
                              {completeness}/3 fields
                            </Badge>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {selected.size} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetAndClose}>Cancel</Button>
                <Button size="sm" onClick={handleProceedToReview} disabled={selected.size === 0} className="gap-1.5">
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0 h-[420px]">
              <div className="space-y-4 pr-4">
                {drafts.map((draft) => {
                  const needsAssetType = !draft.assetType;
                  const needsRegion = !draft.region;
                  const needsSector = !draft.sector;
                  const isComplete = !needsAssetType && !needsRegion && !needsSector;

                  return (
                    <div key={draft.companyId} className={`border rounded-lg p-4 space-y-3 ${isComplete ? 'border-border/50' : 'border-amber-500/30 bg-amber-500/5'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{draft.name}</span>
                          {draft.ticker && draft.ticker !== draft.name && (
                            <Badge variant="outline" className="text-[10px] font-mono">{draft.ticker}</Badge>
                          )}
                        </div>
                        {isComplete ? (
                          <Badge variant="secondary" className="text-[10px] text-emerald-400 bg-emerald-500/10">
                            <Check size={10} className="mr-1" /> Ready
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-amber-400 bg-amber-500/10">
                            <AlertCircle size={10} className="mr-1" /> Needs details
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {/* Asset Type */}
                        <div className="space-y-1">
                          <Label className={`text-[11px] ${needsAssetType ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            Asset Type {needsAssetType && '*'}
                          </Label>
                          <Select
                            value={draft.assetType || ''}
                            onValueChange={(v) => updateDraft(draft.companyId, 'assetType', v as AssetType)}
                          >
                            <SelectTrigger className={`h-8 text-xs ${needsAssetType ? 'border-amber-500/50' : ''}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Region */}
                        <div className="space-y-1">
                          <Label className={`text-[11px] ${needsRegion ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            Region {needsRegion && '*'}
                          </Label>
                          <Select
                            value={draft.region || ''}
                            onValueChange={(v) => updateDraft(draft.companyId, 'region', v as Region)}
                          >
                            <SelectTrigger className={`h-8 text-xs ${needsRegion ? 'border-amber-500/50' : ''}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(REGION_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sector */}
                        <div className="space-y-1">
                          <Label className={`text-[11px] ${needsSector ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            Sector {needsSector && '*'}
                          </Label>
                          <Select
                            value={draft.sector || ''}
                            onValueChange={(v) => updateDraft(draft.companyId, 'sector', v)}
                          >
                            <SelectTrigger className={`h-8 text-xs ${needsSector ? 'border-amber-500/50' : ''}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_SECTORS.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Currency */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Currency</Label>
                          <Select
                            value={draft.currency}
                            onValueChange={(v) => updateDraft(draft.companyId, 'currency', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_CURRENCIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Liquidity */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Liquidity</Label>
                          <Select
                            value={draft.liquidityBucket}
                            onValueChange={(v) => updateDraft(draft.companyId, 'liquidityBucket', v as LiquidityBucket)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(LIQUIDITY_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={() => setStep('select')} className="gap-1.5">
                <ChevronLeft size={14} /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetAndClose}>Cancel</Button>
                <Button size="sm" onClick={handleImport} disabled={!allFieldsComplete} className="gap-1.5">
                  <Plus size={14} />
                  Import ({drafts.length})
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
