import { useState, useMemo } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { calculatePositions, getLatestValuations } from '@/lib/calculations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface HoldingsTableProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
}

interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  plPercent: number;
  plAmount: number;
}

type SortKey = 'ticker' | 'currentValue' | 'plPercent' | 'quantity';
type SortDirection = 'asc' | 'desc';

export function HoldingsTable({ transactions, valuations }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);

  const holdings = useMemo(() => {
    const result: Holding[] = [];

    for (const [ticker, pos] of Object.entries(positions)) {
      if (pos.quantity <= 0) continue;

      const val = latestVals[ticker];
      const tx = transactions.find(t => t.ticker === ticker);
      if (!val || !tx) continue;

      const currentPrice = val.pricePerUnit * (val.fxRate || 1);
      const currentValue = pos.quantity * currentPrice;
      const costBasis = pos.quantity * pos.avgCost;
      const plAmount = currentValue - costBasis;
      const plPercent = costBasis > 0 ? (plAmount / costBasis) * 100 : 0;

      result.push({
        ticker,
        name: tx.assetName,
        quantity: pos.quantity,
        avgCost: pos.avgCost,
        currentPrice,
        currentValue,
        plPercent,
        plAmount,
      });
    }

    // Sort based on sortKey and sortDirection
    result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'ticker') {
        comparison = a.ticker.localeCompare(b.ticker);
      } else {
        comparison = a[sortKey] - b[sortKey];
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [positions, latestVals, transactions, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'ticker' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatQuantity = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(4);
  };

  if (holdings.length === 0) {
    return null;
  }

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="text-primary">■</span> Current Holdings
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead 
                className="terminal-label cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('ticker')}
              >
                <span className="flex items-center">Ticker<SortIcon columnKey="ticker" /></span>
              </TableHead>
              <TableHead className="terminal-label">Name</TableHead>
              <TableHead 
                className="terminal-label text-right cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('quantity')}
              >
                <span className="flex items-center justify-end">Qty<SortIcon columnKey="quantity" /></span>
              </TableHead>
              <TableHead className="terminal-label text-right">Avg Cost</TableHead>
              <TableHead className="terminal-label text-right">Price</TableHead>
              <TableHead 
                className="terminal-label text-right cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('currentValue')}
              >
                <span className="flex items-center justify-end">Value<SortIcon columnKey="currentValue" /></span>
              </TableHead>
              <TableHead 
                className="terminal-label text-right cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('plPercent')}
              >
                <span className="flex items-center justify-end">P/L %<SortIcon columnKey="plPercent" /></span>
              </TableHead>
              <TableHead className="terminal-label text-right">P/L $</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => (
              <TableRow key={holding.ticker} className="border-border/20 hover:bg-primary/5">
                <TableCell className="font-mono text-xs text-primary font-medium">
                  {holding.ticker}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {holding.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums">
                  {formatQuantity(holding.quantity)}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                  {formatCurrency(holding.avgCost)}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums">
                  {formatCurrency(holding.currentPrice)}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums font-medium">
                  {formatCurrency(holding.currentValue)}
                </TableCell>
                <TableCell className={cn(
                  "font-mono text-xs text-right tabular-nums font-medium",
                  holding.plPercent >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatPercent(holding.plPercent)}
                </TableCell>
                <TableCell className={cn(
                  "font-mono text-xs text-right tabular-nums font-medium",
                  holding.plAmount >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(holding.plAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
