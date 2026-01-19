import { useState, useRef, useMemo, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, AssetType, TransactionType, Geography, Currency } from '@/types/investment';
import { CrmCompany } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToCSV, importTransactionsFromCSV } from '@/lib/storage';
import { getKnownInceptionYear } from '@/lib/crashScenarios';
import { Plus, Upload, Download, Trash2, ArrowRightLeft, Package, AlertCircle, Pencil, Search, X, Building2 } from 'lucide-react';
import { PreTradeCheck } from '@/components/dashboard/PreTradeCheck';
import { TradeValidationPanel } from '@/components/transactions/TradeValidationPanel';
import { calculateHoldingsFromTransactions } from '@/lib/transactionValidator';
import { toast } from 'sonner';

const ASSET_TYPES: AssetType[] = ['equity', 'bond', 'commodity', 'crypto', 'real_estate', 'cash', 'alternative', 'etf', 'mutual_fund', 'private_equity', 'private_debt', 'hedge_fund'];
const TRANSACTION_TYPES: TransactionType[] = ['buy', 'sell'];
const GEOGRAPHIES: Geography[] = ['north_america', 'europe', 'israel', 'emerging_markets', 'global', 'other'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'ILS', 'OTHER'];

interface Holding {
  ticker: string;
  assetName: string;
  assetType: AssetType;
  quantity: number;
  currency: Currency;
  geography: Geography;
  inceptionYear?: number;
}

interface FormState {
  assetName: string;
  ticker: string;
  assetType: AssetType;
  transactionType: TransactionType;
  date: string;
  quantity: string;
  pricePerUnit: string;
  fees: string;
  currency: Currency;
  geography: Geography;
  inceptionYear: string;
  linkedCompanyId: string;
}

const emptyForm: FormState = {
  assetName: '',
  ticker: '',
  assetType: 'equity',
  transactionType: 'buy',
  date: '',
  quantity: '',
  pricePerUnit: '',
  fees: '',
  currency: 'USD',
  geography: 'north_america',
  inceptionYear: '',
  linkedCompanyId: ''
};

