import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Building2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/context/SessionContext';
import type { Position, AssetType, Region } from '@/types/allocationBuilder';

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

const ASSET_TYPE_MAP: Record<string, AssetType> = {
  equity: 'equity',
  stock: 'equity',
  bond: 'fixed_income',
  'fixed income': 'fixed_income',
  'real estate': 'real_estate',
  reit: 'real_estate',
  commodity: 'commodities',
  alternative: 'alternatives',
  crypto: 'crypto',
  cash: 'cash',
};

const REGION_MAP: Record<string, Region> = {
  us: 'north_america',
  usa: 'north_america',
  'united states': 'north_america',
  'north america': 'north_america',
  europe: 'europe',
  asia: 'asia_pacific',
  'asia pacific': 'asia_pacific',
  israel: 'middle_east',
  'middle east': 'middle_east',
  'latin america': 'latin_america',
  africa: 'africa',
  global: 'global',
};

function mapAssetType(raw: string | null): AssetType {
  if (!raw) return 'equity';
  return ASSET_TYPE_MAP[raw.toLowerCase()] || 'equity';
}

function mapRegion(raw: string | null): Region {
  if (!raw) return 'global';
  return REGION_MAP[raw.toLowerCase()] || 'global';
}

export function ImportFromAnalysisDialog({ onImport, existingNames, trigger }: ImportFromAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState<AnalysisCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const handleImport = () => {
    const toImport = companies
      .filter(c => selected.has(c.id))
      .map(c => ({
        name: c.ticker || c.company_name,
        assetType: mapAssetType(c.asset_type),
        allocation: 0,
        region: mapRegion(c.geography),
        country: c.geography || '',
        sector: c.sector || 'Other',
        industry: '',
        currency: 'USD',
        liquidityBucket: 'liquid' as const,
        styleTags: [] as Position['styleTags'],
      }));

    onImport(toImport);
    setSelected(new Set());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelected(new Set()); setSearch(''); } }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <Building2 size={14} />
            Import from Analysis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={16} />
            Import from Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ticker, or sector..."
            className="pl-9 h-9"
          />
        </div>

        <ScrollArea className="h-[320px] border rounded-lg">
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
                        {isExisting && <span className="text-[10px] text-primary">Already added</span>}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{c.status}</Badge>
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
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleImport} disabled={selected.size === 0} className="gap-1.5">
              <Plus size={14} />
              Import ({selected.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
