import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Calendar, Info, Globe } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, differenceInDays } from 'date-fns';

// Israeli CPI data (base: 2020 = 100)
// Source: Israel Central Bureau of Statistics
const ISRAEL_CPI: Record<string, number> = {
  '2015-01': 82.1, '2015-02': 82.0, '2015-03': 82.4, '2015-04': 82.6, '2015-05': 82.8, '2015-06': 83.0,
  '2015-07': 82.6, '2015-08': 82.4, '2015-09': 82.4, '2015-10': 82.2, '2015-11': 82.1, '2015-12': 81.8,
  '2016-01': 81.5, '2016-02': 81.6, '2016-03': 81.8, '2016-04': 81.8, '2016-05': 82.0, '2016-06': 82.2,
  '2016-07': 82.0, '2016-08': 81.8, '2016-09': 82.0, '2016-10': 82.2, '2016-11': 82.2, '2016-12': 82.1,
  '2017-01': 82.0, '2017-02': 82.2, '2017-03': 82.3, '2017-04': 82.4, '2017-05': 82.4, '2017-06': 82.5,
  '2017-07': 82.3, '2017-08': 82.2, '2017-09': 82.4, '2017-10': 82.5, '2017-11': 82.5, '2017-12': 82.4,
  '2018-01': 82.5, '2018-02': 82.7, '2018-03': 82.8, '2018-04': 82.9, '2018-05': 83.0, '2018-06': 83.2,
  '2018-07': 83.3, '2018-08': 83.4, '2018-09': 83.6, '2018-10': 83.8, '2018-11': 83.8, '2018-12': 83.6,
  '2019-01': 83.6, '2019-02': 83.8, '2019-03': 84.0, '2019-04': 84.2, '2019-05': 84.2, '2019-06': 84.4,
  '2019-07': 84.3, '2019-08': 84.2, '2019-09': 84.4, '2019-10': 84.5, '2019-11': 84.4, '2019-12': 84.3,
  '2020-01': 84.4, '2020-02': 84.5, '2020-03': 84.6, '2020-04': 84.4, '2020-05': 84.2, '2020-06': 84.4,
  '2020-07': 84.3, '2020-08': 84.2, '2020-09': 84.4, '2020-10': 84.4, '2020-11': 84.3, '2020-12': 84.2,
  '2021-01': 84.4, '2021-02': 84.6, '2021-03': 84.9, '2021-04': 85.2, '2021-05': 85.5, '2021-06': 85.8,
  '2021-07': 86.0, '2021-08': 86.2, '2021-09': 86.5, '2021-10': 86.8, '2021-11': 87.0, '2021-12': 87.2,
  '2022-01': 87.5, '2022-02': 87.8, '2022-03': 88.3, '2022-04': 88.8, '2022-05': 89.3, '2022-06': 89.8,
  '2022-07': 90.0, '2022-08': 90.2, '2022-09': 90.5, '2022-10': 90.8, '2022-11': 91.0, '2022-12': 91.2,
  '2023-01': 91.5, '2023-02': 91.8, '2023-03': 92.0, '2023-04': 92.3, '2023-05': 92.5, '2023-06': 92.8,
  '2023-07': 93.0, '2023-08': 93.2, '2023-09': 93.5, '2023-10': 93.8, '2023-11': 94.0, '2023-12': 94.2,
  '2024-01': 94.5, '2024-02': 94.8, '2024-03': 95.0, '2024-04': 95.3, '2024-05': 95.5, '2024-06': 95.8,
  '2024-07': 96.0, '2024-08': 96.2, '2024-09': 96.5, '2024-10': 96.8, '2024-11': 97.0, '2024-12': 97.3,
  '2025-01': 97.5, '2025-02': 97.8, '2025-03': 98.0, '2025-04': 98.2, '2025-05': 98.5, '2025-06': 98.8,
  '2025-07': 99.0, '2025-08': 99.2, '2025-09': 99.5, '2025-10': 99.8, '2025-11': 100.0, '2025-12': 100.2,
};

// Get CPI for a given date (uses month's CPI)
function getCPI(dateStr: string): number {
  const monthKey = dateStr.substring(0, 7); // YYYY-MM
  if (ISRAEL_CPI[monthKey]) return ISRAEL_CPI[monthKey];
  
  // Find closest available CPI
  const sortedKeys = Object.keys(ISRAEL_CPI).sort();
  const lastKey = sortedKeys[sortedKeys.length - 1];
  const firstKey = sortedKeys[0];
  
  if (monthKey > lastKey) return ISRAEL_CPI[lastKey];
  if (monthKey < firstKey) return ISRAEL_CPI[firstKey];
  
  // Interpolate between closest months
  for (let i = 0; i < sortedKeys.length - 1; i++) {
    if (sortedKeys[i] <= monthKey && sortedKeys[i + 1] > monthKey) {
      return ISRAEL_CPI[sortedKeys[i]];
    }
  }
  
  return ISRAEL_CPI[lastKey];
}

