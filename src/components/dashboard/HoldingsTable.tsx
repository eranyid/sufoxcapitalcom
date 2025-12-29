import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { calculatePositions, getLatestValuations } from '@/lib/calculations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HoldingsTableProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
}

interface LinkedCompany {
  id: string;
  company_name: string;
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
  linkedCompany: LinkedCompany | null;
}

type SortKey = 'ticker' | 'currentValue' | 'plPercent' | 'quantity';
type SortDirection = 'asc' | 'desc';

export function HoldingsTable({ transactions, valuations }: HoldingsTableProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [companiesMap, setCompaniesMap] = useState<Record<string, LinkedCompany>>({});

  // Fetch linked companies
  useEffect(() => {
    const fetchLinkedCompanies = async () => {
      if (!user) return;
      
      // Get all unique linked_company_ids from transactions
      const linkedIds = [...new Set(
        transactions
          .map((tx: any) => tx.linked_company_id)
          .filter(Boolean)
      )];
      
      if (linkedIds.length === 0) return;

      const { data } = await supabase
        .from('crm_companies')
        .select('id, company_name')
        .in('id', linkedIds);

      if (data) {
        const map: Record<string, LinkedCompany> = {};
        data.forEach(c => { map[c.id] = c; });
        setCompaniesMap(map);
      }
    };
    fetchLinkedCompanies();
  }, [user, transactions]);

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

      // Find the most recent transaction with a linked company for this ticker
      const linkedTx = transactions
        .filter(t => t.ticker === ticker && (t as any).linked_company_id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const linkedCompanyId = linkedTx ? (linkedTx as any).linked_company_id : null;
      const linkedCompany = linkedCompanyId ? companiesMap[linkedCompanyId] || null : null;

      result.push({
        ticker,
        name: tx.assetName,
        quantity: pos.quantity,
        avgCost: pos.avgCost,
        currentPrice,
        currentValue,
        plPercent,
        plAmount,
        linkedCompany,
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
  }, [positions, latestVals, transactions, sortKey, sortDirection, companiesMap]);

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
        <span className="bloomberg-header-title">Current Holdings</span>
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
              <TableHead className="terminal-label">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Analysis
                </span>
              </TableHead>
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
                <TableCell className="font-mono text-xs">
                  {holding.linkedCompany ? (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => navigate(`/backoffice/company/${holding.linkedCompany!.id}`)}
                            className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                          >
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{holding.linkedCompany.company_name}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View {holding.linkedCompany.company_name} analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
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
