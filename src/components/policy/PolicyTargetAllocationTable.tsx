import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crosshair, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { usePolicyTargetHoldings, PolicyTargetHolding } from '@/hooks/usePolicyTargetHoldings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/context/SessionContext';

interface KnownAsset {
  ticker: string;
  name: string;
  source: 'holdings' | 'research';
}

function useKnownAssets(): KnownAsset[] {
  const { user } = useAuth();
  const { session, isContextSet } = useSession();
  const [assets, setAssets] = useState<KnownAsset[]>([]);
  const clientId = session.scope === 'client' ? session.clientId : null;

  useEffect(() => {
    if (!user?.id || !isContextSet) return;

    const fetchAssets = async () => {
      const seen = new Map<string, KnownAsset>();

      // Holdings snapshot
      let hQuery = supabase
        .from('holdings_snapshot')
        .select('ticker, asset_name')
        .eq('user_id', user.id);
      if (clientId) hQuery = hQuery.eq('client_id', clientId);
      else hQuery = hQuery.is('client_id', null);

      const { data: holdings } = await hQuery;
      holdings?.forEach(h => {
        if (h.ticker && !seen.has(h.ticker)) {
          seen.set(h.ticker, { ticker: h.ticker, name: h.asset_name || h.ticker, source: 'holdings' });
        }
      });

      // CRM companies with tickers
      let cQuery = supabase
        .from('crm_companies')
        .select('ticker, company_name')
        .eq('user_id', user.id)
        .not('ticker', 'is', null)
        .is('deleted_at', null);
      if (clientId) cQuery = cQuery.eq('client_id', clientId);
      else cQuery = cQuery.is('client_id', null);

      const { data: companies } = await cQuery;
      companies?.forEach(c => {
        if (c.ticker && !seen.has(c.ticker)) {
          seen.set(c.ticker, { ticker: c.ticker, name: c.company_name, source: 'research' });
        }
      });

      setAssets(Array.from(seen.values()).sort((a, b) => a.ticker.localeCompare(b.ticker)));
    };

    fetchAssets();
  }, [user?.id, isContextSet, clientId]);

  return assets;
}

export function PolicyTargetAllocationTable() {
  const { holdings, isLoading, addHolding, updateHolding, removeHolding } = usePolicyTargetHoldings();
  const knownAssets = useKnownAssets();
  const [mode, setMode] = useState<'select' | 'manual'>('select');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');

  const totalWeight = holdings.reduce((sum, h) => sum + h.target_weight, 0);

  // Filter out already-added tickers
  const availableAssets = knownAssets.filter(
    a => !holdings.some(h => h.ticker === a.ticker)
  );

  const handleAdd = () => {
    let ticker: string;
    let name: string;

    if (mode === 'select' && selectedTicker) {
      const asset = knownAssets.find(a => a.ticker === selectedTicker);
      if (!asset) return;
      ticker = asset.ticker;
      name = asset.name;
    } else if (mode === 'manual') {
      ticker = newTicker.trim().toUpperCase();
      name = newName.trim() || ticker;
      if (!ticker) return;
    } else {
      return;
    }

    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0 || weight > 100) return;

    addHolding(ticker, name, weight);
    setSelectedTicker('');
    setNewTicker('');
    setNewName('');
    setNewWeight('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const canAdd = mode === 'select'
    ? !!selectedTicker && !!newWeight
    : !!newTicker.trim() && !!newWeight;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
              <span className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]">Manual Target Allocation</span>
            </CardTitle>
            <CardDescription>
              Define your target portfolio weights per security — ticker and % of total portfolio
            </CardDescription>
          </div>
          <Badge
            variant={Math.abs(totalWeight - 100) < 0.5 ? 'default' : 'secondary'}
            className="font-mono text-sm px-3 py-1"
          >
            {totalWeight.toFixed(1)}% / 100%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('select')}
            className="text-xs gap-1.5"
          >
            <Search className="h-3 w-3" />
            From Portfolio
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('manual')}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Manual Entry
          </Button>
          {mode === 'select' && availableAssets.length === 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">No assets found — use manual entry</span>
          )}
        </div>

        {/* Add row */}
        {mode === 'select' ? (
          <div className="grid grid-cols-[1fr_100px_40px] gap-2 items-end">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block">Select Security</label>
              <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Choose from portfolio..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map(a => (
                    <SelectItem key={a.ticker} value={a.ticker} className="font-mono">
                      <span className="font-semibold text-primary">{a.ticker}</span>
                      <span className="text-muted-foreground ml-2">— {a.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block">Weight %</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="10"
                className="font-mono"
              />
            </div>
            <Button size="icon" onClick={handleAdd} disabled={!canAdd} className="gradient-gold">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_1.5fr_100px_40px] gap-2 items-end">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block">Ticker</label>
              <Input
                value={newTicker}
                onChange={e => setNewTicker(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="AAPL"
                className="font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block">Name (optional)</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Apple Inc."
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block">Weight %</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="10"
                className="font-mono"
              />
            </div>
            <Button size="icon" onClick={handleAdd} disabled={!canAdd} className="gradient-gold">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Table */}
        {holdings.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-mono text-[10px] uppercase">Ticker</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase">Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-right">Weight %</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map(h => (
                  <HoldingRow key={h.id} holding={h} onUpdate={updateHolding} onRemove={removeHolding} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Crosshair className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No target holdings defined yet. Add a security above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HoldingRow({
  holding,
  onUpdate,
  onRemove,
}: {
  holding: PolicyTargetHolding;
  onUpdate: (id: string, u: Partial<Pick<PolicyTargetHolding, 'ticker' | 'name' | 'target_weight'>>) => void;
  onRemove: (id: string) => void;
}) {
  const [editWeight, setEditWeight] = useState(String(holding.target_weight));

  const commitWeight = () => {
    const val = parseFloat(editWeight);
    if (!isNaN(val) && val >= 0 && val <= 100 && val !== holding.target_weight) {
      onUpdate(holding.id, { target_weight: val });
    } else {
      setEditWeight(String(holding.target_weight));
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono font-semibold text-primary">{holding.ticker}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{holding.name || '—'}</TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={editWeight}
          onChange={e => setEditWeight(e.target.value)}
          onBlur={commitWeight}
          onKeyDown={e => e.key === 'Enter' && commitWeight()}
          className="w-20 font-mono text-right ml-auto h-8"
        />
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onRemove(holding.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
