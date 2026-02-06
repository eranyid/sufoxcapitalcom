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

function useCurrentWeights(): Map<string, number> {
  const { user } = useAuth();
  const { session, isContextSet } = useSession();
  const [weights, setWeights] = useState<Map<string, number>>(new Map());
  const clientId = session.scope === 'client' ? session.clientId : null;

  useEffect(() => {
    if (!user?.id || !isContextSet) return;

    const fetchWeights = async () => {
      // Try holdings_snapshot first
      let hQuery = supabase
        .from('holdings_snapshot')
        .select('ticker, total_cost_base')
        .eq('user_id', user.id)
        .gt('quantity', 0);
      if (clientId) hQuery = hQuery.eq('client_id', clientId);
      else hQuery = hQuery.is('client_id', null);

      const { data: snapshots } = await hQuery;

      if (snapshots && snapshots.length > 0) {
        const totalValue = snapshots.reduce((sum, h) => sum + (h.total_cost_base || 0), 0);
        const map = new Map<string, number>();
        if (totalValue > 0) {
          snapshots.forEach(h => {
            if (h.ticker) {
              const pct = ((h.total_cost_base || 0) / totalValue) * 100;
              map.set(h.ticker, Math.round(pct * 10) / 10);
            }
          });
        }
        setWeights(map);
        return;
      }

      // Fallback: calculate from transactions
      let tQuery = supabase
        .from('transactions')
        .select('ticker, transaction_type, cost_base, quantity')
        .eq('user_id', user.id)
        .is('deleted_at', null);
      if (clientId) tQuery = tQuery.eq('client_id', clientId);
      else tQuery = tQuery.is('client_id', null);

      const { data: txns } = await tQuery;
      if (!txns || txns.length === 0) { setWeights(new Map()); return; }

      // Aggregate net cost_base per ticker
      const tickerCost = new Map<string, number>();
      txns.forEach(t => {
        if (!t.ticker) return;
        const prev = tickerCost.get(t.ticker) || 0;
        const sign = t.transaction_type === 'sell' ? -1 : 1;
        tickerCost.set(t.ticker, prev + sign * (t.cost_base || 0));
      });

      // Remove tickers with zero or negative cost (fully sold)
      for (const [k, v] of tickerCost) {
        if (v <= 0) tickerCost.delete(k);
      }

      const totalValue = Array.from(tickerCost.values()).reduce((a, b) => a + b, 0);
      const map = new Map<string, number>();
      if (totalValue > 0) {
        for (const [ticker, cost] of tickerCost) {
          map.set(ticker, Math.round((cost / totalValue) * 1000) / 10);
        }
      }
      setWeights(map);
    };

    fetchWeights();
  }, [user?.id, isContextSet, clientId]);

  return weights;
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
  const currentWeights = useCurrentWeights();
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
    <Card className="border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.08)]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wider">
              <Crosshair className="h-5 w-5 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
              <span className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]">Manual Target Allocation</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Define your target portfolio weights per security — ticker and % of total portfolio
            </CardDescription>
          </div>
          <Badge
            variant={Math.abs(totalWeight - 100) < 0.5 ? 'default' : 'secondary'}
            className={`font-mono text-sm px-4 py-1.5 ${
              Math.abs(totalWeight - 100) < 0.5
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : totalWeight > 100
                  ? 'bg-destructive/15 text-destructive border border-destructive/30'
                  : 'border border-border'
            }`}
          >
            {totalWeight.toFixed(1)}% / 100%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
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
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block tracking-wider">Select Security</label>
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
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block tracking-wider">Weight %</label>
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
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block tracking-wider">Ticker</label>
              <Input
                value={newTicker}
                onChange={e => setNewTicker(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="AAPL"
                className="font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block tracking-wider">Name (optional)</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Apple Inc."
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-mono mb-1 block tracking-wider">Weight %</label>
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

        {/* Allocation progress bar */}
        {holdings.length > 0 && (
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  Math.abs(totalWeight - 100) < 0.5
                    ? 'bg-emerald-500'
                    : totalWeight > 100
                      ? 'bg-destructive'
                      : 'bg-primary'
                }`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{holdings.length} securities</span>
              <span>{(100 - totalWeight).toFixed(1)}% remaining</span>
            </div>
          </div>
        )}

        {/* Table */}
        {holdings.length > 0 ? (
          <div className="border border-border/60 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 h-9">Ticker</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 h-9">Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 h-9 text-right">Current %</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 h-9 text-right">Target %</TableHead>
                  <TableHead className="w-10 h-9" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h, i) => (
                  <HoldingRow key={h.id} holding={h} index={i} currentWeight={currentWeights.get(h.ticker)} onUpdate={updateHolding} onRemove={removeHolding} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/40 rounded-lg">
            <Crosshair className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No target holdings defined yet. Add a security above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HoldingRow({
  holding,
  index,
  currentWeight,
  onUpdate,
  onRemove,
}: {
  holding: PolicyTargetHolding;
  index: number;
  currentWeight: number | undefined;
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

  const diff = currentWeight != null ? currentWeight - holding.target_weight : null;

  return (
    <TableRow className={index % 2 === 0 ? 'bg-transparent' : 'bg-muted/5'}>
      <TableCell className="font-mono font-semibold text-primary py-3">{holding.ticker}</TableCell>
      <TableCell className="text-sm text-muted-foreground py-3">{holding.name || '—'}</TableCell>
      <TableCell className="text-right py-3">
        <div className="flex items-center justify-end gap-1">
          {currentWeight != null ? (
            <>
              <span className="font-mono text-sm text-foreground">{currentWeight.toFixed(1)}</span>
              <span className="font-mono text-sm text-muted-foreground">%</span>
              {diff != null && Math.abs(diff) >= 0.5 && (
                <span className={`font-mono text-[10px] ml-1 ${diff > 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </span>
              )}
            </>
          ) : (
            <span className="font-mono text-xs text-muted-foreground/50">—</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right py-3">
        <div className="flex items-center justify-end gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={editWeight}
            onChange={e => setEditWeight(e.target.value)}
            onBlur={commitWeight}
            onKeyDown={e => e.key === 'Enter' && commitWeight()}
            className="w-20 font-mono text-right h-8 text-primary font-semibold"
          />
          <span className="text-primary font-mono font-semibold text-sm">%</span>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onRemove(holding.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
