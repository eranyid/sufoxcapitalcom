import { useState } from 'react';
import { format } from 'date-fns';
import { useCapitalLedger } from '@/hooks/useCapitalLedger';
import { LedgerEntryType, createLedgerEntry } from '@/lib/capitalLedger';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { useQueryClient } from '@tanstack/react-query';
import { BloombergPanel } from '@/components/ui/bloomberg-panel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Coins,
  Percent,
  Filter,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CURRENCY_OPTIONS = ['ALL', 'USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY'] as const;
const CURRENCY_LIST = ['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY'] as const;

const MANUAL_ENTRY_TYPES: { value: LedgerEntryType; label: string }[] = [
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'DIVIDEND', label: 'Dividend' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'FEE', label: 'Fee' },
];

const ENTRY_TYPE_OPTIONS: { value: LedgerEntryType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'FX_CONVERSION', label: 'FX Conversion' },
  { value: 'DIVIDEND', label: 'Dividend' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'FEE', label: 'Fee' },
];

const ENTRY_TYPE_CONFIG: Record<LedgerEntryType, { 
  icon: React.ElementType; 
  colorClass: string; 
  label: string;
}> = {
  BUY: { icon: TrendingDown, colorClass: 'text-destructive', label: 'Buy' },
  SELL: { icon: TrendingUp, colorClass: 'text-green-500', label: 'Sell' },
  DEPOSIT: { icon: ArrowDownCircle, colorClass: 'text-green-500', label: 'Deposit' },
  WITHDRAWAL: { icon: ArrowUpCircle, colorClass: 'text-destructive', label: 'Withdrawal' },
  FX_CONVERSION: { icon: RefreshCcw, colorClass: 'text-blue-500', label: 'FX' },
  DIVIDEND: { icon: Coins, colorClass: 'text-green-500', label: 'Dividend' },
  INTEREST: { icon: Percent, colorClass: 'text-green-500', label: 'Interest' },
  FEE: { icon: Receipt, colorClass: 'text-destructive', label: 'Fee' },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪',
  GBP: '£',
  CHF: 'Fr',
  JPY: '¥',
};

interface CapitalLedgerViewProps {
  className?: string;
  compact?: boolean;
}

export function CapitalLedgerView({ className, compact = false }: CapitalLedgerViewProps) {
  const { user } = useAuth();
  const { addCash, addCashWithType } = usePortfolio();
  const queryClient = useQueryClient();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<LedgerEntryType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add entry dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entryType: 'DEPOSIT' as LedgerEntryType,
    currency: 'USD',
    amount: '',
    description: '',
  });

  const { data: entries = [], isLoading, error } = useCapitalLedger({
    currency: selectedCurrency === 'ALL' ? undefined : selectedCurrency,
    entryType: selectedType === 'ALL' ? undefined : selectedType,
    limit: compact ? 50 : 500,
  });

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.description?.toLowerCase().includes(term) ||
      entry.entryType.toLowerCase().includes(term) ||
      entry.currency.toLowerCase().includes(term)
    );
  });

  const handleAddEntry = async () => {
    if (!user?.id || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(newEntry.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Adjust sign based on entry type
    const signedAmount = ['WITHDRAWAL', 'FEE'].includes(newEntry.entryType) 
      ? -Math.abs(amount) 
      : Math.abs(amount);

    const validCurrencies = ['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY'];
    if (!validCurrencies.includes(newEntry.currency)) {
      toast.error('Invalid currency');
      return;
    }

    setIsSubmitting(true);
    try {
      const currency = newEntry.currency as 'USD' | 'EUR' | 'ILS' | 'GBP' | 'CHF' | 'JPY';
      
      // Use addCashWithType for all entries - it updates both cash balance AND creates ledger entry
      await addCashWithType(
        currency,
        signedAmount,
        newEntry.entryType,
        newEntry.description || undefined
      );
      
      toast.success('Entry added successfully');
      setIsAddOpen(false);
      setNewEntry({ entryType: 'DEPOSIT', currency: 'USD', amount: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['capital-ledger'] });
    } catch (err) {
      console.error('Failed to add ledger entry:', err);
      toast.error('Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const formatted = Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${amount >= 0 ? '+' : '-'}${symbol}${formatted}`;
  };

  const formatBalance = (balance: number | undefined, currency: string) => {
    if (balance === undefined) return '-';
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (error) {
    return (
      <BloombergPanel title="CAPITAL LEDGER" className={className}>
        <div className="p-4 text-destructive text-sm">
          Failed to load ledger entries
        </div>
      </BloombergPanel>
    );
  }

  return (
    <BloombergPanel 
      title="CAPITAL LEDGER" 
      className={className}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map(currency => (
                <SelectItem key={currency} value={currency} className="text-xs">
                  {currency === 'ALL' ? 'All Currencies' : currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as LedgerEntryType | 'ALL')}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {ENTRY_TYPE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-40 h-8 text-xs"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {filteredEntries.length} entries
          </span>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Ledger Entry</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="entry-type">Type</Label>
                  <Select 
                    value={newEntry.entryType} 
                    onValueChange={(v) => setNewEntry(prev => ({ ...prev, entryType: v as LedgerEntryType }))}
                  >
                    <SelectTrigger id="entry-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MANUAL_ENTRY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={newEntry.currency} 
                      onValueChange={(v) => setNewEntry(prev => ({ ...prev, currency: v }))}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_LIST.map(ccy => (
                          <SelectItem key={ccy} value={ccy}>
                            {ccy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newEntry.amount}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Wire transfer from bank"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Entry'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className={compact ? 'h-[300px]' : 'h-[500px]'}>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No ledger entries found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider w-32">Date</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider w-24">Type</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider w-16">CCY</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right w-28">Amount</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right w-28">Balance</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const config = ENTRY_TYPE_CONFIG[entry.entryType];
                const Icon = config.icon;
                
                return (
                  <TableRow key={entry.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground py-2">
                      {format(new Date(entry.createdAt), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('h-3.5 w-3.5', config.colorClass)} />
                        <Badge variant="outline" className={cn('text-[10px] px-1.5', config.colorClass)}>
                          {config.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-xs font-mono">{entry.currency}</span>
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono text-xs py-2 tabular-nums',
                      entry.amount >= 0 ? 'text-green-500' : 'text-destructive'
                    )}>
                      {formatAmount(entry.amount, entry.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs py-2 tabular-nums text-foreground">
                      {formatBalance(entry.runningBalance, entry.currency)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2 truncate max-w-[200px]">
                      {entry.description || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </BloombergPanel>
  );
}
