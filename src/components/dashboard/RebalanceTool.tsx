import { useState, useMemo, useCallback, useEffect } from 'react';
import { Scale, TrendingUp, AlertCircle, Plus, Trash2, RefreshCw, FileText, Loader2, Equal, Calculator, Globe, Info, ArrowRight, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useIsraelCPI } from '@/hooks/useIsraelCPI';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, parseISO, format } from 'date-fns';
import { generateRebalanceReport } from '@/lib/rebalanceReportPdf';

// Israeli tax rate on REAL capital gains
const ISRAEL_CGT_RATE = 0.25; // 25% flat rate

interface Holding {
  ticker: string;
  assetName: string;
  assetType: string;
  quantity: number;
  currentPrice: number;
  value: number;
  currentWeight: number;
  targetWeight: number;
}

interface SuggestedTrade {
  ticker: string;
  assetName: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  value: number;
  weightChange: number;
}

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

interface TaxOptimizedSell {
  ticker: string;
  assetName: string;
  requiredSellValue: number;
  requiredSellShares: number;
  selectedLots: {
    purchaseDate: string;
    sharesSold: number;
    realGain: number;
    taxImpact: number;
    purchaseCPI: number;
    currentCPI: number;
  }[];
  totalProceeds: number;
  totalNominalGain: number;
  totalRealGain: number;
  totalInflationAdjustment: number;
  taxEstimate: number;
  netProceeds: number;
}

interface RebalanceAnalysis {
  trades: SuggestedTrade[];
  taxOptimizedSells: TaxOptimizedSell[];
  totalTurnover: number;
  numberOfTrades: number;
  cashImpact: number;
  estimatedCost: number;
  trackingErrorImpact: number;
  beforeAllocation: { name: string; weight: number }[];
  afterAllocation: { name: string; weight: number }[];
  totalTaxDue: number;
  totalNetProceeds: number;
  targetsMet: boolean;
  warnings: string[];
}

// Map asset types to policy categories
const ASSET_TYPE_TO_CATEGORY: Record<string, 'equity' | 'fixed_income' | 'alternatives' | 'cash'> = {
  equity: 'equity',
  etf: 'equity',
  mutual_fund: 'equity',
  bond: 'fixed_income',
  commodity: 'alternatives',
  crypto: 'alternatives',
  real_estate: 'alternatives',
  alternative: 'alternatives',
  private_equity: 'alternatives',
  private_debt: 'alternatives',
  hedge_fund: 'alternatives',
  cash: 'cash'
};

