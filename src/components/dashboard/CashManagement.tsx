import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { CashCurrency } from '@/types/investment';
import { Wallet, Plus, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CURRENCY_SYMBOLS: Record<CashCurrency, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪',
  GBP: '£',
  CHF: 'Fr',
  JPY: '¥'
};

const CURRENCY_NAMES: Record<CashCurrency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  ILS: 'Israeli Shekel',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  JPY: 'Japanese Yen'
};

// Approximate exchange rates (in real app, fetch from API)
const EXCHANGE_RATES: Record<CashCurrency, Record<CashCurrency, number>> = {
  USD: { USD: 1, EUR: 0.92, ILS: 3.7, GBP: 0.79, CHF: 0.88, JPY: 149 },
  EUR: { USD: 1.08, EUR: 1, ILS: 4.0, GBP: 0.86, CHF: 0.96, JPY: 162 },
  ILS: { USD: 0.27, EUR: 0.25, ILS: 1, GBP: 0.21, CHF: 0.24, JPY: 40 },
  GBP: { USD: 1.27, EUR: 1.16, ILS: 4.7, GBP: 1, CHF: 1.12, JPY: 189 },
  CHF: { USD: 1.14, EUR: 1.04, ILS: 4.2, GBP: 0.89, CHF: 1, JPY: 169 },
  JPY: { USD: 0.0067, EUR: 0.0062, ILS: 0.025, GBP: 0.0053, CHF: 0.0059, JPY: 1 }
};

export function CashManagement() {
  const { cashBalances, updateCashBalance, addCash } = usePortfolio();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [addCurrency, setAddCurrency] = useState<CashCurrency>('USD');
  const [addAmount, setAddAmount] = useState<string>('');
  const [editMode, setEditMode] = useState<CashCurrency | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Convert state
  const [fromCurrency, setFromCurrency] = useState<CashCurrency>('USD');
  const [toCurrency, setToCurrency] = useState<CashCurrency>('ILS');
  const [convertAmount, setConvertAmount] = useState<string>('');

  const handleAddCash = async () => {
    const amount = parseFloat(addAmount);
    if (!isNaN(amount) && amount > 0) {
      const finalAmount = transactionType === 'withdraw' ? -amount : amount;
      await addCash(addCurrency, finalAmount);
      setAddAmount('');
      setIsAddOpen(false);
    }
  };

  const handleConvert = async () => {
    const amount = parseFloat(convertAmount);
    if (!isNaN(amount) && amount > 0 && fromCurrency !== toCurrency) {
      if (cashBalances[fromCurrency] < amount) {
        return; // Not enough balance
      }
      const rate = EXCHANGE_RATES[fromCurrency][toCurrency];
      const convertedAmount = amount * rate;
      
      // Subtract from source currency and add to target
      await addCash(fromCurrency, -amount);
      await addCash(toCurrency, convertedAmount);
      setConvertAmount('');
      setIsAddOpen(false);
    }
  };

  const handleSetBalance = async (currency: CashCurrency) => {
    const amount = parseFloat(editValue);
    if (!isNaN(amount)) {
      await updateCashBalance(currency, amount);
      setEditMode(null);
      setEditValue('');
    }
  };

  const totalInUSD = cashBalances.USD + (cashBalances.EUR * 1.08) + (cashBalances.ILS * 0.27);
  
  const getConvertedPreview = () => {
    const amount = parseFloat(convertAmount);
    if (isNaN(amount) || amount <= 0 || fromCurrency === toCurrency) return null;
    const rate = EXCHANGE_RATES[fromCurrency][toCurrency];
    return (amount * rate).toFixed(2);
  };

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <span className="bloomberg-header-title">Cash Balances</span>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-6 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add/Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="text-sm">Cash Management</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="add" className="pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add">Add / Withdraw</TabsTrigger>
                <TabsTrigger value="convert">Convert</TabsTrigger>
              </TabsList>
              
              <TabsContent value="add" className="space-y-4 pt-4">
                <div>
                  <label className="terminal-label mb-1 block">Transaction Type</label>
                  <Select value={transactionType} onValueChange={(v) => setTransactionType(v as 'deposit' | 'withdraw')}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdraw">Withdraw</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="terminal-label mb-1 block">Currency</label>
                  <Select value={addCurrency} onValueChange={(v) => setAddCurrency(v as CashCurrency)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="ILS">ILS - Israeli Shekel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="terminal-label mb-1 block">Amount</label>
                  <Input
                    type="number"
                    min="0"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    className="h-8"
                  />
                </div>
                <Button onClick={handleAddCash} className="w-full h-8 text-xs">
                  {transactionType === 'deposit' ? 'Add Cash' : 'Withdraw Cash'}
                </Button>
              </TabsContent>
              
              <TabsContent value="convert" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="terminal-label mb-1 block">From</label>
                    <Select value={fromCurrency} onValueChange={(v) => setFromCurrency(v as CashCurrency)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="ILS">ILS</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Balance: {CURRENCY_SYMBOLS[fromCurrency]}{cashBalances[fromCurrency].toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="terminal-label mb-1 block">To</label>
                    <Select value={toCurrency} onValueChange={(v) => setToCurrency(v as CashCurrency)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="ILS">ILS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="terminal-label mb-1 block">Amount to Convert</label>
                  <Input
                    type="number"
                    min="0"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="h-8"
                  />
                  {getConvertedPreview() && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <ArrowRightLeft className="h-3 w-3" />
                      You'll receive: {CURRENCY_SYMBOLS[toCurrency]}{getConvertedPreview()}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleConvert} 
                  className="w-full h-8 text-xs"
                  disabled={fromCurrency === toCurrency || !convertAmount || parseFloat(convertAmount) > cashBalances[fromCurrency]}
                >
                  Convert Currency
                </Button>
                {parseFloat(convertAmount) > cashBalances[fromCurrency] && (
                  <p className="text-xs text-destructive">Insufficient balance</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(cashBalances) as CashCurrency[]).map((currency) => (
            <div key={currency} className="bg-muted/20 border border-border/30 p-3 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">{CURRENCY_NAMES[currency]}</span>
                <span className="text-primary font-mono text-[10px]">{currency}</span>
              </div>
              {editMode === currency ? (
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-6 text-xs"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleSetBalance(currency)} className="h-6 text-[10px] px-2">
                    Set
                  </Button>
                </div>
              ) : (
                <p 
                  className={`font-mono text-lg tabular-nums cursor-pointer hover:text-primary transition-colors ${cashBalances[currency] < 0 ? 'text-destructive' : ''}`}
                  onClick={() => {
                    setEditMode(currency);
                    setEditValue(cashBalances[currency].toString());
                  }}
                  title="Click to edit"
                >
                  {CURRENCY_SYMBOLS[currency]}{cashBalances[currency].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/30 flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">Total (approx. USD)</span>
          <span className="font-mono text-sm text-primary font-medium">
            ${totalInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-2">
          Click on balance to edit directly. Cash updates automatically on buy/sell.
        </p>
      </div>
    </div>
  );
}