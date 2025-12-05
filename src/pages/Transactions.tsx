import { useState, useRef } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Transaction, AssetType, TransactionType, Geography, Currency } from '@/types/investment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportToCSV, importTransactionsFromCSV } from '@/lib/storage';
import { Plus, Upload, Download, Trash2, Edit2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

const ASSET_TYPES: AssetType[] = ['equity', 'bond', 'commodity', 'crypto', 'real_estate', 'cash', 'alternative', 'etf', 'mutual_fund'];
const TRANSACTION_TYPES: TransactionType[] = ['buy', 'sell'];
const GEOGRAPHIES: Geography[] = ['north_america', 'europe', 'asia_pacific', 'emerging_markets', 'global', 'other'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'OTHER'];

export default function Transactions() {
  const { transactions, addTransaction, deleteTransaction, importTransactions } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
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
    geography: 'north_america' as Geography
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      assetName: form.assetName,
      ticker: form.ticker.toUpperCase(),
      assetType: form.assetType,
      transactionType: form.transactionType,
      date: form.date,
      quantity: parseFloat(form.quantity),
      pricePerUnit: parseFloat(form.pricePerUnit),
      fees: parseFloat(form.fees) || 0,
      currency: form.currency,
      geography: form.geography
    });
    setIsOpen(false);
    setForm({
      assetName: '', ticker: '', assetType: 'equity', transactionType: 'buy',
      date: '', quantity: '', pricePerUnit: '', fees: '', currency: 'USD', geography: 'north_america'
    });
    toast.success('Transaction added successfully');
  };

  const handleExport = () => {
    exportToCSV(transactions, `sufox_transactions_${new Date().toISOString().slice(0,10)}.csv`);
    toast.success('Transactions exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        const imported = importTransactionsFromCSV(csv);
        importTransactions(imported);
        toast.success(`Imported ${imported.length} transactions`);
      };
      reader.readAsText(file);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(value);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">Record buy and sell transactions</p>
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
          <Button variant="outline" onClick={handleExport} disabled={transactions.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asset Name</Label>
                    <Input 
                      value={form.assetName}
                      onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                      placeholder="Apple Inc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ticker</Label>
                    <Input 
                      value={form.ticker}
                      onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                      placeholder="AAPL"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <Select value={form.transactionType} onValueChange={(v: TransactionType) => setForm({ ...form, transactionType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Type</Label>
                    <Select value={form.assetType} onValueChange={(v: AssetType) => setForm({ ...form, assetType: v })}>
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
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={(v: Currency) => setForm({ ...form, currency: v })}>
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
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Unit</Label>
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
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Geography</Label>
                  <Select value={form.geography} onValueChange={(v: Geography) => setForm({ ...form, geography: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GEOGRAPHIES.map(g => (
                        <SelectItem key={g} value={g}>{g.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground">
                  Add Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">Add your first transaction to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).map((tx) => (
                    <TableRow key={tx.id}>
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
                                Are you sure you want to delete this {tx.transactionType.toUpperCase()} transaction for {tx.ticker}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                  deleteTransaction(tx.id);
                                  toast.success('Transaction deleted');
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