export default function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, importTransactions, cashBalances, settings } = usePortfolio();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

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

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          tx.ticker.toLowerCase().includes(query) ||
          tx.assetName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Date range filter
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      
      // Type filter
      if (typeFilter !== 'all' && tx.transactionType !== typeFilter) return false;
      
      return true;
    });
  }, [transactions, searchQuery, dateFrom, dateTo, typeFilter]);

  const sortedTransactions = useMemo(() => 
    [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date)),
    [filteredTransactions]
  );

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || typeFilter !== 'all';

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = sortedTransactions.map(tx => tx.id);
    const allSelected = filteredIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => new Set([...prev, ...filteredIds]));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await deleteTransaction(id);
    }
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
    toast.success(`Deleted ${ids.length} transactions`);
  };

  // Compute current holdings from transactions
  const holdings = useMemo(() => {
    const holdingsMap = new Map<string, Holding>();
    
    transactions.forEach(tx => {
      const existing = holdingsMap.get(tx.ticker);
      if (existing) {
        if (tx.transactionType === 'buy') {
          existing.quantity += tx.quantity;
        } else {
          existing.quantity -= tx.quantity;
        }
      } else {
        holdingsMap.set(tx.ticker, {
          ticker: tx.ticker,
          assetName: tx.assetName,
          assetType: tx.assetType,
          quantity: tx.transactionType === 'buy' ? tx.quantity : -tx.quantity,
          currency: tx.currency,
          geography: tx.geography,
          inceptionYear: tx.inceptionYear
        });
      }
    });
    
    // Filter out holdings with zero or negative quantity
    return Array.from(holdingsMap.values()).filter(h => h.quantity > 0);
  }, [transactions]);

  // Holdings map for validation (ticker -> quantity)
  const holdingsMap = useMemo(() => {
    return calculateHoldingsFromTransactions(transactions);
  }, [transactions]);

  // Auto-fill inception year when ticker changes (for BUY only)
  const handleTickerChange = (ticker: string) => {
    setForm(prev => {
      const knownYear = getKnownInceptionYear(ticker.toUpperCase());
      return { 
        ...prev, 
        ticker, 
        inceptionYear: knownYear ? knownYear.toString() : prev.inceptionYear 
      };
    });
  };

  // Handle transaction type change
  const handleTransactionTypeChange = (type: TransactionType) => {
    setForm(prev => ({
      ...prev,
      transactionType: type,
      // Reset fields when switching to sell
      ...(type === 'sell' ? {
        assetName: '',
        ticker: '',
        assetType: 'equity' as AssetType,
        currency: 'USD' as Currency,
        geography: 'north_america' as Geography,
        inceptionYear: ''
      } : {})
    }));
    setSelectedHolding(null);
    setQuantityError(null);
  };

  // Handle holding selection for SELL
  const handleHoldingSelect = (ticker: string) => {
    const holding = holdings.find(h => h.ticker === ticker);
    if (holding) {
      setSelectedHolding(holding);
      setForm(prev => ({
        ...prev,
        ticker: holding.ticker,
        assetName: holding.assetName,
        assetType: holding.assetType,
        currency: holding.currency,
        geography: holding.geography,
        inceptionYear: holding.inceptionYear?.toString() || ''
      }));
      setQuantityError(null);
    }
  };

  // Validate quantity for SELL
  const handleQuantityChange = (value: string) => {
    setForm(prev => ({ ...prev, quantity: value }));
    
    if (form.transactionType === 'sell' && selectedHolding) {
      const qty = parseFloat(value);
      if (!isNaN(qty) && qty > selectedHolding.quantity) {
        setQuantityError(`Cannot sell more than ${selectedHolding.quantity.toLocaleString()} units`);
      } else {
        setQuantityError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate BUY has company selected
    if (form.transactionType === 'buy' && !form.linkedCompanyId) {
      toast.error('Please select a holding/company');
      return;
    }
    
    // Validate SELL quantity
    if (form.transactionType === 'sell') {
      if (!selectedHolding) {
        toast.error('Please select a holding to sell');
        return;
      }
      const qty = parseFloat(form.quantity);
      if (qty > selectedHolding.quantity) {
        toast.error(`Cannot sell more than ${selectedHolding.quantity.toLocaleString()} units`);
        return;
      }
    }

    // Validate BUY has sufficient cash (using sync validation for immediate feedback)
    if (form.transactionType === 'buy' && user) {
      const { validateTradeSync } = await import('@/lib/transactionValidator');
      const validation = validateTradeSync({
        userId: user.id,
        ticker: form.ticker.toUpperCase(),
        transactionType: 'buy',
        quantity: parseFloat(form.quantity) || 0,
        pricePerUnit: parseFloat(form.pricePerUnit) || 0,
        fees: parseFloat(form.fees) || 0,
        assetCurrency: form.currency,
        baseCurrency: settings.baseCurrency,
        cashBalances,
        existingHoldings: holdingsMap
      });

      if (!validation.isValid) {
        validation.errors.forEach(err => toast.error(err));
        return;
      }

      // Show warnings but allow trade to proceed
      validation.warnings.forEach(warn => toast.warning(warn));
    }

    const transactionData: any = {
      assetName: form.assetName,
      ticker: form.ticker.toUpperCase(),
      assetType: form.assetType,
      transactionType: form.transactionType,
      date: form.date,
      quantity: parseFloat(form.quantity),
      pricePerUnit: parseFloat(form.pricePerUnit),
      fees: parseFloat(form.fees) || 0,
      currency: form.currency,
      geography: form.geography,
      inceptionYear: form.inceptionYear ? parseInt(form.inceptionYear) : undefined,
      linked_company_id: form.linkedCompanyId || null
    };

    await addTransaction(transactionData);
    setIsOpen(false);
    setSelectedHolding(null);
    setQuantityError(null);
    setForm(emptyForm);
    toast.success('Transaction added successfully');
  };

  // Edit transaction handlers
  const handleEditOpen = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditForm({
      assetName: tx.assetName,
      ticker: tx.ticker,
      assetType: tx.assetType,
      transactionType: tx.transactionType,
      date: tx.date,
      quantity: tx.quantity.toString(),
      pricePerUnit: tx.pricePerUnit.toString(),
      fees: tx.fees.toString(),
      currency: tx.currency,
      geography: tx.geography,
      inceptionYear: tx.inceptionYear?.toString() || '',
      linkedCompanyId: (tx as any).linked_company_id || ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    await updateTransaction(editingTransaction.id, {
      assetName: editForm.assetName,
      ticker: editForm.ticker.toUpperCase(),
      assetType: editForm.assetType,
      transactionType: editForm.transactionType,
      date: editForm.date,
      quantity: parseFloat(editForm.quantity),
      pricePerUnit: parseFloat(editForm.pricePerUnit),
      fees: parseFloat(editForm.fees) || 0,
      currency: editForm.currency,
      geography: editForm.geography,
      inceptionYear: editForm.inceptionYear ? parseInt(editForm.inceptionYear) : undefined,
      linked_company_id: editForm.linkedCompanyId || null
    } as any);
    setIsEditOpen(false);
    setEditingTransaction(null);
    setEditForm(emptyForm);
    toast.success('Transaction updated successfully');
  };

  const handleExport = () => {
    exportToCSV(transactions, `sufox_transactions_${new Date().toISOString().slice(0,10)}.csv`);
    toast.success('Transactions exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csv = event.target?.result as string;
        const { transactions: imported, errors } = importTransactionsFromCSV(csv);
        if (errors.length > 0) {
          toast.error(`${errors.length} rows had validation errors and were skipped`);
        }
        await importTransactions(imported);
        toast.success(`Imported ${imported.length} transactions`);
      };
      reader.readAsText(file);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(value);

  const isSellMode = form.transactionType === 'sell';
  const canSubmitBuy = !isSellMode && form.linkedCompanyId && companies.length > 0;
  const canSubmitSell = isSellMode && selectedHolding && !quantityError;
  const canSubmit = canSubmitBuy || canSubmitSell;

  return (
    <div className="section-spacing animate-fade-in">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-primary uppercase tracking-wide">Transactions</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 font-mono">Record buy and sell transactions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PreTradeCheck />
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
          <Button variant="outline" size="sm" className="text-xs md:text-sm" onClick={handleExport} disabled={transactions.length === 0}>
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Export CSV</span>
          </Button>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setSelectedHolding(null);
              setQuantityError(null);
              setForm(emptyForm);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-gold text-primary-foreground text-xs md:text-sm">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Transaction</span>
                <span className="md:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Transaction Type - Always First */}
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select value={form.transactionType} onValueChange={(v: TransactionType) => handleTransactionTypeChange(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_TYPES.map(t => (
                        <SelectItem key={t} value={t}>
                          <span className={t === 'buy' ? 'text-success' : 'text-destructive'}>
                            {t.toUpperCase()}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SELL Mode: Holding Selector */}
                {isSellMode && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Select Holding to Sell</Label>
                      {holdings.length === 0 ? (
                        <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                          <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No holdings available to sell</p>
                        </div>
                      ) : (
                        <Select value={selectedHolding?.ticker || ''} onValueChange={handleHoldingSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a holding..." />
                          </SelectTrigger>
                          <SelectContent>
                            {holdings.map(h => (
                              <SelectItem key={h.ticker} value={h.ticker}>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-mono font-bold text-primary">{h.ticker}</span>
                                  <span className="text-success font-mono">{h.quantity.toLocaleString()}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Selected Holding Details Card */}
                    {selectedHolding && (
                      <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Selected Position</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Ticker:</span>
                            <span className="ml-1 font-mono font-bold text-primary">{selectedHolding.ticker}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Available:</span>
                            <span className="ml-1 font-mono text-success font-bold">{selectedHolding.quantity.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BUY Mode: Select Holding/Company (Required) */}
                {!isSellMode && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        Select Holding / Company <span className="text-destructive">*</span>
                      </Label>
                      {companies.length === 0 ? (
                        <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No companies found in Back Office</p>
                          <p className="text-xs text-muted-foreground mt-1">Create a company analysis first to add transactions</p>
                        </div>
                      ) : (
                        <Select 
                          value={form.linkedCompanyId} 
                          onValueChange={(v) => {
                            const company = companies.find(c => c.id === v);
                            if (company) {
                              // Map geography to valid Geography type
                              const geographyMap: Record<string, Geography> = {
                                'north_america': 'north_america',
                                'europe': 'europe',
                                'israel': 'israel',
                                'emerging_markets': 'emerging_markets',
                                'global': 'global',
                                'other': 'other',
                                'North America': 'north_america',
                                'Europe': 'europe',
                                'Israel': 'israel',
                                'Emerging Markets': 'emerging_markets',
                                'Global': 'global',
                                'US': 'north_america',
                                'USA': 'north_america',
                              };
                              
                              setForm(prev => {
                                const mappedGeography = company.geography ? geographyMap[company.geography] || prev.geography : prev.geography;
                                const mappedAssetType = company.asset_type as AssetType || prev.assetType;
                                return {
                                  ...prev,
                                  linkedCompanyId: v,
                                  assetName: company.company_name || '',
                                  ticker: company.ticker || '',
                                  inceptionYear: company.inception_year?.toString() || '',
                                  geography: mappedGeography,
                                  assetType: mappedAssetType,
                                };
                              });
                            }
                          }}
                        >
                          <SelectTrigger className={!form.linkedCompanyId ? 'border-muted-foreground/50' : ''}>
                            <SelectValue placeholder="Choose a company..." />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                  {c.ticker && <span className="font-mono text-xs font-bold text-primary">{c.ticker}</span>}
                                  <span>{c.company_name}</span>
                                  {c.sector && <span className="text-xs text-muted-foreground">• {c.sector}</span>}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {!form.linkedCompanyId && companies.length > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Please select a holding to continue
                        </p>
                      )}
                    </div>

                    {/* Selected Company Summary (Read-Only) */}
                    {form.linkedCompanyId && (
                      <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Selected Holding</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-mono font-bold text-primary">{form.ticker || '—'}</span>
                          <span className="text-foreground">{form.assetName}</span>
                          {form.assetType && (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {form.assetType.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          )}
                          {form.geography && (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {form.geography.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Trade Fields - Only show when company is selected (BUY) or holding is selected (SELL) */}
                {((!isSellMode && form.linkedCompanyId) || (isSellMode && selectedHolding)) && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date <span className="text-destructive">*</span></Label>
                        <Input 
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency <span className="text-destructive">*</span></Label>
                        {!isSellMode ? (
                          <Select value={form.currency} onValueChange={(v: Currency) => setForm({ ...form, currency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            value={form.currency}
                            disabled
                            className="bg-muted"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Quantity <span className="text-destructive">*</span>
                          {isSellMode && selectedHolding && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (max: {selectedHolding.quantity.toLocaleString()})
                            </span>
                          )}
                        </Label>
                        <Input 
                          type="number"
                          step="0.0001"
                          value={form.quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          max={isSellMode && selectedHolding ? selectedHolding.quantity : undefined}
                          required
                          className={quantityError ? 'border-destructive' : ''}
                        />
                        {quantityError && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {quantityError}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Price per Unit <span className="text-destructive">*</span></Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={form.pricePerUnit}
                          onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fees</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={form.fees}
                          onChange={(e) => setForm({ ...form, fees: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Real-time Trade Validation Panel */}
                    {user && form.ticker && parseFloat(form.quantity) > 0 && parseFloat(form.pricePerUnit) > 0 && (
                      <TradeValidationPanel
                        userId={user.id}
                        ticker={form.ticker.toUpperCase()}
                        transactionType={form.transactionType}
                        quantity={parseFloat(form.quantity) || 0}
                        pricePerUnit={parseFloat(form.pricePerUnit) || 0}
                        fees={parseFloat(form.fees) || 0}
                        assetCurrency={form.currency}
                        baseCurrency={settings.baseCurrency}
                        cashBalances={cashBalances}
                        existingHoldings={holdingsMap}
                      />
                    )}

                    <Button 
                      type="submit" 
                      className="w-full gradient-gold text-primary-foreground"
                      disabled={!canSubmit}
                    >
                      {isSellMode ? 'Sell Position' : 'Add Transaction'}
                    </Button>
                  </>
                )}

                {/* Disabled state message for SELL without selection */}
                {isSellMode && !selectedHolding && holdings.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Select a holding above to enter sell details
                  </p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters - Mobile Optimized */}
      {transactions.length > 0 && (
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-4">
              <div className="w-full md:flex-1 md:min-w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search ticker or asset..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
                <div className="md:w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                  <Input 
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="md:w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                  <Input 
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1 md:w-[120px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | TransactionType)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="buy">
                        <span className="text-success">BUY</span>
                      </SelectItem>
                      <SelectItem value="sell">
                        <span className="text-destructive">SELL</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing {sortedTransactions.length} of {transactions.length}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions - Desktop Table / Mobile Cards */}
      <Card className="glass-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">Transaction History</CardTitle>
          {selectedIds.size > 0 && (
            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-xs">
                  <Trash2 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Delete {selectedIds.size} selected</span>
                  <span className="md:hidden">{selectedIds.size}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Multiple Transactions</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedIds.size} transactions?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleBulkDelete}
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg md:text-xl font-medium mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground text-sm">Add your first transaction to get started.</p>
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg md:text-xl font-medium mb-2">No Matching Transactions</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters.</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={sortedTransactions.length > 0 && sortedTransactions.every(tx => selectedIds.has(tx.id))}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Asset Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Fees</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.map((tx) => (
                      <TableRow key={tx.id} className={selectedIds.has(tx.id) ? 'bg-muted/30' : ''}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.has(tx.id)}
                            onCheckedChange={() => toggleSelect(tx.id)}
                          />
                        </TableCell>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.transactionType === 'buy' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-destructive/20 text-destructive'
                          }`}>
                            {tx.transactionType.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-primary">{tx.ticker}</TableCell>
                        <TableCell>{tx.assetName}</TableCell>
                        <TableCell className="text-muted-foreground">{tx.assetType}</TableCell>
                        <TableCell className="text-right">{tx.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(tx.pricePerUnit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(tx.fees)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(tx.quantity * tx.pricePerUnit + tx.fees)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditOpen(tx)}>
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
                                  <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Delete {tx.transactionType.toUpperCase()} for {tx.ticker}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async () => {
                                      await deleteTransaction(tx.id);
                                      toast.success('Transaction deleted');
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
              <div className="md:hidden space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Checkbox 
                    checked={sortedTransactions.length > 0 && sortedTransactions.every(tx => selectedIds.has(tx.id))}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-xs text-muted-foreground">Select All</span>
                </div>
                {sortedTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className={`p-3 rounded-lg border border-border ${selectedIds.has(tx.id) ? 'bg-muted/30 border-primary/50' : 'bg-card'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={selectedIds.has(tx.id)}
                          onCheckedChange={() => toggleSelect(tx.id)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">{tx.ticker}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              tx.transactionType === 'buy' 
                                ? 'bg-success/20 text-success' 
                                : 'bg-destructive/20 text-destructive'
                            }`}>
                              {tx.transactionType.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{tx.assetName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditOpen(tx)}>
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
                              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete {tx.transactionType.toUpperCase()} for {tx.ticker}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={async () => {
                                  await deleteTransaction(tx.id);
                                  toast.success('Transaction deleted');
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Date</span>
                        <p className="font-mono">{tx.date}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qty</span>
                        <p className="font-mono">{tx.quantity.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Total</span>
                        <p className="font-mono font-medium">{formatCurrency(tx.quantity * tx.pricePerUnit + tx.fees)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingTransaction(null);
          setEditForm(emptyForm);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input 
                  value={editForm.assetName}
                  onChange={(e) => setEditForm({ ...editForm, assetName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ticker</Label>
                <Input 
                  value={editForm.ticker}
                  onChange={(e) => setEditForm({ ...editForm, ticker: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select value={editForm.transactionType} onValueChange={(v: TransactionType) => setEditForm({ ...editForm, transactionType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map(t => (
                      <SelectItem key={t} value={t}>
                        <span className={t === 'buy' ? 'text-success' : 'text-destructive'}>
                          {t.toUpperCase()}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={editForm.assetType} onValueChange={(v: AssetType) => setEditForm({ ...editForm, assetType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={editForm.currency} onValueChange={(v: Currency) => setEditForm({ ...editForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input 
                  type="number"
                  step="0.0001"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Unit</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={editForm.pricePerUnit}
                  onChange={(e) => setEditForm({ ...editForm, pricePerUnit: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fees</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={editForm.fees}
                  onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Geography</Label>
                <Select value={editForm.geography} onValueChange={(v: Geography) => setEditForm({ ...editForm, geography: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GEOGRAPHIES.map(g => (
                      <SelectItem key={g} value={g}>{g.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inception Year</Label>
                <Input 
                  type="number"
                  value={editForm.inceptionYear}
                  onChange={(e) => setEditForm({ ...editForm, inceptionYear: e.target.value })}
                  placeholder="e.g. 2009"
                  min="1900"
                  max="2025"
                />
              </div>
            </div>

            {/* Link to Analysis */}
            {companies.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Link to Analysis (Optional)
                </Label>
                <Select 
                  value={editForm.linkedCompanyId} 
                  onValueChange={(v) => setEditForm({ ...editForm, linkedCompanyId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an analysis..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No link</span>
                    </SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          {c.ticker && <span className="font-mono text-xs text-primary">{c.ticker}</span>}
                          <span>{c.company_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gradient-gold text-primary-foreground">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
