import { useState } from 'react';
import { useResearchWatchlist } from '@/hooks/useResearchWatchlist';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ASSET_CLASSES = [
  { value: 'equity', label: 'Equity' },
  { value: 'etf', label: 'ETF' },
  { value: 'fx', label: 'FX' },
  { value: 'commodity', label: 'Commodity' },
  { value: 'index', label: 'Index' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'bond', label: 'Bond' }
];

export function WatchlistSettings() {
  const { items, isLoading, addSymbol, bulkAddSymbols, removeSymbol, clearAll } = useResearchWatchlist();
  
  const [newSymbol, setNewSymbol] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAssetClass, setNewAssetClass] = useState('equity');
  const [isAdding, setIsAdding] = useState(false);
  
  const [bulkText, setBulkText] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  const handleAddSymbol = async () => {
    if (!newSymbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }

    setIsAdding(true);
    const success = await addSymbol(newSymbol, newDisplayName, newAssetClass);
    setIsAdding(false);

    if (success) {
      toast.success(`Added ${newSymbol.toUpperCase()}`);
      setNewSymbol('');
      setNewDisplayName('');
      setNewAssetClass('equity');
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) {
      toast.error('Please enter symbols to add');
      return;
    }

    setIsBulkAdding(true);
    const result = await bulkAddSymbols(bulkText);
    setIsBulkAdding(false);

    if (result.added > 0) {
      toast.success(`Added ${result.added} symbols${result.skipped > 0 ? `, ${result.skipped} skipped (duplicates)` : ''}`);
      setBulkText('');
    } else if (result.skipped > 0) {
      toast.info(`All ${result.skipped} symbols already exist in watchlist`);
    }
  };

  const handleRemove = async (id: string, symbol: string) => {
    const success = await removeSymbol(id);
    if (success) {
      toast.success(`Removed ${symbol}`);
    }
  };

  const handleClearAll = async () => {
    const success = await clearAll();
    if (success) {
      toast.success('Watchlist cleared');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Research Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Research Watchlist
        </CardTitle>
        <CardDescription>
          Manage symbols for Research page analysis. Paste your TradingView watchlist here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Single Symbol */}
        <div className="space-y-3 p-3 bg-secondary/30 rounded-sm border border-border/30">
          <Label className="text-xs font-mono text-muted-foreground">Add Symbol</Label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input
              placeholder="Symbol (e.g., AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
              className="font-mono"
            />
            <Input
              placeholder="Display name (optional)"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="font-mono"
            />
            <Select value={newAssetClass} onValueChange={setNewAssetClass}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CLASSES.map(ac => (
                  <SelectItem key={ac.value} value={ac.value}>{ac.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddSymbol} disabled={isAdding}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>
        </div>

        {/* Bulk Import */}
        <div className="space-y-3 p-3 bg-secondary/30 rounded-sm border border-border/30">
          <Label className="text-xs font-mono text-muted-foreground">Bulk Import (paste from TradingView)</Label>
          <Textarea
            placeholder="Paste symbols separated by commas, spaces, or newlines (e.g., AAPL, MSFT, SPY, QQQ)"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="font-mono min-h-[80px]"
          />
          <Button onClick={handleBulkAdd} disabled={isBulkAdding} variant="outline">
            {isBulkAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Import Symbols
          </Button>
        </div>

        {/* Current Watchlist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono text-muted-foreground">
              Current Watchlist ({items.length} symbols)
            </Label>
            {items.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 text-xs">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Watchlist?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {items.length} symbols from your Research Watchlist.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No symbols in watchlist yet. Add symbols above.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-card border border-border rounded-sm group hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-xs text-foreground font-medium truncate">
                      {item.symbol}
                    </span>
                    {item.display_name && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {item.display_name}
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground/60 uppercase">
                      {item.asset_class}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(item.id, item.symbol)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