// Get current CPI (latest available)
function getCurrentCPI(): number {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return getCPI(currentMonth);
}

// Israeli tax rate on REAL capital gains
const ISRAEL_CGT_RATE = 0.25; // 25% flat rate

interface TaxLot {
  id: string;
  ticker: string;
  assetName: string;
  purchaseDate: string;
  quantity: number;
  nominalCostBasis: number; // Original purchase cost
  realCostBasis: number; // CPI-adjusted cost basis
  currentPrice: number;
  currentValue: number;
  nominalGain: number; // Sale Price - Nominal Cost
  realGain: number; // Sale Price - Real Cost (taxable)
  realGainPercent: number;
  inflationAdjustment: number; // The inflation component (not taxed)
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
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [sharesToSell, setSharesToSell] = useState<string>('');

  const currentCPI = useMemo(() => getCurrentCPI(), []);

  // Build tax lots from transactions with Israeli CPI adjustment
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

      // Convert remaining lots to TaxLot format with Israeli tax rules
      const currentPrice = latestPrices[ticker];
      if (lots.length > 0 && currentPrice) {
        lotsByTicker[ticker] = lots.map((lot, idx) => {
          const holdingDays = differenceInDays(today, parseISO(lot.date));
          const nominalCostBasis = lot.qty * lot.price;
          const currentValue = lot.qty * currentPrice;
          
          // Israeli Real Gain Calculation
          const purchaseCPI = getCPI(lot.date);
          const cpiRatio = currentCPI / purchaseCPI;
          const realCostBasis = nominalCostBasis * cpiRatio;
          
          const nominalGain = currentValue - nominalCostBasis;
          const realGain = currentValue - realCostBasis;
          const inflationAdjustment = realCostBasis - nominalCostBasis; // The inflation component

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
  }, [transactions, valuations, currentCPI]);

  // Get lots for selected ticker
  const selectedLots = selectedTicker ? taxLots[selectedTicker] || [] : [];
  const totalShares = selectedLots.reduce((sum, lot) => sum + lot.quantity, 0);
  const requestedShares = parseFloat(sharesToSell) || 0;

  // Calculate optimization strategies with Israeli tax rules
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

      // Israeli tax: 25% on REAL gains only (if positive)
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

    // FIFO - First In, First Out
    const fifoLots = [...selectedLots].sort((a, b) => 
      a.purchaseDate.localeCompare(b.purchaseDate)
    );
    const fifo = calculateResult(
      'FIFO',
      'Sell oldest shares first (default method)',
      fifoLots
    );

    // LIFO - Last In, First Out
    const lifoLots = [...selectedLots].sort((a, b) => 
      b.purchaseDate.localeCompare(a.purchaseDate)
    );
    const lifo = calculateResult(
      'LIFO',
      'Sell newest shares first (higher inflation adjustment)',
      lifoLots
    );

    // Minimize Real Gains (sell highest real cost basis first)
    const minGainLots = [...selectedLots].sort((a, b) => 
      (b.realCostBasis / b.quantity) - (a.realCostBasis / a.quantity)
    );
    const minGain = calculateResult(
      'Min Real Gain',
      'Minimize taxable real gains (highest adjusted cost first)',
      minGainLots
    );

    // Maximize Real Gains (sell lowest real cost basis first)
    const maxGainLots = [...selectedLots].sort((a, b) => 
      (a.realCostBasis / a.quantity) - (b.realCostBasis / b.quantity)
    );
    const maxGain = calculateResult(
      'Max Real Gain',
      'Maximize gains for loss offset (lowest adjusted cost first)',
      maxGainLots
    );

    // Tax Efficient (prioritize real losses, then smallest real gains)
    const taxEfficientLots = [...selectedLots].sort((a, b) => {
      // Sort by real gain (losses first, then smallest gains)
      return a.realGain - b.realGain;
    });
    const taxEfficient = calculateResult(
      'Tax Optimized',
      'Minimize Israeli CGT (harvest losses + lowest real gains)',
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

  const formatCPI = (cpi: number) => cpi.toFixed(1);

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

            {/* Current CPI Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
              <TrendingUp size={14} className="text-primary" />
              <span>Current CPI Index: <strong className="text-foreground">{formatCPI(currentCPI)}</strong></span>
              <span className="text-muted-foreground/60">|</span>
              <span>Base Year: 2020</span>
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
                    The inflation adjustment (based on CPI) reduces your taxable gain.
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
