import { useState, useRef, useMemo, useEffect } from 'react';
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
import { Plus, Upload, Download, Trash2, Calendar, ChevronDown, ChevronUp, Pencil, Link } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CrmCompany } from '@/types/crm';

interface EditFormState {
  ticker: string;
  month: string;
  pricePerUnit: string;
  fxRate: string;
  yieldToMaturity: string;
  couponRate: string;
  duration: string;
  accruedInterest: string;
  maturityDate: string;
}

const emptyEditForm: EditFormState = { 
  ticker: '', 
  month: '', 
  pricePerUnit: '', 
  fxRate: '',
  yieldToMaturity: '',
  couponRate: '',
  duration: '',
  accruedInterest: '',
  maturityDate: ''
};

export default function Valuations() {
  const { user } = useAuth();
  const { transactions, valuations, addValuation, updateValuation, deleteValuation, importValuations } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState<MonthlyValuation | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);

  // Fetch companies for linking
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('crm_companies')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('company_name');
      if (data) setCompanies(data as CrmCompany[]);
    };
    fetchCompanies();
  }, [user]);

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
    assetName: '',
    month: '',
    pricePerUnit: '',
    fxRate: '',
    linkedCompanyId: '',
    yieldToMaturity: '',
    couponRate: '',
    duration: '',
    accruedInterest: '',
    maturityDate: ''
  });

  // Handle company selection - auto-fill fields
  const handleCompanySelect = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setForm(prev => ({
        ...prev,
        linkedCompanyId: companyId,
        ticker: company.ticker || prev.ticker,
        assetName: company.company_name || prev.assetName,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        linkedCompanyId: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = uniqueAssets.find(a => a.ticker === form.ticker);
    await addValuation({
      assetId: form.ticker,
      ticker: form.ticker,
      assetName: form.assetName || asset?.name || form.ticker,
      month: form.month,
      pricePerUnit: parseFloat(form.pricePerUnit),
      fxRate: form.fxRate ? parseFloat(form.fxRate) : undefined,
      linkedCompanyId: form.linkedCompanyId || undefined,
      yieldToMaturity: form.yieldToMaturity ? parseFloat(form.yieldToMaturity) : undefined,
      couponRate: form.couponRate ? parseFloat(form.couponRate) : undefined,
      duration: form.duration ? parseFloat(form.duration) : undefined,
      accruedInterest: form.accruedInterest ? parseFloat(form.accruedInterest) : undefined,
      maturityDate: form.maturityDate || undefined
    });
    setIsOpen(false);
    setForm({ 
      ticker: '', 
      assetName: '', 
      month: '', 
      pricePerUnit: '', 
      fxRate: '', 
      linkedCompanyId: '',
      yieldToMaturity: '',
      couponRate: '',
      duration: '',
      accruedInterest: '',
      maturityDate: ''
    });
    toast.success('Valuation added successfully');
  };

  const handleEditOpen = (val: MonthlyValuation) => {
    setEditingValuation(val);
    setEditForm({
      ticker: val.ticker,
      month: val.month,
      pricePerUnit: val.pricePerUnit.toString(),
      fxRate: val.fxRate?.toString() || '',
      yieldToMaturity: val.yieldToMaturity?.toString() || '',
      couponRate: val.couponRate?.toString() || '',
      duration: val.duration?.toString() || '',
      accruedInterest: val.accruedInterest?.toString() || '',
      maturityDate: val.maturityDate || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingValuation) return;
    
    await updateValuation(editingValuation.id, {
      pricePerUnit: parseFloat(editForm.pricePerUnit),
      fxRate: editForm.fxRate ? parseFloat(editForm.fxRate) : undefined,
      yieldToMaturity: editForm.yieldToMaturity ? parseFloat(editForm.yieldToMaturity) : undefined,
      couponRate: editForm.couponRate ? parseFloat(editForm.couponRate) : undefined,
      duration: editForm.duration ? parseFloat(editForm.duration) : undefined,
      accruedInterest: editForm.accruedInterest ? parseFloat(editForm.accruedInterest) : undefined,
      maturityDate: editForm.maturityDate || undefined
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
        const { valuations: imported, errors } = importValuationsFromCSV(csv);
        if (errors.length > 0) {
          toast.error(`${errors.length} rows had validation errors and were skipped`);
        }
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
    <div className="section-spacing animate-fade-in">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-primary uppercase tracking-wide">Monthly Valuations</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 font-mono">Record monthly NAV/prices</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".csv"
            className="hidden"
          />
          <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Import CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={handleExport} disabled={valuations.length === 0}>
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Export CSV</span>
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-gold text-primary-foreground text-xs md:text-sm">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Valuation</span>
                <span className="md:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4">
              <DialogHeader>
                <DialogTitle>Add Monthly Valuation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Link to Analysis */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-primary" />
                    Link to Analysis (Optional)
                  </Label>
                  <Select value={form.linkedCompanyId} onValueChange={handleCompanySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select analysis to auto-fill" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.ticker ? `${c.ticker} - ` : ''}{c.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ticker</Label>
                    <Input 
                      value={form.ticker}
                      onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                      placeholder="e.g. AAPL"
                      required
                      disabled={!!form.linkedCompanyId && !!companies.find(c => c.id === form.linkedCompanyId)?.ticker}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Name</Label>
                    <Input 
                      value={form.assetName}
                      onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                      placeholder="e.g. Apple Inc"
                      required
                      disabled={!!form.linkedCompanyId && !!companies.find(c => c.id === form.linkedCompanyId)?.company_name}
                    />
                  </div>
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
                    <Label>Price/NAV</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={form.pricePerUnit}
                      onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>FX Rate</Label>
                    <Input 
                      type="number"
                      step="0.0001"
                      value={form.fxRate}
                      onChange={(e) => setForm({ ...form, fxRate: e.target.value })}
                      placeholder="1.0000"
                    />
                  </div>
                </div>

                {/* Bond/Debt Fields */}
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Bond/Debt Fields (Optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>YTM (%)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={form.yieldToMaturity}
                        onChange={(e) => setForm({ ...form, yieldToMaturity: e.target.value })}
                        placeholder="e.g. 5.25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coupon Rate (%)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={form.couponRate}
                        onChange={(e) => setForm({ ...form, couponRate: e.target.value })}
                        placeholder="e.g. 4.50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="space-y-2">
                      <Label>Duration (Years)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: e.target.value })}
                        placeholder="e.g. 7.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Accrued Interest</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={form.accruedInterest}
                        onChange={(e) => setForm({ ...form, accruedInterest: e.target.value })}
                        placeholder="e.g. 125.50"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="space-y-2">
                      <Label>Maturity Date</Label>
                      <Input 
                        type="date"
                        value={form.maturityDate}
                        onChange={(e) => setForm({ ...form, maturityDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground" disabled={!form.ticker || !form.month || !form.pricePerUnit}>
                  Add Valuation
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Add Panel - Hidden on Mobile */}
      {uniqueAssets.length > 0 && (
        <Card size="sm" className="hidden md:block">
          <CardHeader className="pb-2">
            <CardTitle>Quick Add for Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickAddForm assets={uniqueAssets} onAdd={addValuation} />
          </CardContent>
        </Card>
      )}

      {/* Valuations by Month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Valuation History</CardTitle>
        </CardHeader>
        <CardContent>
          {valuations.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg md:text-xl font-medium mb-2">No Valuations Yet</h3>
              <p className="text-muted-foreground text-sm">
                {uniqueAssets.length === 0 
                  ? 'Add transactions first.' 
                  : 'Add your first monthly valuation.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedByMonth.map(([month, vals]) => (
                <div key={month} className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full px-3 md:px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}
                  >
                    <span className="font-medium text-sm md:text-base">{month}</span>
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className="text-muted-foreground text-xs md:text-sm">{vals.length} assets</span>
                      {expandedMonth === month ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  {expandedMonth === month && (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ticker</TableHead>
                              <TableHead>Asset Name</TableHead>
                              <TableHead className="text-right">Price/NAV</TableHead>
                              <TableHead className="text-right">FX Rate</TableHead>
                              <TableHead className="text-right">YTM</TableHead>
                              <TableHead className="text-right">Coupon</TableHead>
                              <TableHead className="text-right">Duration</TableHead>
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
                                <TableCell className="text-right text-muted-foreground">
                                  {v.yieldToMaturity ? `${v.yieldToMaturity.toFixed(2)}%` : '-'}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {v.couponRate ? `${v.couponRate.toFixed(2)}%` : '-'}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {v.duration ? `${v.duration.toFixed(2)}y` : '-'}
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
                                            Delete {v.month} valuation for {v.ticker}?
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
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden divide-y divide-border">
                        {vals.map((v) => (
                          <div key={v.id} className="p-3 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-primary text-sm">{v.ticker}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{v.assetName}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className="font-mono">{formatCurrency(v.pricePerUnit)}</span>
                                <span className="text-muted-foreground">FX: {v.fxRate?.toFixed(4) || '1.0000'}</span>
                              </div>
                              {/* Bond info row */}
                              {(v.yieldToMaturity || v.couponRate || v.duration) && (
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                  {v.yieldToMaturity && <span>YTM: {v.yieldToMaturity.toFixed(2)}%</span>}
                                  {v.couponRate && <span>Coupon: {v.couponRate.toFixed(2)}%</span>}
                                  {v.duration && <span>Dur: {v.duration.toFixed(2)}y</span>}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditOpen(v)}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="mx-4">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Valuation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Delete {v.month} valuation for {v.ticker}?
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
                          </div>
                        ))}
                      </div>
                    </>
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

              {/* Bond/Debt Fields */}
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Bond/Debt Fields (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>YTM (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editForm.yieldToMaturity}
                      onChange={(e) => setEditForm({ ...editForm, yieldToMaturity: e.target.value })}
                      placeholder="e.g. 5.25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Coupon Rate (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editForm.couponRate}
                      onChange={(e) => setEditForm({ ...editForm, couponRate: e.target.value })}
                      placeholder="e.g. 4.50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>Duration (Years)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editForm.duration}
                      onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                      placeholder="e.g. 7.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Accrued Interest</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editForm.accruedInterest}
                      onChange={(e) => setEditForm({ ...editForm, accruedInterest: e.target.value })}
                      placeholder="e.g. 125.50"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="space-y-2">
                    <Label>Maturity Date</Label>
                    <Input 
                      type="date"
                      value={editForm.maturityDate}
                      onChange={(e) => setEditForm({ ...editForm, maturityDate: e.target.value })}
                    />
                  </div>
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
  const [values, setValues] = useState<Record<string, { price: string; value: string; fx: string }>>({});

  const handleQuickAdd = async (ticker: string, name: string) => {
    const val = values[ticker];
    // Use price if provided, otherwise use value (they're alternative inputs)
    const priceValue = val?.price ? parseFloat(val.price) : (val?.value ? parseFloat(val.value) : 0);
    if (priceValue > 0) {
      await onAdd({
        assetId: ticker,
        ticker,
        assetName: name,
        month: currentMonth,
        pricePerUnit: priceValue,
        fxRate: val?.fx ? parseFloat(val.fx) : undefined
      });
      setValues(prev => ({ ...prev, [ticker]: { price: '', value: '', fx: '' } }));
      toast.success(`Added ${ticker} valuation`);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Quickly add valuations for <strong>{currentMonth}</strong>
      </p>
      {/* Column Headers */}
      <div className="grid gap-3">
        <div className="flex items-center gap-3 px-3 text-xs text-muted-foreground font-medium">
          <div className="w-20">Ticker</div>
          <div className="w-28">Price</div>
          <div className="w-28">Value</div>
          <div className="w-24">FX Rate</div>
          <div className="w-16"></div>
        </div>
        {assets.map(asset => (
          <div key={asset.ticker} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-20">
              <span className="font-medium text-primary text-sm">{asset.ticker}</span>
            </div>
            <Input 
              type="number"
              step="0.01"
              placeholder="Price"
              value={values[asset.ticker]?.price || ''}
              onChange={(e) => setValues(prev => ({
                ...prev,
                [asset.ticker]: { ...prev[asset.ticker], price: e.target.value, value: '' }
              }))}
              className="w-28 h-9"
            />
            <Input 
              type="number"
              step="0.01"
              placeholder="Value"
              value={values[asset.ticker]?.value || ''}
              onChange={(e) => setValues(prev => ({
                ...prev,
                [asset.ticker]: { ...prev[asset.ticker], value: e.target.value, price: '' }
              }))}
              className="w-28 h-9"
            />
            <Input 
              type="number"
              step="0.0001"
              placeholder="FX"
              value={values[asset.ticker]?.fx || ''}
              onChange={(e) => setValues(prev => ({
                ...prev,
                [asset.ticker]: { ...prev[asset.ticker], fx: e.target.value }
              }))}
              className="w-24 h-9"
            />
            <Button 
              size="sm"
              onClick={() => handleQuickAdd(asset.ticker, asset.name)}
              disabled={!values[asset.ticker]?.price && !values[asset.ticker]?.value}
              className="w-16"
            >
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
