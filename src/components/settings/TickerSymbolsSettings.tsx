import { useState } from 'react';
import { useTickerSymbols, TickerSymbol } from '@/hooks/useTickerSymbols';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['FX', 'Index', 'Crypto', 'Commodities', 'Stocks', 'Other'];

interface SymbolFormData {
  label: string;
  tv_symbol: string;
  category: string;
  enabled: boolean;
}

export function TickerSymbolsSettings() {
  const { symbols, isLoading, addSymbol, updateSymbol, deleteSymbol, reorderSymbols } = useTickerSymbols();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<TickerSymbol | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SymbolFormData>({
    label: '',
    tv_symbol: '',
    category: 'Index',
    enabled: true,
  });

  const resetForm = () => {
    setFormData({
      label: '',
      tv_symbol: '',
      category: 'Index',
      enabled: true,
    });
  };

  const handleAdd = async () => {
    if (!formData.label.trim() || !formData.tv_symbol.trim()) {
      toast.error('Label and TradingView Symbol are required');
      return;
    }

    setIsSaving(true);
    const maxOrder = symbols.length > 0 ? Math.max(...symbols.map(s => s.order_index)) : -1;
    
    const result = await addSymbol({
      ...formData,
      order_index: maxOrder + 1,
    });

    setIsSaving(false);
    
    if (result) {
      toast.success('Symbol added');
      setIsAddOpen(false);
      resetForm();
    } else {
      toast.error('Failed to add symbol');
    }
  };

  const handleEdit = async () => {
    if (!editingSymbol) return;
    if (!formData.label.trim() || !formData.tv_symbol.trim()) {
      toast.error('Label and TradingView Symbol are required');
      return;
    }

    setIsSaving(true);
    const success = await updateSymbol(editingSymbol.id, formData);
    setIsSaving(false);

    if (success) {
      toast.success('Symbol updated');
      setEditingSymbol(null);
      resetForm();
    } else {
      toast.error('Failed to update symbol');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSymbol(id);
    if (success) {
      toast.success('Symbol deleted');
    } else {
      toast.error('Failed to delete symbol');
    }
  };

  const handleToggleEnabled = async (symbol: TickerSymbol) => {
    await updateSymbol(symbol.id, { enabled: !symbol.enabled });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSymbols = [...symbols];
    [newSymbols[index - 1], newSymbols[index]] = [newSymbols[index], newSymbols[index - 1]];
    await reorderSymbols(newSymbols);
  };

  const handleMoveDown = async (index: number) => {
    if (index === symbols.length - 1) return;
    const newSymbols = [...symbols];
    [newSymbols[index], newSymbols[index + 1]] = [newSymbols[index + 1], newSymbols[index]];
    await reorderSymbols(newSymbols);
  };

  const openEditDialog = (symbol: TickerSymbol) => {
    setEditingSymbol(symbol);
    setFormData({
      label: symbol.label,
      tv_symbol: symbol.tv_symbol,
      category: symbol.category,
      enabled: symbol.enabled,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Market Ticker Settings
        </CardTitle>
        <CardDescription>
          Configure the symbols displayed in the TradingView ticker bar at the top of the app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Symbol Button */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Add Symbol
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ticker Symbol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label (Display Name)</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., S&P 500"
                />
              </div>
              <div className="space-y-2">
                <Label>TradingView Symbol</Label>
                <Input
                  value={formData.tv_symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, tv_symbol: e.target.value }))}
                  placeholder="e.g., SP:SPX"
                />
                <p className="text-xs text-muted-foreground">
                  Find symbols at{' '}
                  <a href="https://www.tradingview.com/symbols/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    tradingview.com/symbols
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Symbol
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Symbol Dialog */}
        <Dialog open={!!editingSymbol} onOpenChange={(open) => !open && setEditingSymbol(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Ticker Symbol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label (Display Name)</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., S&P 500"
                />
              </div>
              <div className="space-y-2">
                <Label>TradingView Symbol</Label>
                <Input
                  value={formData.tv_symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, tv_symbol: e.target.value }))}
                  placeholder="e.g., SP:SPX"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSymbol(null)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Symbols Table */}
        {symbols.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No ticker symbols configured.</p>
            <p className="text-sm">Add symbols to display in the market ticker.</p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">Order</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="hidden sm:table-cell">TradingView Symbol</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="w-[80px] text-center">Enabled</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {symbols.map((symbol, index) => (
                  <TableRow key={symbol.id} className={!symbol.enabled ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === symbols.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{symbol.label}</TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
                      {symbol.tv_symbol}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="px-2 py-1 text-xs rounded bg-muted">{symbol.category}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={symbol.enabled}
                        onCheckedChange={() => handleToggleEnabled(symbol)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(symbol)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Symbol?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove "{symbol.label}" from the market ticker. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(symbol.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Enabled symbols will appear in the market ticker bar at the top of all pages. Changes take effect immediately.
        </p>
      </CardContent>
    </Card>
  );
}
