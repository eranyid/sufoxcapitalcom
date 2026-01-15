import { useState } from 'react';
import { format } from 'date-fns';
import { useCapitalLedger } from '@/hooks/useCapitalLedger';
import { LedgerEntryType } from '@/lib/capitalLedger';
import { BloombergPanel } from '@/components/ui/bloomberg-panel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Coins,
  Percent,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CURRENCY_OPTIONS = ['ALL', 'USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY'] as const;

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
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<LedgerEntryType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

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

        <div className="ml-auto text-xs text-muted-foreground font-mono">
          {filteredEntries.length} entries
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
