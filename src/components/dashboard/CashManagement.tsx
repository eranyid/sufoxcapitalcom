import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { CashCurrency } from '@/types/investment';
import { Wallet, Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CURRENCY_SYMBOLS: Record<CashCurrency, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪'
};

const CURRENCY_NAMES: Record<CashCurrency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  ILS: 'Israeli Shekel'
};

export function CashManagement() {
  const { cashBalances, updateCashBalance, addCash } = usePortfolio();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addCurrency, setAddCurrency] = useState<CashCurrency>('USD');
  const [addAmount, setAddAmount] = useState<string>('');
  const [editMode, setEditMode] = useState<CashCurrency | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleAddCash = () => {
    const amount = parseFloat(addAmount);
    if (!isNaN(amount) && amount !== 0) {
      addCash(addCurrency, amount);
      setAddAmount('');
      setIsAddOpen(false);
    }
  };

  const handleSetBalance = (currency: CashCurrency) => {
    const amount = parseFloat(editValue);
    if (!isNaN(amount)) {
      updateCashBalance(currency, amount);
      setEditMode(null);
      setEditValue('');
    }
  };

  const totalInUSD = cashBalances.USD + (cashBalances.EUR * 1.08) + (cashBalances.ILS * 0.27); // Approximate rates

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <span>Cash Balances</span>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-6 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add/Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[350px]">
            <DialogHeader>
              <DialogTitle className="text-sm">Add or Withdraw Cash</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
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
                <label className="terminal-label mb-1 block">Amount (use negative to withdraw)</label>
                <Input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="e.g. 10000 or -500"
                  className="h-8"
                />
              </div>
              <Button onClick={handleAddCash} className="w-full h-8 text-xs">
                {parseFloat(addAmount) >= 0 ? 'Add Cash' : 'Withdraw Cash'}
              </Button>
            </div>
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