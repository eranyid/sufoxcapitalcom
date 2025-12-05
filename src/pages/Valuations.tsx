import { useState, useRef, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { MonthlyValuation } from '@/types/investment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportToCSV, importValuationsFromCSV } from '@/lib/storage';
import { Plus, Upload, Download, Trash2, Calendar, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditFormState {
  ticker: string;
  month: string;
  pricePerUnit: string;
  fxRate: string;
}

const emptyEditForm: EditFormState = { ticker: '', month: '', pricePerUnit: '', fxRate: '' };

export default function Valuations() {
  const { transactions, valuations, addValuation, updateValuation, deleteValuation, importValuations } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState<MonthlyValuation | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique assets from transactions
  const uniqueAssets = useMemo(() => {
    const assetMap = new Map<string, { ticker: string; name: string }>();
    transactions.forEach(tx => {
      if (!assetMap.has(tx.ticker)) {
        assetMap.set(tx.ticker, { ticker: tx.ticker, name: tx.assetName });
      }
    });
    return Array.from(assetMap.values());
  }, [transactions]);

  const [form, setForm] = useState({
    ticker: '',
    month: '',
    pricePerUnit: '',
    fxRate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = uniqueAssets.find(a => a.ticker === form.ticker);
    await addValuation({
      assetId: form.ticker,
      ticker: form.ticker,
      assetName: asset?.name || form.ticker,
      month: form.month,
      pricePerUnit: parseFloat(form.pricePerUnit),
      fxRate: form.fxRate ? parseFloat(form.fxRate) : undefined
    });
    setIsOpen(false);
    setForm({ ticker: '', month: '', pricePerUnit: '', fxRate: '' });
    toast.success('Valuation added successfully');
  };

  const handleEditOpen = (val: MonthlyValuation) => {
    setEditingValuation(val);
    setEditForm({
      ticker: val.ticker,
      month: val.month,
      pricePerUnit: val.pricePerUnit.toString(),
      fxRate: val.fxRate?.toString() || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingValuation) return;
    
    await updateValuation(editingValuation.id, {
      pricePerUnit: parseFloat(editForm.pricePerUnit),
      fxRate: editForm.fxRate ? parseFloat(editForm.fxRate) : undefined
    });
    setIsEditOpen(false);
    setEditingValuation(null);
    setEditForm(emptyEditForm);
    toast.success('Valuation updated successfully');
  };

  const handleExport = () => {
    exportToCSV(valuations, `sufox_valuations_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Valuations exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csv = event.target?.result as string;
        const imported = importValuationsFromCSV(csv);
        await importValuations(imported);
        toast.success(`Imported ${imported.length} valuations`);
      };
      reader.readAsText(file);
    }
  };

  // Group valuations by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, MonthlyValuation[]> = {};
    valuations.forEach(v => {
      if (!groups[v.month]) groups[v.month] = [];
      groups[v.month].push(v);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [valuations]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(value);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Monthly Valuations</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">Record monthly NAV/prices for each asset</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".csv"
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={valuations.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-primary-foreground" disabled={uniqueAssets.length === 0}>
                <Plus className="h-4 w-4 mr-2" /> Add Valuation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Monthly Valuation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Select value={form.ticker} onValueChange={(v) => setForm({ ...form, ticker: v })}>
                    <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                    <SelectContent>
                      {uniqueAssets.map(a => (
                        <SelectItem key={a.ticker} value={a.ticker}>
                          {a.ticker} - {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Input 
                    type="month"
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price per Unit / NAV</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={form.pricePerUnit}
                      onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>FX Rate (optional)</Label>
                    <Input 
                      type="number"
                      step="0.0001"
                      value={form.fxRate}
                      onChange={(e) => setForm({ ...form, fxRate: e.target.value })}
                      placeholder="1.0000"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground">
                  Add Valuation
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Add Panel */}
      {uniqueAssets.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Quick Add for Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickAddForm assets={uniqueAssets} onAdd={addValuation} />
          </CardContent>
        </Card>
      )}

      {/* Valuations by Month */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Valuation History</CardTitle>
        </CardHeader>
        <CardContent>
          {valuations.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Valuations Yet</h3>
              <p className="text-muted-foreground">
                {uniqueAssets.length === 0 
                  ? 'Add transactions first, then record monthly valuations.' 
                  : 'Add your first monthly valuation.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedByMonth.map(([month, vals]) => (
                <div key={month} className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}
                  >
                    <span className="font-medium">{month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{vals.length} assets</span>
                      {expandedMonth === month ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {expandedMonth === month && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticker</TableHead>
                          <TableHead>Asset Name</TableHead>
                          <TableHead className="text-right">Price/NAV</TableHead>
                          <TableHead className="text-right">FX Rate</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vals.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className="font-medium text-primary">{v.ticker}</TableCell>
                            <TableCell>{v.assetName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(v.pricePerUnit)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {v.fxRate?.toFixed(4) || '1.0000'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditOpen(v)}>
                                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Valuation</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the {v.month} valuation for {v.ticker}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={async () => {
                                          await deleteValuation(v.id);
                                          toast.success('Valuation deleted');
                                        }}
                                      >
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
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Valuation Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingValuation(null);
          setEditForm(emptyEditForm);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Valuation</DialogTitle>
          </DialogHeader>
          {editingValuation && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">{editingValuation.ticker}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{editingValuation.assetName}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Month: {editingValuation.month}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price per Unit / NAV</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={editForm.pricePerUnit}
                    onChange={(e) => setEditForm({ ...editForm, pricePerUnit: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>FX Rate (optional)</Label>
                  <Input 
                    type="number"
                    step="0.0001"
                    value={editForm.fxRate}
                    onChange={(e) => setEditForm({ ...editForm, fxRate: e.target.value })}
                    placeholder="1.0000"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gradient-gold text-primary-foreground">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quick Add Component
function QuickAddForm({ 
  assets, 
  onAdd 
}: { 
  assets: { ticker: string; name: string }[]; 
  onAdd: (val: Omit<MonthlyValuation, 'id'>) => Promise<void>;
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [values, setValues] = useState<Record<string, { price: string; fx: string }>>({});

  const handleQuickAdd = async (ticker: string, name: string) => {
    const val = values[ticker];
    if (val?.price) {
      await onAdd({
        assetId: ticker,
        ticker,
        assetName: name,
        month: currentMonth,
        pricePerUnit: parseFloat(val.price),
        fxRate: val.fx ? parseFloat(val.fx) : undefined
      });
      setValues(prev => ({ ...prev, [ticker]: { price: '', fx: '' } }));
      toast.success(`Added ${ticker} valuation`);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Quickly add valuations for <strong>{currentMonth}</strong>
      </p>
      <div className="grid gap-3">
        {assets.map(asset => (
          <div key={asset.ticker} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="w-32">
              <span className="font-medium text-primary">{asset.ticker}</span>
            </div>
            <Input 
              type="number"
              step="0.01"
              placeholder="Price/NAV"
              value={values[asset.ticker]?.price || ''}
              onChange={(e) => setValues(prev => ({
                ...prev,
                [asset.ticker]: { ...prev[asset.ticker], price: e.target.value }
              }))}
              className="w-32"
            />
            <Input 
              type="number"
              step="0.0001"
              placeholder="FX Rate"
              value={values[asset.ticker]?.fx || ''}
              onChange={(e) => setValues(prev => ({
                ...prev,
                [asset.ticker]: { ...prev[asset.ticker], fx: e.target.value }
              }))}
              className="w-28"
            />
            <Button 
              size="sm"
              onClick={() => handleQuickAdd(asset.ticker, asset.name)}
              disabled={!values[asset.ticker]?.price}
            >
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
