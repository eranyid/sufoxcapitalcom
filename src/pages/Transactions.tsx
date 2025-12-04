import { useState, useRef } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Transaction, AssetType, TransactionType, Geography, Currency } from '@/types/investment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportToCSV, importTransactionsFromCSV } from '@/lib/storage';
import { getKnownInceptionYear } from '@/lib/crashScenarios';
import { Plus, Upload, Download, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ASSET_TYPES: AssetType[] = ['equity', 'bond', 'commodity', 'crypto', 'real_estate', 'cash', 'alternative', 'etf', 'mutual_fund', 'private_equity', 'private_debt', 'hedge_fund'];
const TRANSACTION_TYPES: TransactionType[] = ['buy', 'sell'];
const GEOGRAPHIES: Geography[] = ['north_america', 'europe', 'asia_pacific', 'emerging_markets', 'global', 'other'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'ILS', 'OTHER'];

export default function Transactions() {
  const { transactions, addTransaction, deleteTransaction, importTransactions } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
  const [filterTicker, setFilterTicker] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    assetName: '',
    ticker: '',
    assetType: 'equity' as AssetType,
    transactionType: 'buy' as TransactionType,
    date: '',
    quantity: '',
    pricePerUnit: '',
    fees: '',
    currency: 'USD' as Currency,
    geography: 'north_america' as Geography,
    inceptionYear: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransaction({
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
      inceptionYear: form.inceptionYear ? parseInt(form.inceptionYear) : undefined
    });
    setIsOpen(false);
    setForm({
      assetName: '', ticker: '', assetType: 'equity', transactionType: 'buy',
      date: '', quantity: '', pricePerUnit: '', fees: '', currency: 'USD', geography: 'north_america', inceptionYear: ''
    });
    toast.success('Transaction added');
  };

  const handleExport = () => {
    exportToCSV(transactions, `sufox_transactions_${new Date().toISOString().slice(0,10)}.csv`);
    toast.success('Exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csv = event.target?.result as string;
        const imported = importTransactionsFromCSV(csv);
        await importTransactions(imported);
        toast.success(`Imported ${imported.length} transactions`);
      };
      reader.readAsText(file);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filterTicker && !tx.ticker.toLowerCase().includes(filterTicker.toLowerCase())) return false;
    if (filterType !== 'all' && tx.transactionType !== filterType) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Calculate running P/L (simplified)
  let runningValue = 0;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header justify-between">
          <div className="flex items-center gap-3">
            <span className="bloomberg-header-title">TXN</span>
            <span className="text-muted-foreground text-xxs font-mono">Transaction Log ({transactions.length} records)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".csv"
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-6 px-2 text-xxs font-mono uppercase gap-1">
              <Upload className="h-3 w-3" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0} className="h-6 px-2 text-xxs font-mono uppercase gap-1">
              <Download className="h-3 w-3" /> Export
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-6 px-2 text-xxs font-mono uppercase gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-3 w-3" /> Add TXN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-mono text-sm">ADD TRANSACTION</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Asset Name</Label>
                      <Input 
                        value={form.assetName}
                        onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                        placeholder="Apple Inc."
                        required
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Ticker</Label>
                      <Input 
                        value={form.ticker}
                        onChange={(e) => handleTickerChange(e.target.value)}
                        placeholder="AAPL"
                        required
                        className="h-7 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Type</Label>
                      <Select value={form.transactionType} onValueChange={(v: TransactionType) => setForm({ ...form, transactionType: v })}>
                        <SelectTrigger className="h-7 text-xs font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TRANSACTION_TYPES.map(t => (
                            <SelectItem key={t} value={t} className="text-xs font-mono">{t.toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Asset Class</Label>
                      <Select value={form.assetType} onValueChange={(v: AssetType) => setForm({ ...form, assetType: v })}>
                        <SelectTrigger className="h-7 text-xs font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPES.map(t => (
                            <SelectItem key={t} value={t} className="text-xs font-mono">{t.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Date</Label>
                      <Input 
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Currency</Label>
                      <Select value={form.currency} onValueChange={(v: Currency) => setForm({ ...form, currency: v })}>
                        <SelectTrigger className="h-7 text-xs font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(c => (
                            <SelectItem key={c} value={c} className="text-xs font-mono">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Quantity</Label>
                      <Input 
                        type="number"
                        step="0.0001"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        required
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Price</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={form.pricePerUnit}
                        onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                        required
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Fees</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={form.fees}
                        onChange={(e) => setForm({ ...form, fees: e.target.value })}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Geography</Label>
                      <Select value={form.geography} onValueChange={(v: Geography) => setForm({ ...form, geography: v })}>
                        <SelectTrigger className="h-7 text-xs font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GEOGRAPHIES.map(g => (
                            <SelectItem key={g} value={g} className="text-xs font-mono">{g.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xxs font-mono uppercase">Inception Year</Label>
                      <Input 
                        type="number"
                        value={form.inceptionYear}
                        onChange={(e) => setForm({ ...form, inceptionYear: e.target.value })}
                        placeholder="e.g. 2009"
                        min="1900"
                        max="2025"
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-7 text-xs font-mono uppercase bg-primary text-primary-foreground">
                    Add Transaction
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="px-2 py-1.5 border-b border-border flex items-center gap-3 text-xxs font-mono">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Filter by ticker..."
            value={filterTicker}
            onChange={(e) => setFilterTicker(e.target.value)}
            className="h-5 w-32 text-xxs font-mono bg-transparent border-border"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={cn("terminal-tab", filterType === 'all' && "active")}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterType('buy')}
              className={cn("terminal-tab", filterType === 'buy' && "active")}
            >
              BUY
            </button>
            <button
              onClick={() => setFilterType('sell')}
              className={cn("terminal-tab", filterType === 'sell' && "active")}
            >
              SELL
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bloomberg-panel">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-xs font-mono">NO TRANSACTIONS FOUND</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>Asset Class</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Fees</th>
                  <th className="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const total = tx.quantity * tx.pricePerUnit + tx.fees;
                  runningValue += tx.transactionType === 'buy' ? -total : total;
                  
                  return (
                    <tr key={tx.id}>
                      <td className="text-muted-foreground">{formatDate(tx.date)}</td>
                      <td>
                        <span className={cn(
                          "px-1.5 py-0.5 text-xxs font-mono font-semibold",
                          tx.transactionType === 'buy' 
                            ? 'bg-success/20 text-success' 
                            : 'bg-destructive/20 text-destructive'
                        )}>
                          {tx.transactionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-semibold text-primary">{tx.ticker}</td>
                      <td className="text-foreground max-w-[120px] truncate">{tx.assetName}</td>
                      <td className="text-muted-foreground">{tx.assetType.replace(/_/g, ' ')}</td>
                      <td className="text-right">{tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className="text-right">{formatCurrency(tx.pricePerUnit)}</td>
                      <td className="text-right text-muted-foreground">{formatCurrency(tx.fees)}</td>
                      <td className="text-right font-medium">{formatCurrency(total)}</td>
                      <td className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-mono text-sm">DELETE TRANSACTION</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs font-mono">
                                Delete {tx.transactionType.toUpperCase()} for {tx.ticker}? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="h-7 text-xs font-mono uppercase">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="h-7 text-xs font-mono uppercase bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={async () => {
                                  await deleteTransaction(tx.id);
                                  toast.success('Deleted');
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}