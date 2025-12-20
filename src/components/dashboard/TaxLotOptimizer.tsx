import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Calendar, Info } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, differenceInDays } from 'date-fns';

interface TaxLot {
  id: string;
  ticker: string;
  assetName: string;
  purchaseDate: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  holdingPeriodDays: number;
  isLongTerm: boolean; // > 1 year
}

interface OptimizationResult {
  strategy: string;
  description: string;
  lots: TaxLot[];
  totalShares: number;
  totalProceeds: number;
  totalGain: number;
  shortTermGain: number;
  longTermGain: number;
  taxEstimate: number;
}

const SHORT_TERM_RATE = 0.37; // Assuming top marginal rate
const LONG_TERM_RATE = 0.20; // Long-term capital gains rate

export function TaxLotOptimizer() {
  const { transactions, valuations } = usePortfolio();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [sharesToSell, setSharesToSell] = useState<string>('');

  // Build tax lots from transactions
  const { taxLots, tickerOptions } = useMemo(() => {
    const lotsByTicker: Record<string, TaxLot[]> = {};
    const today = new Date();

    // Group transactions by ticker
    const txByTicker: Record<string, typeof transactions> = {};
    transactions.forEach(tx => {
      const ticker = tx.ticker.toUpperCase();
      if (!txByTicker[ticker]) txByTicker[ticker] = [];
      txByTicker[ticker].push(tx);
    });

    // Get latest prices
    const latestPrices: Record<string, number> = {};
    valuations.forEach(v => {
      const ticker = v.ticker.toUpperCase();
      if (!latestPrices[ticker] || v.month > (valuations.find(vv => vv.ticker.toUpperCase() === ticker && latestPrices[ticker] === vv.pricePerUnit)?.month || '')) {
        latestPrices[ticker] = v.pricePerUnit;
      }
    });

    // Build lots using FIFO for each ticker
    Object.entries(txByTicker).forEach(([ticker, txs]) => {
      const sortedTxs = [...txs].sort((a, b) => a.date.localeCompare(b.date));
      const lots: { date: string; qty: number; price: number; name: string }[] = [];

      sortedTxs.forEach(tx => {
        if (tx.transactionType === 'buy') {
          lots.push({
            date: tx.date,
            qty: tx.quantity,
            price: tx.pricePerUnit + (tx.fees || 0) / tx.quantity,
            name: tx.assetName,
          });
        } else {
          // Sell - reduce lots FIFO
          let remaining = tx.quantity;
          while (remaining > 0 && lots.length > 0) {
            if (lots[0].qty <= remaining) {
              remaining -= lots[0].qty;
              lots.shift();
            } else {
              lots[0].qty -= remaining;
              remaining = 0;
            }
          }
        }
      });

      // Convert remaining lots to TaxLot format
      const currentPrice = latestPrices[ticker];
      if (lots.length > 0 && currentPrice) {
        lotsByTicker[ticker] = lots.map((lot, idx) => {
          const holdingDays = differenceInDays(today, parseISO(lot.date));
          const costBasis = lot.qty * lot.price;
          const currentValue = lot.qty * currentPrice;
          const unrealizedGain = currentValue - costBasis;

          return {
            id: `${ticker}-${idx}`,
            ticker,
            assetName: lot.name,
            purchaseDate: lot.date,
            quantity: lot.qty,
            costBasis,
            currentPrice,
            currentValue,
            unrealizedGain,
            unrealizedGainPercent: (unrealizedGain / costBasis) * 100,
            holdingPeriodDays: holdingDays,
            isLongTerm: holdingDays >= 365,
          };
        });
      }
    });

    const options = Object.keys(lotsByTicker).sort();
    return { taxLots: lotsByTicker, tickerOptions: options };
  }, [transactions, valuations]);

  // Get lots for selected ticker
  const selectedLots = selectedTicker ? taxLots[selectedTicker] || [] : [];
  const totalShares = selectedLots.reduce((sum, lot) => sum + lot.quantity, 0);
  const requestedShares = parseFloat(sharesToSell) || 0;

  // Calculate optimization strategies
  const optimizations = useMemo((): OptimizationResult[] => {
    if (!selectedTicker || requestedShares <= 0 || selectedLots.length === 0) return [];
    if (requestedShares > totalShares) return [];

    const calculateResult = (
      strategy: string,
      description: string,
      sortedLots: TaxLot[]
    ): OptimizationResult => {
      let remaining = requestedShares;
      const usedLots: TaxLot[] = [];
      let totalProceeds = 0;
      let totalGain = 0;
      let shortTermGain = 0;
      let longTermGain = 0;

      for (const lot of sortedLots) {
        if (remaining <= 0) break;
        
        const sharesToUse = Math.min(remaining, lot.quantity);
        const proportion = sharesToUse / lot.quantity;
        const proceeds = sharesToUse * lot.currentPrice;
        const gain = proportion * lot.unrealizedGain;

        usedLots.push({ ...lot, quantity: sharesToUse });
        totalProceeds += proceeds;
        totalGain += gain;
        
        if (lot.isLongTerm) {
          longTermGain += gain;
        } else {
          shortTermGain += gain;
        }

        remaining -= sharesToUse;
      }

      const taxEstimate = 
        Math.max(0, shortTermGain) * SHORT_TERM_RATE + 
        Math.max(0, longTermGain) * LONG_TERM_RATE;

      return {
        strategy,
        description,
        lots: usedLots,
        totalShares: requestedShares,
        totalProceeds,
        totalGain,
        shortTermGain,
        longTermGain,
        taxEstimate,
      };
    };

    // FIFO - First In, First Out
    const fifoLots = [...selectedLots].sort((a, b) => 
      a.purchaseDate.localeCompare(b.purchaseDate)
    );
    const fifo = calculateResult(
      'FIFO',
      'Sell oldest shares first (IRS default)',
      fifoLots
    );

    // LIFO - Last In, First Out
    const lifoLots = [...selectedLots].sort((a, b) => 
      b.purchaseDate.localeCompare(a.purchaseDate)
    );
    const lifo = calculateResult(
      'LIFO',
      'Sell newest shares first',
      lifoLots
    );

    // Minimize Gains (sell highest cost basis first)
    const minGainLots = [...selectedLots].sort((a, b) => 
      (b.costBasis / b.quantity) - (a.costBasis / a.quantity)
    );
    const minGain = calculateResult(
      'Min Gain',
      'Minimize taxable gains (highest cost basis first)',
      minGainLots
    );

    // Maximize Gains (sell lowest cost basis first - for loss harvesting offset)
    const maxGainLots = [...selectedLots].sort((a, b) => 
      (a.costBasis / a.quantity) - (b.costBasis / b.quantity)
    );
    const maxGain = calculateResult(
      'Max Gain',
      'Maximize gains (lowest cost basis first)',
      maxGainLots
    );

    // Tax Efficient (prioritize long-term gains, then minimize)
    const taxEfficientLots = [...selectedLots].sort((a, b) => {
      // First sort by long-term status (long-term first if gains are positive)
      if (a.unrealizedGain > 0 && b.unrealizedGain > 0) {
        if (a.isLongTerm !== b.isLongTerm) return a.isLongTerm ? -1 : 1;
      }
      // Then by gain (losses first for harvesting, then lowest gains)
      return a.unrealizedGain - b.unrealizedGain;
    });
    const taxEfficient = calculateResult(
      'Tax Optimized',
      'Minimize tax liability (long-term gains + loss harvesting)',
      taxEfficientLots
    );

    return [taxEfficient, minGain, fifo, lifo, maxGain];
  }, [selectedTicker, requestedShares, selectedLots, totalShares]);

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000000) return `${sign}$${(absVal / 1000000).toFixed(2)}M`;
    if (absVal >= 1000) return `${sign}$${(absVal / 1000).toFixed(1)}K`;
    return `${sign}$${absVal.toFixed(0)}`;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator size={18} className="text-primary" />
          Tax Lot Optimizer
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Compare different tax lot selection strategies to minimize taxes when selling shares. Long-term gains (held 1+ year) are taxed at lower rates.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickerOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No positions with tax lots available. Add transactions to see optimization options.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Select Position</label>
                <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a ticker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tickerOptions.map(ticker => (
                      <SelectItem key={ticker} value={ticker}>
                        {ticker} ({taxLots[ticker].reduce((s, l) => s + l.quantity, 0).toLocaleString()} shares)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40">
                <label className="text-xs text-muted-foreground mb-1 block">Shares to Sell</label>
                <Input
                  type="number"
                  value={sharesToSell}
                  onChange={e => setSharesToSell(e.target.value)}
                  placeholder="0"
                  max={totalShares}
                />
                {selectedTicker && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: {totalShares.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Tax Lots Table */}
            {selectedLots.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Available Tax Lots
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Purchase Date</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Shares</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Cost Basis</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Current Value</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Gain/Loss</th>
                        <th className="pb-2 font-medium text-muted-foreground text-center">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLots.map(lot => (
                        <tr key={lot.id} className="border-b border-border/50">
                          <td className="py-2">{format(parseISO(lot.purchaseDate), 'MMM d, yyyy')}</td>
                          <td className="py-2 text-right font-mono">{lot.quantity.toLocaleString()}</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(lot.costBasis)}</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(lot.currentValue)}</td>
                          <td className={`py-2 text-right font-mono ${lot.unrealizedGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {lot.unrealizedGain >= 0 ? '+' : ''}{formatCurrency(lot.unrealizedGain)}
                            <span className="text-xs ml-1">({lot.unrealizedGainPercent.toFixed(1)}%)</span>
                          </td>
                          <td className="py-2 text-center">
                            <Badge 
                              variant="outline" 
                              className={lot.isLongTerm 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }
                            >
                              {lot.isLongTerm ? 'Long' : 'Short'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Optimization Results */}
            {optimizations.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Optimization Strategies for {requestedShares.toLocaleString()} Shares
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {optimizations.map((opt, idx) => (
                    <div 
                      key={opt.strategy}
                      className={`p-3 rounded-lg border ${idx === 0 ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{opt.strategy}</span>
                        {idx === 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{opt.description}</p>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Proceeds:</span>
                          <span className="font-mono">{formatCurrency(opt.totalProceeds)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Gain:</span>
                          <span className={`font-mono ${opt.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {opt.totalGain >= 0 ? '+' : ''}{formatCurrency(opt.totalGain)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Short-term:</span>
                          <span className={`font-mono ${opt.shortTermGain >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {formatCurrency(opt.shortTermGain)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Long-term:</span>
                          <span className={`font-mono ${opt.longTermGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(opt.longTermGain)}
                          </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Est. Tax:</span>
                          <span className="font-mono text-red-400">
                            {opt.taxEstimate > 0 ? formatCurrency(opt.taxEstimate) : '$0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  * Tax estimates assume {(SHORT_TERM_RATE * 100).toFixed(0)}% short-term and {(LONG_TERM_RATE * 100).toFixed(0)}% long-term rates. Consult a tax advisor for personalized advice.
                </p>
              </div>
            )}

            {selectedTicker && requestedShares > totalShares && (
              <p className="text-sm text-red-400 text-center">
                Requested shares exceed available position ({totalShares.toLocaleString()} shares available)
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
