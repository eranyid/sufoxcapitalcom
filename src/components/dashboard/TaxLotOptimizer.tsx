import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Globe, Info, Loader2, AlertCircle } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useIsraelCPI } from '@/hooks/useIsraelCPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, differenceInDays } from 'date-fns';

// Israeli tax rate on REAL capital gains
const ISRAEL_CGT_RATE = 0.25; // 25% flat rate

interface TaxLot {
  id: string;
  ticker: string;
  assetName: string;
  purchaseDate: string;
  quantity: number;
  nominalCostBasis: number;
  realCostBasis: number;
  currentPrice: number;
  currentValue: number;
  nominalGain: number;
  realGain: number;
  realGainPercent: number;
  inflationAdjustment: number;
  holdingPeriodDays: number;
  purchaseCPI: number;
  currentCPI: number;
}

interface OptimizationResult {
  strategy: string;
  description: string;
  lots: TaxLot[];
  totalShares: number;
  totalProceeds: number;
  nominalGain: number;
  realGain: number;
  inflationAdjustment: number;
  taxEstimate: number;
}

export function TaxLotOptimizer() {
  const { transactions, valuations } = usePortfolio();
  const { getCPI, getCurrentCPI, getBaseInfo, isLoading: cpiLoading, error: cpiError, source: cpiSource } = useIsraelCPI();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [sharesToSell, setSharesToSell] = useState<string>('');

  const currentCPI = useMemo(() => getCurrentCPI(), [getCurrentCPI]);
  const baseInfo = useMemo(() => getBaseInfo(), [getBaseInfo]);

  // Build tax lots from transactions with Israeli CPI adjustment
  const { taxLots, tickerOptions } = useMemo(() => {
    if (cpiLoading) return { taxLots: {}, tickerOptions: [] };

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

      // Convert remaining lots to TaxLot format with Israeli tax rules
      const currentPrice = latestPrices[ticker];
      if (lots.length > 0 && currentPrice) {
        lotsByTicker[ticker] = lots.map((lot, idx) => {
          const holdingDays = differenceInDays(today, parseISO(lot.date));
          const nominalCostBasis = lot.qty * lot.price;
          const currentValue = lot.qty * currentPrice;
          
          // Israeli Real Gain Calculation using CBS CPI
          const purchaseCPI = getCPI(lot.date);
          const cpiRatio = currentCPI / purchaseCPI;
          const realCostBasis = nominalCostBasis * cpiRatio;
          
          const nominalGain = currentValue - nominalCostBasis;
          const realGain = currentValue - realCostBasis;
          const inflationAdjustment = realCostBasis - nominalCostBasis;

          return {
            id: `${ticker}-${idx}`,
            ticker,
            assetName: lot.name,
            purchaseDate: lot.date,
            quantity: lot.qty,
            nominalCostBasis,
            realCostBasis,
            currentPrice,
            currentValue,
            nominalGain,
            realGain,
            realGainPercent: nominalCostBasis > 0 ? (realGain / nominalCostBasis) * 100 : 0,
            inflationAdjustment,
            holdingPeriodDays: holdingDays,
            purchaseCPI,
            currentCPI,
          };
        });
      }
    });

    const options = Object.keys(lotsByTicker).sort();
    return { taxLots: lotsByTicker, tickerOptions: options };
  }, [transactions, valuations, currentCPI, getCPI, cpiLoading]);

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
      let totalNominalGain = 0;
      let totalRealGain = 0;
      let totalInflationAdj = 0;

      for (const lot of sortedLots) {
        if (remaining <= 0) break;
        
        const sharesToUse = Math.min(remaining, lot.quantity);
        const proportion = sharesToUse / lot.quantity;
        const proceeds = sharesToUse * lot.currentPrice;
        const nominalGain = proportion * lot.nominalGain;
        const realGain = proportion * lot.realGain;
        const inflationAdj = proportion * lot.inflationAdjustment;

        usedLots.push({ ...lot, quantity: sharesToUse });
        totalProceeds += proceeds;
        totalNominalGain += nominalGain;
        totalRealGain += realGain;
        totalInflationAdj += inflationAdj;

        remaining -= sharesToUse;
      }

      const taxEstimate = Math.max(0, totalRealGain) * ISRAEL_CGT_RATE;

      return {
        strategy,
        description,
        lots: usedLots,
        totalShares: requestedShares,
        totalProceeds,
        nominalGain: totalNominalGain,
        realGain: totalRealGain,
        inflationAdjustment: totalInflationAdj,
        taxEstimate,
      };
    };

    const fifoLots = [...selectedLots].sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
    const fifo = calculateResult('FIFO', 'Sell oldest shares first (default method)', fifoLots);

    const lifoLots = [...selectedLots].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
    const lifo = calculateResult('LIFO', 'Sell newest shares first (higher inflation adjustment)', lifoLots);

    const minGainLots = [...selectedLots].sort((a, b) => (b.realCostBasis / b.quantity) - (a.realCostBasis / a.quantity));
    const minGain = calculateResult('Min Real Gain', 'Minimize taxable real gains (highest adjusted cost first)', minGainLots);

    const maxGainLots = [...selectedLots].sort((a, b) => (a.realCostBasis / a.quantity) - (b.realCostBasis / b.quantity));
    const maxGain = calculateResult('Max Real Gain', 'Maximize gains for loss offset (lowest adjusted cost first)', maxGainLots);

    const taxEfficientLots = [...selectedLots].sort((a, b) => a.realGain - b.realGain);
    const taxEfficient = calculateResult('Tax Optimized', 'Minimize Israeli CGT (harvest losses + lowest real gains)', taxEfficientLots);

    return [taxEfficient, minGain, fifo, lifo, maxGain];
  }, [selectedTicker, requestedShares, selectedLots, totalShares]);

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000000) return `${sign}$${(absVal / 1000000).toFixed(2)}M`;
    if (absVal >= 1000) return `${sign}$${(absVal / 1000).toFixed(1)}K`;
    return `${sign}$${absVal.toFixed(0)}`;
  };

  const formatCPI = (cpi: number) => cpi.toFixed(1);

  if (cpiLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading CPI data from Israeli CBS...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator size={18} className="text-primary" />
          Tax Lot Optimizer
          <Badge variant="outline" className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Globe size={12} className="mr-1" />
            Israeli Tax Rules
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-2">
                  <p className="font-semibold">Israeli Capital Gains Tax</p>
                  <ul className="text-xs space-y-1">
                    <li>• 25% flat rate on <strong>real gains</strong></li>
                    <li>• Cost basis adjusted for inflation (CPI)</li>
                    <li>• Real Gain = Sale Price − Inflation-Adjusted Cost</li>
                    <li>• No distinction between short/long-term</li>
                    <li>• Losses can offset other capital gains</li>
                  </ul>
                </div>
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

            {/* CPI Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-muted/30 px-3 py-2 rounded-md">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" />
                <span>Current CPI: <strong className="text-foreground">{formatCPI(currentCPI)}</strong></span>
              </div>
              <span className="hidden sm:inline text-muted-foreground/60">|</span>
              <span className="text-muted-foreground">
                Data: {baseInfo.firstDate} → {baseInfo.lastDate} ({baseInfo.dataPoints} points)
              </span>
              <span className="hidden sm:inline text-muted-foreground/60">|</span>
              <span className={`${cpiError ? 'text-amber-400' : 'text-emerald-400'}`}>
                Source: {cpiSource}
              </span>
              {cpiError && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle size={14} className="text-amber-400" />
                    </TooltipTrigger>
                    <TooltipContent>{cpiError}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Tax Lots Table */}
            {selectedLots.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Available Tax Lots (CPI-Adjusted)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Purchase Date</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Shares</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 justify-end w-full">
                                Nominal Cost
                                <Info size={12} />
                              </TooltipTrigger>
                              <TooltipContent>Original purchase price</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 justify-end w-full">
                                Real Cost
                                <Info size={12} />
                              </TooltipTrigger>
                              <TooltipContent>CPI-adjusted cost basis</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Current Value</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 justify-end w-full">
                                Real Gain
                                <Info size={12} />
                              </TooltipTrigger>
                              <TooltipContent>Taxable gain (value − real cost)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </th>
                        <th className="pb-2 font-medium text-muted-foreground text-center">CPI Adj.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLots.map(lot => (
                        <tr key={lot.id} className="border-b border-border/50">
                          <td className="py-2">
                            <div>{format(parseISO(lot.purchaseDate), 'MMM d, yyyy')}</div>
                            <div className="text-xs text-muted-foreground">
                              CPI: {formatCPI(lot.purchaseCPI)}
                            </div>
                          </td>
                          <td className="py-2 text-right font-mono">{lot.quantity.toLocaleString()}</td>
                          <td className="py-2 text-right font-mono text-muted-foreground">
                            {formatCurrency(lot.nominalCostBasis)}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {formatCurrency(lot.realCostBasis)}
                          </td>
                          <td className="py-2 text-right font-mono">{formatCurrency(lot.currentValue)}</td>
                          <td className={`py-2 text-right font-mono ${lot.realGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {lot.realGain >= 0 ? '+' : ''}{formatCurrency(lot.realGain)}
                            <span className="text-xs ml-1">({lot.realGainPercent.toFixed(1)}%)</span>
                          </td>
                          <td className="py-2 text-center">
                            <Badge 
                              variant="outline" 
                              className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                            >
                              +{((lot.currentCPI / lot.purchaseCPI - 1) * 100).toFixed(1)}%
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
                          <span className="text-muted-foreground">Nominal Gain:</span>
                          <span className={`font-mono ${opt.nominalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {opt.nominalGain >= 0 ? '+' : ''}{formatCurrency(opt.nominalGain)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Inflation Adj.:</span>
                          <span className="font-mono text-blue-400">
                            −{formatCurrency(Math.abs(opt.inflationAdjustment))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Real Gain:</span>
                          <span className={`font-mono font-semibold ${opt.realGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {opt.realGain >= 0 ? '+' : ''}{formatCurrency(opt.realGain)}
                          </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Est. Tax (25%):</span>
                          <span className="font-mono text-red-400">
                            {opt.taxEstimate > 0 ? formatCurrency(opt.taxEstimate) : '$0'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Net After Tax:</span>
                          <span className="font-mono text-foreground">
                            {formatCurrency(opt.totalProceeds - opt.taxEstimate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Israeli CGT Rules:</strong> Tax is calculated at 25% on real gains only. 
                    The inflation adjustment (based on CBS CPI) reduces your taxable gain.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Real Gain</strong> = Sale Price − (Purchase Price × Current CPI ÷ Purchase CPI)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Losses can be used to offset other capital gains. Consult a tax advisor for personalized advice.
                  </p>
                </div>
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
