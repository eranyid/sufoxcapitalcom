import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Search, Building2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/context/SessionContext';
import {
  Position,
  AssetType,
  Region,
  LiquidityBucket,
  StyleTag,
  ASSET_TYPE_LABELS,
  REGION_LABELS,
  LIQUIDITY_LABELS,
  STYLE_TAG_LABELS,
  COMMON_SECTORS,
  COMMON_CURRENCIES,
  COUNTRIES_BY_REGION,
} from '@/types/allocationBuilder';

interface AddPositionDialogProps {
  onAdd: (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingAllocation: number;
  existingNames?: string[];
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

const ASSET_TYPE_MAP: Record<string, AssetType> = {
  equity: 'equity', stock: 'equity',
  bond: 'fixed_income', 'fixed income': 'fixed_income', fixed_income: 'fixed_income',
  'real estate': 'real_estate', real_estate: 'real_estate', reit: 'real_estate',
  commodity: 'commodities', commodities: 'commodities',
  alternative: 'alternatives', alternatives: 'alternatives',
  crypto: 'crypto', cash: 'cash', mutual_fund: 'equity',
};

const REGION_MAP: Record<string, Region> = {
  us: 'north_america', usa: 'north_america', 'united states': 'north_america',
  'north america': 'north_america', north_america: 'north_america',
  europe: 'europe', asia: 'asia_pacific', 'asia pacific': 'asia_pacific', asia_pacific: 'asia_pacific',
  israel: 'middle_east', 'middle east': 'middle_east', middle_east: 'middle_east',
  'latin america': 'latin_america', latin_america: 'latin_america',
  africa: 'africa', global: 'global',
};

const CURRENCY_MAP: Record<string, string> = {
  north_america: 'USD', europe: 'EUR', asia_pacific: 'JPY',
  middle_east: 'ILS', latin_america: 'USD', africa: 'USD', global: 'USD',
};

function mapAssetType(raw: string | null): AssetType | null {
  if (!raw) return null;
  return ASSET_TYPE_MAP[raw.toLowerCase()] || null;
}

function mapRegion(raw: string | null): Region | null {
  if (!raw) return null;
  return REGION_MAP[raw.toLowerCase()] || null;
}

export function AddPositionDialog({ onAdd, existingAllocation, existingNames = [] }: AddPositionDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<string>('manual');

  // Manual form state
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('equity');
  const [allocation, setAllocation] = useState('');
  const [region, setRegion] = useState<Region>('north_america');
  const [country, setCountry] = useState('United States');
  const [sector, setSector] = useState('Technology');
  const [industry, setIndustry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [liquidityBucket, setLiquidityBucket] = useState<LiquidityBucket>('highly_liquid');
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [notes, setNotes] = useState('');

  // Analysis import state
  const [companies, setCompanies] = useState<AnalysisCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<AnalysisCompany | null>(null);
  // Review fields for selected company
  const [reviewAssetType, setReviewAssetType] = useState<AssetType>('equity');
  const [reviewRegion, setReviewRegion] = useState<Region>('north_america');
  const [reviewSector, setReviewSector] = useState('Technology');
  const [reviewCurrency, setReviewCurrency] = useState('USD');
  const [reviewCountry, setReviewCountry] = useState('');
  const [reviewLiquidity, setReviewLiquidity] = useState<LiquidityBucket>('highly_liquid');
  const [reviewAllocation, setReviewAllocation] = useState('');

  const { user } = useAuth();
  const { session, isContextSet } = useSession();
  const activeClientId = session.scope === 'client' ? session.clientId : null;

  const remainingAllocation = 100 - existingAllocation;
  const alreadyImported = new Set(existingNames.map(n => n.toLowerCase()));

  // Fetch companies when dialog opens on analysis tab
  useEffect(() => {
    if (!open || !user || !isContextSet) return;
    setLoadingCompanies(true);

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
      if (!error && data) setCompanies(data as AnalysisCompany[]);
      setLoadingCompanies(false);
    });
  }, [open, user, isContextSet, activeClientId]);

  const filtered = companies.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(q) ||
      (c.ticker && c.ticker.toLowerCase().includes(q)) ||
      (c.sector && c.sector.toLowerCase().includes(q))
    );
  });

  const selectCompany = (c: AnalysisCompany) => {
    setSelectedCompany(c);
    const at = mapAssetType(c.asset_type) || 'equity';
    const rg = mapRegion(c.geography) || 'north_america';
    const sc = c.sector ? (COMMON_SECTORS.find(s => s.toLowerCase() === c.sector!.toLowerCase()) || c.sector) : 'Other';
    setReviewAssetType(at);
    setReviewRegion(rg);
    setReviewSector(sc);
    setReviewCurrency(CURRENCY_MAP[rg] || 'USD');
    setReviewCountry(COUNTRIES_BY_REGION[rg]?.[0] || '');
    setReviewLiquidity('highly_liquid');
    setReviewAllocation('');
  };

  const handleSubmitManual = () => {
    if (!name.trim() || !allocation) return;
    onAdd({
      name: name.trim(), assetType,
      allocation: parseFloat(allocation),
      region, country, sector, industry, currency,
      liquidityBucket, styleTags,
      notes: notes.trim() || undefined,
    });
    resetAndClose();
  };

  const handleSubmitFromAnalysis = () => {
    if (!selectedCompany || !reviewAllocation) return;
    onAdd({
      name: selectedCompany.ticker || selectedCompany.company_name,
      assetType: reviewAssetType,
      allocation: parseFloat(reviewAllocation),
      region: reviewRegion,
      country: reviewCountry,
      sector: reviewSector,
      industry: '',
      currency: reviewCurrency,
      liquidityBucket: reviewLiquidity,
      styleTags: [],
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setName(''); setAllocation(''); setIndustry(''); setNotes(''); setStyleTags([]);
    setSelectedCompany(null); setSearchQuery(''); setReviewAllocation('');
    setTab('manual');
    setOpen(false);
  };

  const toggleStyleTag = (tag: StyleTag) => {
    setStyleTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const availableCountries = COUNTRIES_BY_REGION[region] || [];
  const reviewCountries = COUNTRIES_BY_REGION[reviewRegion] || [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={14} />
          Add Position
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Position
            <Badge variant="outline" className="font-mono text-xs">
              {remainingAllocation.toFixed(1)}% remaining
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-1.5 text-xs">
              <Plus size={12} /> Manual
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1.5 text-xs">
              <Building2 size={12} /> From Analysis
            </TabsTrigger>
          </TabsList>

          {/* Manual Tab */}
          <TabsContent value="manual" className="flex-1 overflow-y-auto mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Position Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., S&P 500 ETF" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocation">Allocation % *</Label>
                  <Input id="allocation" type="number" value={allocation} onChange={(e) => setAllocation(e.target.value)} placeholder="e.g., 10" min={0} max={100} step={0.1} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMMON_SECTORS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={region} onValueChange={(v) => { setRegion(v as Region); setCountry(COUNTRIES_BY_REGION[v as Region]?.[0] || ''); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(REGION_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{availableCountries.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMMON_CURRENCIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Liquidity</Label>
                  <Select value={liquidityBucket} onValueChange={(v) => setLiquidityBucket(v as LiquidityBucket)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(LIQUIDITY_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry (Optional)</Label>
                <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Software, Semiconductors" />
              </div>

              <div className="space-y-2">
                <Label>Style Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STYLE_TAG_LABELS).map(([key, label]) => (
                    <Badge key={key} variant={styleTags.includes(key as StyleTag) ? 'default' : 'outline'} className="cursor-pointer transition-colors" onClick={() => toggleStyleTag(key as StyleTag)}>
                      {styleTags.includes(key as StyleTag) && <X size={10} className="mr-1" />}
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Investment rationale or additional details..." rows={2} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
              <Button onClick={handleSubmitManual} disabled={!name.trim() || !allocation}>Add Position</Button>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="flex-1 flex flex-col min-h-0 mt-4">
            {!selectedCompany ? (
              <>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, ticker, or sector..." className="pl-9 h-9" />
                </div>
                <ScrollArea className="flex-1 min-h-0 h-[400px] border rounded-lg">
                  {loadingCompanies ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
                  ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      {companies.length === 0 ? 'No companies in Analysis yet' : 'No matches'}
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {filtered.map(c => {
                        const displayName = (c.ticker || c.company_name).toLowerCase();
                        const isExisting = alreadyImported.has(displayName);
                        return (
                          <div
                            key={c.id}
                            onClick={() => !isExisting && selectCompany(c)}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors ${isExisting ? 'opacity-40 pointer-events-none' : ''}`}
                          >
                            <Building2 size={14} className="text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{c.company_name}</span>
                                {c.ticker && <Badge variant="outline" className="text-[10px] font-mono shrink-0">{c.ticker}</Badge>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {c.sector && <span className="text-[11px] text-muted-foreground">{c.sector}</span>}
                                {c.geography && <span className="text-[11px] text-muted-foreground">· {c.geography}</span>}
                                {isExisting && <span className="text-[10px] text-primary">Already added</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex justify-end pt-3">
                  <Button variant="outline" size="sm" onClick={resetAndClose}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div className="border rounded-lg p-3 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-primary" />
                    <span className="text-sm font-semibold">{selectedCompany.company_name}</span>
                    {selectedCompany.ticker && <Badge variant="outline" className="text-[10px] font-mono">{selectedCompany.ticker}</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)} className="text-xs h-7">
                    Change
                  </Button>
                </div>

                <ScrollArea className="flex-1 min-h-0 h-[300px]">
                  <div className="grid gap-3 pr-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Allocation % *</Label>
                      <Input type="number" value={reviewAllocation} onChange={(e) => setReviewAllocation(e.target.value)} placeholder="e.g., 10" min={0} max={100} step={0.1} className="h-8" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Asset Type</Label>
                        <Select value={reviewAssetType} onValueChange={(v) => setReviewAssetType(v as AssetType)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(ASSET_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Region</Label>
                        <Select value={reviewRegion} onValueChange={(v) => { setReviewRegion(v as Region); setReviewCurrency(CURRENCY_MAP[v] || 'USD'); setReviewCountry(COUNTRIES_BY_REGION[v as Region]?.[0] || ''); }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(REGION_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sector</Label>
                        <Select value={reviewSector} onValueChange={setReviewSector}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{COMMON_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Currency</Label>
                        <Select value={reviewCurrency} onValueChange={setReviewCurrency}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{COMMON_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Liquidity</Label>
                      <Select value={reviewLiquidity} onValueChange={(v) => setReviewLiquidity(v as LiquidityBucket)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(LIQUIDITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                  <Button variant="outline" size="sm" onClick={resetAndClose}>Cancel</Button>
                  <Button size="sm" onClick={handleSubmitFromAnalysis} disabled={!reviewAllocation} className="gap-1.5">
                    <Plus size={14} /> Add Position
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