export function RebalanceTool() {
  const { transactions, valuations, cashBalances, settings } = usePortfolio();
  const { user } = useAuth();
  const { logRebalanceActivity } = useActivityLog();
  const { getCPI, getCurrentCPI, getBaseInfo, isLoading: cpiLoading, error: cpiError, source: cpiSource } = useIsraelCPI();
  
  const [isOpen, setIsOpen] = useState(true);
  const [minTradeSize, setMinTradeSize] = useState(0.5);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [newPositionTicker, setNewPositionTicker] = useState('');
  const [newPositionTarget, setNewPositionTarget] = useState('');
  const [manualTargets, setManualTargets] = useState<Record<string, number>>({});
  const [newPositions, setNewPositions] = useState<{ ticker: string; targetWeight: number }[]>([]);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [loadingEqualWeight, setLoadingEqualWeight] = useState(false);
  const [policyApplied, setPolicyApplied] = useState(false);
  const [equalWeightApplied, setEqualWeightApplied] = useState(false);
  const [firstProjectId, setFirstProjectId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const currentCPI = useMemo(() => getCurrentCPI(), [getCurrentCPI]);
  const baseInfo = useMemo(() => getBaseInfo(), [getBaseInfo]);

  // Fetch first project for activity logging
  useEffect(() => {
    if (!user) return;
    supabase
      .from('crm_projects')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFirstProjectId(data[0].id);
        }
      });
  }, [user]);

  // Build tax lots from transactions
  const taxLotsByTicker = useMemo((): Record<string, TaxLot[]> => {
    if (cpiLoading) return {};

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

    return lotsByTicker;
  }, [transactions, valuations, currentCPI, getCPI, cpiLoading]);

  // Calculate current holdings from transactions and valuations
  const currentHoldings = useMemo((): Holding[] => {
    if (!transactions.length) return [];

    const positions: Record<string, {
      ticker: string;
      assetName: string;
      assetType: string;
      quantity: number;
      latestPrice: number;
    }> = {};

    transactions.forEach(tx => {
      if (!positions[tx.ticker]) {
        positions[tx.ticker] = {
          ticker: tx.ticker,
          assetName: tx.assetName,
          assetType: tx.assetType,
          quantity: 0,
          latestPrice: 0
        };
      }
      positions[tx.ticker].quantity += tx.transactionType === 'buy' ? tx.quantity : -tx.quantity;
    });

    valuations.forEach(v => {
      if (positions[v.ticker]) {
        positions[v.ticker].latestPrice = v.pricePerUnit;
      }
    });

    const holdingsArray = Object.values(positions)
      .filter(p => p.quantity > 0 && p.latestPrice > 0)
      .map(p => ({
        ...p,
        currentPrice: p.latestPrice,
        value: p.quantity * p.latestPrice
      }));

    const totalValue = holdingsArray.reduce((sum, h) => sum + h.value, 0);

    return holdingsArray.map(h => ({
      ticker: h.ticker,
      assetName: h.assetName,
      assetType: h.assetType,
      quantity: h.quantity,
      currentPrice: h.currentPrice,
      value: h.value,
      currentWeight: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
      targetWeight: manualTargets[h.ticker] ?? (totalValue > 0 ? (h.value / totalValue) * 100 : 0)
    }));
  }, [transactions, valuations, manualTargets]);

  // Calculate total cash in base currency for unified NAV
  const totalCashValue = useMemo(() => {
    const EUR_TO_USD = 1.08;
    const ILS_TO_USD = 1 / 3.6;
    const USD_TO_ILS = 3.6;
    const EUR_TO_ILS = 3.9;
    
    if (settings.baseCurrency === 'ILS') {
      return cashBalances.ILS + (cashBalances.USD * USD_TO_ILS) + (cashBalances.EUR * EUR_TO_ILS);
    }
    return cashBalances.USD + (cashBalances.EUR * EUR_TO_USD) + (cashBalances.ILS * ILS_TO_USD);
  }, [cashBalances, settings.baseCurrency]);

  // Holdings value only (for weight calculations within holdings)
  const holdingsValue = useMemo(() => {
    return currentHoldings.reduce((sum, h) => sum + h.value, 0);
  }, [currentHoldings]);

  // Total Portfolio Value = NAV = Holdings + Cash (unified with Overview KPI)
  const totalPortfolioValue = useMemo(() => {
    return holdingsValue + totalCashValue;
  }, [holdingsValue, totalCashValue]);

  const totalCurrentWeight = useMemo(() => {
    return currentHoldings.reduce((sum, h) => sum + h.currentWeight, 0);
  }, [currentHoldings]);

  const totalTargetWeight = useMemo(() => {
    const holdingsWeight = currentHoldings.reduce((sum, h) => sum + h.targetWeight, 0);
    const newPosWeight = newPositions.reduce((sum, p) => sum + p.targetWeight, 0);
    return holdingsWeight + newPosWeight;
  }, [currentHoldings, newPositions]);

  const handleTargetChange = (ticker: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setManualTargets(prev => ({ ...prev, [ticker]: Math.max(0, Math.min(100, numValue)) }));
  };

  const handleAddNewPosition = () => {
    if (!newPositionTicker.trim() || !newPositionTarget) return;
    const targetWeight = parseFloat(newPositionTarget) || 0;
    if (targetWeight <= 0) return;

    setNewPositions(prev => [...prev, { 
      ticker: newPositionTicker.toUpperCase().trim(), 
      targetWeight: Math.min(100, targetWeight) 
    }]);
    setNewPositionTicker('');
    setNewPositionTarget('');
  };

  const handleRemoveNewPosition = (ticker: string) => {
    setNewPositions(prev => prev.filter(p => p.ticker !== ticker));
  };

  const handleReset = () => {
    setManualTargets({});
    setNewPositions([]);
    setShowAnalysis(false);
    setPolicyApplied(false);
    setEqualWeightApplied(false);
  };

  const handleEqualWeight = useCallback(() => {
    if (currentHoldings.length === 0) {
      toast({ title: 'No holdings to rebalance', variant: 'destructive' });
      return;
    }

    setLoadingEqualWeight(true);

    setTimeout(() => {
      const numHoldings = currentHoldings.length;
      const equalWeight = Math.floor((100 / numHoldings) * 100) / 100;
      
      const newTargets: Record<string, number> = {};
      let totalAssigned = 0;

      currentHoldings.forEach((h, index) => {
        if (index === currentHoldings.length - 1) {
          newTargets[h.ticker] = Math.round((100 - totalAssigned) * 100) / 100;
        } else {
          newTargets[h.ticker] = equalWeight;
          totalAssigned += equalWeight;
        }
      });

      setManualTargets(newTargets);
      setPolicyApplied(false);
      setEqualWeightApplied(true);
      setShowAnalysis(false);
      setLoadingEqualWeight(false);

      toast({
        title: 'Equal Weights Applied',
        description: `All ${numHoldings} holdings set to ~${equalWeight.toFixed(2)}% each.`
      });
    }, 150);
  }, [currentHoldings]);

  const handleUsePolicyWeights = useCallback(async () => {
    if (!user) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      return;
    }

    setLoadingPolicy(true);
    try {
      const { data: policy, error } = await supabase
        .from('investment_policies')
        .select('equity_min_pct, equity_max_pct, fixed_income_min_pct, fixed_income_max_pct, alternatives_min_pct, alternatives_max_pct, cash_min_pct')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!policy) {
        toast({
          title: 'No Investment Policy Found',
          description: 'Please define your investment policy in Settings first.',
          variant: 'destructive'
        });
        return;
      }

      const policyTargets: Record<string, number> = {
        equity: ((policy.equity_min_pct ?? 0) + (policy.equity_max_pct ?? 100)) / 2,
        fixed_income: ((policy.fixed_income_min_pct ?? 0) + (policy.fixed_income_max_pct ?? 100)) / 2,
        alternatives: ((policy.alternatives_min_pct ?? 0) + (policy.alternatives_max_pct ?? 100)) / 2,
        cash: policy.cash_min_pct ?? 0
      };

      const totalPolicyWeight = Object.values(policyTargets).reduce((a, b) => a + b, 0);
      if (totalPolicyWeight > 0 && totalPolicyWeight !== 100) {
        const scale = 100 / totalPolicyWeight;
        Object.keys(policyTargets).forEach(k => {
          policyTargets[k] *= scale;
        });
      }

      const holdingsByClass: Record<string, Holding[]> = {
        equity: [],
        fixed_income: [],
        alternatives: [],
        cash: []
      };

      currentHoldings.forEach(h => {
        const category = ASSET_TYPE_TO_CATEGORY[h.assetType] || 'alternatives';
        holdingsByClass[category].push(h);
      });

      const currentClassWeights: Record<string, number> = {
        equity: holdingsByClass.equity.reduce((sum, h) => sum + h.currentWeight, 0),
        fixed_income: holdingsByClass.fixed_income.reduce((sum, h) => sum + h.currentWeight, 0),
        alternatives: holdingsByClass.alternatives.reduce((sum, h) => sum + h.currentWeight, 0),
        cash: holdingsByClass.cash.reduce((sum, h) => sum + h.currentWeight, 0)
      };

      const newTargets: Record<string, number> = {};

      Object.entries(holdingsByClass).forEach(([category, holdings]) => {
        const targetClassWeight = policyTargets[category];
        const currentClassWeight = currentClassWeights[category];

        if (holdings.length === 0 || currentClassWeight === 0) return;

        holdings.forEach(h => {
          const proportionInClass = h.currentWeight / currentClassWeight;
          newTargets[h.ticker] = targetClassWeight * proportionInClass;
        });
      });

      setManualTargets(newTargets);
      setPolicyApplied(true);
      setShowAnalysis(false);

      toast({
        title: 'Policy Weights Applied',
        description: `Target allocations set: Equity ${policyTargets.equity.toFixed(0)}%, Fixed Income ${policyTargets.fixed_income.toFixed(0)}%, Alternatives ${policyTargets.alternatives.toFixed(0)}%, Cash ${policyTargets.cash.toFixed(0)}%`
      });
    } catch (err) {
      console.error('Error fetching policy:', err);
      toast({
        title: 'Error Loading Policy',
        description: 'Failed to fetch investment policy.',
        variant: 'destructive'
      });
    } finally {
      setLoadingPolicy(false);
    }
  }, [user, currentHoldings]);

  // Tax-optimized lot selection for a given sell amount
  const selectTaxOptimizedLots = useCallback((ticker: string, requiredSellValue: number): TaxOptimizedSell | null => {
    const lots = taxLotsByTicker[ticker.toUpperCase()];
    if (!lots || lots.length === 0) return null;

    const holding = currentHoldings.find(h => h.ticker.toUpperCase() === ticker.toUpperCase());
    if (!holding) return null;

    // Sort by real gain (lowest first for tax efficiency)
    const sortedLots = [...lots].sort((a, b) => a.realGain - b.realGain);
    
    let remainingValue = requiredSellValue;
    const selectedLots: TaxOptimizedSell['selectedLots'] = [];
    let totalProceeds = 0;
    let totalNominalGain = 0;
    let totalRealGain = 0;
    let totalInflationAdj = 0;
    let totalSharesSold = 0;

    for (const lot of sortedLots) {
      if (remainingValue <= 0) break;

      const lotValue = lot.currentValue;
      const valueTaken = Math.min(remainingValue, lotValue);
      const proportion = valueTaken / lotValue;
      // Round to whole shares - no fractional shares allowed
      const rawSharesSold = lot.quantity * proportion;
      const sharesSold = Math.round(rawSharesSold);
      
      // Skip if rounded to 0
      if (sharesSold === 0) continue;
      
      // Recalculate based on actual whole shares sold
      const actualProportion = sharesSold / lot.quantity;
      const actualProceeds = sharesSold * lot.currentPrice;
      const nominalGain = actualProportion * lot.nominalGain;
      const realGain = actualProportion * lot.realGain;
      const inflationAdj = actualProportion * lot.inflationAdjustment;
      const taxImpact = Math.max(0, realGain) * ISRAEL_CGT_RATE;

      selectedLots.push({
        purchaseDate: lot.purchaseDate,
        sharesSold,
        realGain,
        taxImpact,
        purchaseCPI: lot.purchaseCPI,
        currentCPI: lot.currentCPI,
      });

      totalProceeds += actualProceeds;
      totalNominalGain += nominalGain;
      totalRealGain += realGain;
      totalInflationAdj += inflationAdj;
      totalSharesSold += sharesSold;
      remainingValue -= actualProceeds;
    }

    const taxEstimate = Math.max(0, totalRealGain) * ISRAEL_CGT_RATE;

    return {
      ticker: ticker.toUpperCase(),
      assetName: holding.assetName,
      requiredSellValue,
      requiredSellShares: totalSharesSold,
      selectedLots,
      totalProceeds,
      totalNominalGain,
      totalRealGain,
      totalInflationAdjustment: totalInflationAdj,
      taxEstimate,
      netProceeds: totalProceeds - taxEstimate,
    };
  }, [taxLotsByTicker, currentHoldings]);

  // Unified Tax-Optimized Rebalance Analysis
  const analysis = useMemo((): RebalanceAnalysis | null => {
    if (!showAnalysis || totalPortfolioValue === 0) return null;

    const trades: SuggestedTrade[] = [];
    const taxOptimizedSells: TaxOptimizedSell[] = [];
    const warnings: string[] = [];
    let totalTurnover = 0;
    let cashImpact = 0;
    let totalTaxDue = 0;

    // Check if CPI data is available
    if (cpiError) {
      warnings.push(`CPI data warning: ${cpiError}`);
    }

    currentHoldings.forEach(h => {
      const weightDiff = h.targetWeight - h.currentWeight;
      const valueDiff = (weightDiff / 100) * totalPortfolioValue;
      
      if (Math.abs(weightDiff) >= minTradeSize) {
        const action = weightDiff > 0 ? 'BUY' : 'SELL';
        const rawQty = h.currentPrice > 0 ? Math.abs(valueDiff) / h.currentPrice : 0;
        // Round to whole shares - no fractional shares allowed
        const tradeQty = Math.round(rawQty);
        const tradeValue = tradeQty * h.currentPrice;

        // Skip if rounded quantity is 0
        if (tradeQty === 0) return;

        trades.push({
          ticker: h.ticker,
          assetName: h.assetName,
          action,
          quantity: tradeQty,
          value: tradeValue,
          weightChange: weightDiff
        });

        if (action === 'SELL') {
          const taxOptResult = selectTaxOptimizedLots(h.ticker, tradeValue);
          if (taxOptResult) {
            taxOptimizedSells.push(taxOptResult);
            totalTaxDue += taxOptResult.taxEstimate;
            cashImpact += taxOptResult.netProceeds;
          } else {
            warnings.push(`No tax lots found for ${h.ticker}`);
            cashImpact += tradeValue;
          }
        } else {
          cashImpact -= tradeValue;
        }

        totalTurnover += tradeValue;
      }
    });

    newPositions.forEach(np => {
      const targetValue = (np.targetWeight / 100) * totalPortfolioValue;
      
      if (np.targetWeight >= minTradeSize) {
        trades.push({
          ticker: np.ticker,
          assetName: `New: ${np.ticker}`,
          action: 'BUY',
          quantity: 0,
          value: targetValue,
          weightChange: np.targetWeight
        });

        totalTurnover += targetValue;
        cashImpact -= targetValue;
      }
    });

    trades.sort((a, b) => b.value - a.value);

    const beforeAllocation = currentHoldings.map(h => ({
      name: h.ticker,
      weight: h.currentWeight
    }));

    const afterAllocation = [
      ...currentHoldings.map(h => ({
        name: h.ticker,
        weight: h.targetWeight
      })),
      ...newPositions.map(np => ({
        name: np.ticker,
        weight: np.targetWeight
      }))
    ].filter(a => a.weight > 0);

    const weightChanges = currentHoldings.map(h => Math.abs(h.targetWeight - h.currentWeight));
    const avgWeightChange = weightChanges.length > 0 
      ? weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length 
      : 0;
    const trackingErrorImpact = avgWeightChange * 0.1;

    const targetsMet = warnings.length === 0 && Math.abs(totalTargetWeight - 100) < 0.5;
    const totalNetProceeds = taxOptimizedSells.reduce((sum, s) => sum + s.netProceeds, 0);

    return {
      trades,
      taxOptimizedSells,
      totalTurnover: totalTurnover / 2,
      numberOfTrades: trades.length,
      cashImpact,
      estimatedCost: (totalTurnover / 2) * 0.001,
      trackingErrorImpact,
      beforeAllocation,
      afterAllocation,
      totalTaxDue,
      totalNetProceeds,
      targetsMet,
      warnings
    };
  }, [showAnalysis, currentHoldings, newPositions, totalPortfolioValue, minTradeSize, selectTaxOptimizedLots, totalTargetWeight, cpiError]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatWeight = (value: number) => `${value.toFixed(2)}%`;

  if (!currentHoldings.length) {
    return (
      <Card className="bloomberg-panel">
        <CardHeader className="bloomberg-header">
          <CardTitle className="bloomberg-header-title flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Rebalance Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Add transactions and valuations to use the rebalance tool.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bloomberg-panel">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="bloomberg-header cursor-pointer hover:bg-secondary/50">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="bloomberg-header-title flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Rebalance Tool
                <Badge variant="outline" className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                  <Globe size={10} className="mr-1" />
                  Israeli Tax Rules
                </Badge>
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">
                {isOpen ? 'Click to collapse' : 'Click to expand'}
              </span>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-3 space-y-4">
            {/* Subtitle and Weight Buttons */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[10px] text-muted-foreground">
                Compare current vs. target allocation with integrated tax optimization (25% on CPI-adjusted real gains).
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEqualWeight}
                  disabled={loadingEqualWeight || currentHoldings.length === 0}
                  className="h-7 text-[10px] whitespace-nowrap"
                >
                  {loadingEqualWeight ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Equal className="h-3 w-3 mr-1" />
                  )}
                  Equal Weight
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUsePolicyWeights}
                  disabled={loadingPolicy}
                  className="h-7 text-[10px] whitespace-nowrap"
                >
                  {loadingPolicy ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  Use Policy Weights
                </Button>
              </div>
            </div>

            {/* Applied Weights Badge */}
            {policyApplied && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded text-[10px]">
                <FileText className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">
                  Investment Policy weights applied. Targets set by asset class.
                </span>
              </div>
            )}
            {equalWeightApplied && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded text-[10px]">
                <Equal className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">
                  Equal weights applied. All holdings set to {(100 / currentHoldings.length).toFixed(2)}% target.
                </span>
              </div>
            )}

            {/* Min Trade Size Setting */}
            <div className="flex items-center gap-4 p-2 bg-secondary/30 rounded">
              <Label className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                Min Trade Size
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={minTradeSize}
                  onChange={(e) => setMinTradeSize(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 h-7 text-xs font-mono bg-background"
                  step={0.1}
                  min={0}
                />
                <span className="text-[10px] text-muted-foreground">% of portfolio</span>
              </div>
            </div>

            {/* CPI Info */}
            {!cpiLoading && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[10px] bg-muted/30 px-3 py-2 rounded-md">
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} className="text-primary" />
                  <span>Current CPI: <strong className="text-foreground">{currentCPI.toFixed(1)}</strong></span>
                </div>
                <span className="hidden sm:inline text-muted-foreground/60">|</span>
                <span className="text-muted-foreground">
                  Data: {baseInfo.firstDate} → {baseInfo.lastDate}
                </span>
                <span className="hidden sm:inline text-muted-foreground/60">|</span>
                <span className={`${cpiError ? 'text-amber-400' : 'text-emerald-400'}`}>
                  Source: {cpiSource}
                </span>
                {cpiError && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle size={12} className="text-amber-400" />
                      </TooltipTrigger>
                      <TooltipContent>{cpiError}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Holdings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-2 text-muted-foreground">Ticker</th>
                    <th className="text-left p-2 text-muted-foreground">Asset</th>
                    <th className="text-right p-2 text-muted-foreground">Value</th>
                    <th className="text-right p-2 text-muted-foreground">Current %</th>
                    <th className="text-right p-2 text-muted-foreground">Target %</th>
                    <th className="text-right p-2 text-muted-foreground">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHoldings.map(h => {
                    const diff = h.targetWeight - h.currentWeight;
                    return (
                      <tr key={h.ticker} className="border-b border-border/30 hover:bg-secondary/20">
                        <td className="p-2 text-primary font-semibold">{h.ticker}</td>
                        <td className="p-2 text-foreground truncate max-w-[150px]">{h.assetName}</td>
                        <td className="p-2 text-right text-foreground">{formatCurrency(h.value)}</td>
                        <td className="p-2 text-right text-muted-foreground">{formatWeight(h.currentWeight)}</td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            value={h.targetWeight.toFixed(2)}
                            onChange={(e) => handleTargetChange(h.ticker, e.target.value)}
                            className="w-20 h-6 text-[10px] font-mono bg-background text-right"
                            step={0.5}
                            min={0}
                            max={100}
                          />
                        </td>
                        <td className={`p-2 text-right font-semibold ${
                          diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                  {/* New Positions */}
                  {newPositions.map(np => (
                    <tr key={`new-${np.ticker}`} className="border-b border-border/30 bg-primary/5">
                      <td className="p-2 text-primary font-semibold">{np.ticker}</td>
                      <td className="p-2 text-muted-foreground italic">New Position</td>
                      <td className="p-2 text-right text-muted-foreground">—</td>
                      <td className="p-2 text-right text-muted-foreground">0.00%</td>
                      <td className="p-2 text-right text-green-500 font-semibold">{formatWeight(np.targetWeight)}</td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNewPosition(np.ticker)}
                          className="h-5 w-5 p-0 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-semibold">
                    <td colSpan={2} className="p-2 text-muted-foreground">TOTAL</td>
                    <td className="p-2 text-right text-primary">{formatCurrency(totalPortfolioValue)}</td>
                    <td className="p-2 text-right text-foreground">{formatWeight(totalCurrentWeight)}</td>
                    <td className={`p-2 text-right ${
                      Math.abs(totalTargetWeight - 100) < 0.5 ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {formatWeight(totalTargetWeight)}
                    </td>
                    <td className="p-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Warning if weights don't sum to 100% */}
            {Math.abs(totalTargetWeight - 100) >= 0.5 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px]">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-500">
                  Target weights sum to {formatWeight(totalTargetWeight)} (should be 100%)
                </span>
              </div>
            )}

            {/* Add New Position */}
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded">
              <Input
                placeholder="Ticker"
                value={newPositionTicker}
                onChange={(e) => setNewPositionTicker(e.target.value.toUpperCase())}
                className="w-24 h-7 text-xs font-mono bg-background"
              />
              <Input
                type="number"
                placeholder="Target %"
                value={newPositionTarget}
                onChange={(e) => setNewPositionTarget(e.target.value)}
                className="w-24 h-7 text-xs font-mono bg-background"
                step={0.5}
                min={0}
                max={100}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddNewPosition}
                disabled={!newPositionTicker.trim() || !newPositionTarget}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {/* Single Action Button */}
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  setShowAnalysis(true);
                  if (firstProjectId && analysis) {
                    await logRebalanceActivity(firstProjectId, {
                      trades: analysis.trades.map(t => ({
                        ticker: t.ticker,
                        action: t.action,
                        value: t.value,
                        weightChange: t.weightChange
                      })),
                      totalTurnover: analysis.totalTurnover,
                      numberOfTrades: analysis.numberOfTrades,
                      cashImpact: analysis.cashImpact
                    });
                  }
                }}
                className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                disabled={Math.abs(totalTargetWeight - 100) >= 5 || cpiLoading}
              >
                {cpiLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Calculator className="h-3 w-3 mr-1" />
                )}
                Generate Tax-Optimized Rebalance
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-4 pt-4 border-t border-border">
                {/* Warnings */}
                {analysis.warnings.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px]">
                    <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      {analysis.warnings.map((w, i) => (
                        <p key={i} className="text-yellow-500">{w}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Trades</div>
                    <div className="text-sm font-mono font-semibold text-primary">{analysis.numberOfTrades}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Turnover</div>
                    <div className="text-sm font-mono font-semibold text-foreground">{formatCurrency(analysis.totalTurnover)}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Est. Cost</div>
                    <div className="text-sm font-mono font-semibold text-red-400">{formatCurrency(analysis.estimatedCost)}</div>
                  </div>
                  <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded">
                    <div className="text-[9px] text-blue-400 uppercase">Total Tax (25%)</div>
                    <div className="text-sm font-mono font-semibold text-blue-400">{formatCurrency(analysis.totalTaxDue)}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Net Cash</div>
                    <div className={`text-sm font-mono font-semibold ${
                      analysis.cashImpact >= 0 ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {analysis.cashImpact >= 0 ? '+' : ''}{formatCurrency(analysis.cashImpact)}
                    </div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Targets Met</div>
                    <div className={`text-sm font-mono font-semibold ${analysis.targetsMet ? 'text-green-500' : 'text-yellow-500'}`}>
                      {analysis.targetsMet ? 'Yes' : 'Partial'}
                    </div>
                  </div>
                </div>

                {/* Trade Execution Table */}
                {analysis.trades.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono text-muted-foreground mb-2 uppercase flex items-center gap-2">
                      Trade Execution
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[8px]">
                        Israeli CGT 25%
                      </Badge>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left p-2 text-muted-foreground">Action</th>
                            <th className="text-left p-2 text-muted-foreground">Ticker</th>
                            <th className="text-right p-2 text-muted-foreground">Target Δ</th>
                            <th className="text-right p-2 text-muted-foreground">Trade Value</th>
                            <th className="text-right p-2 text-muted-foreground">Real Gain</th>
                            <th className="text-right p-2 text-muted-foreground">Tax (25%)</th>
                            <th className="text-right p-2 text-muted-foreground">Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.trades.map((trade, i) => {
                            const taxData = analysis.taxOptimizedSells.find(s => s.ticker === trade.ticker.toUpperCase());
                            return (
                              <tr key={i} className="border-b border-border/30 hover:bg-secondary/20">
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                                    trade.action === 'BUY' 
                                      ? 'bg-green-500/20 text-green-500' 
                                      : 'bg-red-500/20 text-red-500'
                                  }`}>
                                    {trade.action}
                                  </span>
                                </td>
                                <td className="p-2 text-primary font-semibold">{trade.ticker}</td>
                                <td className={`p-2 text-right font-semibold ${
                                  trade.weightChange > 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {trade.weightChange > 0 ? '+' : ''}{trade.weightChange.toFixed(2)}%
                                </td>
                                <td className="p-2 text-right text-foreground">{formatCurrency(trade.value)}</td>
                                {trade.action === 'SELL' && taxData ? (
                                  <>
                                    <td className={`p-2 text-right ${taxData.totalRealGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {taxData.totalRealGain >= 0 ? '+' : ''}{formatCurrency(taxData.totalRealGain)}
                                    </td>
                                    <td className="p-2 text-right text-blue-400">
                                      {formatCurrency(taxData.taxEstimate)}
                                    </td>
                                    <td className="p-2 text-right text-foreground font-semibold">
                                      {formatCurrency(taxData.netProceeds)}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="p-2 text-right text-muted-foreground">—</td>
                                    <td className="p-2 text-right text-muted-foreground">—</td>
                                    <td className="p-2 text-right text-muted-foreground">
                                      {trade.action === 'BUY' ? `-${formatCurrency(trade.value)}` : '—'}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border font-semibold">
                            <td colSpan={3} className="p-2 text-muted-foreground">TOTAL</td>
                            <td className="p-2 text-right text-foreground">{formatCurrency(analysis.totalTurnover * 2)}</td>
                            <td className="p-2 text-right text-emerald-400">
                              {formatCurrency(analysis.taxOptimizedSells.reduce((sum, s) => sum + s.totalRealGain, 0))}
                            </td>
                            <td className="p-2 text-right text-blue-400">{formatCurrency(analysis.totalTaxDue)}</td>
                            <td className="p-2 text-right text-foreground">{formatCurrency(analysis.totalNetProceeds)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tax Lot Selection Details */}
                {analysis.taxOptimizedSells.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-2">
                      Tax Lot Selection Details
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={12} className="text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="text-xs">Lots selected to minimize Israeli CGT (25% on real gains). Losses and low-gain lots sold first.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    {analysis.taxOptimizedSells.map((sell) => (
                      <div key={sell.ticker} className="p-3 bg-secondary/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{sell.ticker}</span>
                          <div className="flex items-center gap-4 text-[10px]">
                            <span className="text-muted-foreground">
                              Sell: <span className="text-foreground">{sell.requiredSellShares.toFixed(2)} shares</span>
                            </span>
                            <span className="text-muted-foreground">
                              Proceeds: <span className="text-foreground">{formatCurrency(sell.totalProceeds)}</span>
                            </span>
                            <span className="text-blue-400">
                              Tax: {formatCurrency(sell.taxEstimate)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[9px] font-mono">
                            <thead>
                              <tr className="border-b border-border/30">
                                <th className="text-left p-1 text-muted-foreground">Purchase Date</th>
                                <th className="text-right p-1 text-muted-foreground">Shares Sold</th>
                                <th className="text-right p-1 text-muted-foreground">Real Gain</th>
                                <th className="text-right p-1 text-muted-foreground">Tax (25%)</th>
                                <th className="text-center p-1 text-muted-foreground">CPI Adj.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sell.selectedLots.map((lot, idx) => (
                                <tr key={idx} className="border-b border-border/20">
                                  <td className="p-1">{format(parseISO(lot.purchaseDate), 'MMM d, yyyy')}</td>
                                  <td className="p-1 text-right">{lot.sharesSold.toFixed(2)}</td>
                                  <td className={`p-1 text-right ${lot.realGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {lot.realGain >= 0 ? '+' : ''}{formatCurrency(lot.realGain)}
                                  </td>
                                  <td className="p-1 text-right text-blue-400">{formatCurrency(lot.taxImpact)}</td>
                                  <td className="p-1 text-center">
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px]">
                                      +{((lot.currentCPI / lot.purchaseCPI - 1) * 100).toFixed(1)}%
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {analysis.trades.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground text-xs">
                    No trades required. Portfolio is already at target weights (within {minTradeSize}% tolerance).
                  </div>
                )}

                {/* Israeli Tax Rules Info */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Israeli CGT Rules:</strong> Tax is calculated at 25% on real gains only. 
                    Cost basis is adjusted for inflation using CBS CPI data.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Real Gain</strong> = Sale Price − (Purchase Price × Current CPI ÷ Purchase CPI)
                  </p>
                </div>

                {/* Tracking Error Impact */}
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-[10px]">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Estimated Tracking Error Impact: <span className="text-primary font-semibold">{analysis.trackingErrorImpact.toFixed(3)}%</span>
                  </span>
                </div>

                {/* Export PDF Button */}
                <Button
                  onClick={async () => {
                    setIsExportingPdf(true);
                    try {
                      // Small delay to show animation
                      await new Promise(resolve => setTimeout(resolve, 300));
                      generateRebalanceReport({
                        analysis,
                        currentHoldings,
                        totalPortfolioValue,
                        minTradeSize,
                        cpiInfo: {
                          currentCPI,
                          source: cpiSource,
                          firstDate: baseInfo.firstDate,
                          lastDate: baseInfo.lastDate,
                          error: cpiError || undefined,
                        },
                        policyApplied,
                        equalWeightApplied,
                      });
                      toast({
                        title: 'PDF Report Generated',
                        description: 'Rebalance execution report downloaded successfully.',
                      });
                    } catch (err) {
                      console.error('PDF generation error:', err);
                      toast({
                        title: 'PDF Generation Failed',
                        description: 'There was an error generating the report.',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  disabled={isExportingPdf}
                  className="w-full h-9 text-xs bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2 transition-transform group-hover:translate-y-0.5" />
                  )}
                  {isExportingPdf ? 'Generating Report...' : 'Export PDF Execution Report'}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
