import { useState, useMemo, useCallback, useEffect } from 'react';
import { Scale, TrendingUp, TrendingDown, AlertCircle, Plus, Trash2, RefreshCw, ArrowRight, BarChart3, FileText, Loader2, Equal, Calculator, Globe, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useIsraelCPI } from '@/hooks/useIsraelCPI';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { differenceInDays, parseISO, format } from 'date-fns';

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

interface TaxOptimizedRebalanceAnalysis {
  trades: SuggestedTrade[];
  taxOptimizedSells: TaxOptimizedSell[];
  totalTurnover: number;
  numberOfTrades: number;
  cashImpact: number;
  estimatedCost: number;
  trackingErrorImpact: number;
  beforeAllocation: { name: string; weight: number }[];
  afterAllocation: { name: string; weight: number }[];
  // Tax totals
  totalTaxDue: number;
  totalNetProceeds: number;
  postTaxAllocation: { name: string; weight: number }[];
  targetsMet: boolean;
  warnings: string[];
}

interface InvestmentPolicy {
  equity_min_pct: number | null;
  equity_max_pct: number | null;
  fixed_income_min_pct: number | null;
  fixed_income_max_pct: number | null;
  alternatives_min_pct: number | null;
  alternatives_max_pct: number | null;
  cash_min_pct: number | null;
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

const COLORS = [
  'hsl(30, 100%, 50%)',    // Primary orange
  'hsl(210, 100%, 55%)',   // Blue
  'hsl(120, 60%, 40%)',    // Green
  'hsl(280, 70%, 55%)',    // Purple
  'hsl(45, 100%, 50%)',    // Gold/Yellow
  'hsl(350, 75%, 55%)',    // Red/Pink
  'hsl(180, 70%, 45%)',    // Teal
  'hsl(0, 0%, 60%)',       // Gray
  'hsl(320, 70%, 50%)',    // Magenta
  'hsl(15, 90%, 55%)',     // Coral
];

export function RebalanceTool() {
  const { transactions, valuations, performanceMetrics } = usePortfolio();
  const { user } = useAuth();
  const { logRebalanceActivity } = useActivityLog();
  const { getCPI, getCurrentCPI, getBaseInfo, isLoading: cpiLoading, error: cpiError, source: cpiSource } = useIsraelCPI();
  
  const [isOpen, setIsOpen] = useState(true);
  const [minTradeSize, setMinTradeSize] = useState(0.5);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTaxOptimizedAnalysis, setShowTaxOptimizedAnalysis] = useState(false);
  const [newPositionTicker, setNewPositionTicker] = useState('');
  const [newPositionTarget, setNewPositionTarget] = useState('');
  const [manualTargets, setManualTargets] = useState<Record<string, number>>({});
  const [newPositions, setNewPositions] = useState<{ ticker: string; targetWeight: number }[]>([]);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [loadingEqualWeight, setLoadingEqualWeight] = useState(false);
  const [policyApplied, setPolicyApplied] = useState(false);
  const [equalWeightApplied, setEqualWeightApplied] = useState(false);
  const [firstProjectId, setFirstProjectId] = useState<string | null>(null);

  const currentCPI = useMemo(() => getCurrentCPI(), [getCurrentCPI]);

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

    // Calculate net positions
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

    // Get latest valuations
    valuations.forEach(v => {
      if (positions[v.ticker]) {
        positions[v.ticker].latestPrice = v.pricePerUnit;
      }
    });

    // Filter out zero positions and calculate values
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

  const totalPortfolioValue = useMemo(() => {
    return currentHoldings.reduce((sum, h) => sum + h.value, 0);
  }, [currentHoldings]);

  const totalCurrentWeight = useMemo(() => {
    return currentHoldings.reduce((sum, h) => sum + h.currentWeight, 0);
  }, [currentHoldings]);

  const totalTargetWeight = useMemo(() => {
    const holdingsWeight = currentHoldings.reduce((sum, h) => sum + h.targetWeight, 0);
    const newPosWeight = newPositions.reduce((sum, p) => sum + p.targetWeight, 0);
    return holdingsWeight + newPosWeight;
  }, [currentHoldings, newPositions]);

  // Update target weight
  const handleTargetChange = (ticker: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setManualTargets(prev => ({ ...prev, [ticker]: Math.max(0, Math.min(100, numValue)) }));
  };

  // Add new position
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

  // Remove new position
  const handleRemoveNewPosition = (ticker: string) => {
    setNewPositions(prev => prev.filter(p => p.ticker !== ticker));
  };

  // Reset to current weights
  const handleReset = () => {
    setManualTargets({});
    setNewPositions([]);
    setShowAnalysis(false);
    setShowTaxOptimizedAnalysis(false);
    setPolicyApplied(false);
    setEqualWeightApplied(false);
  };

  // Apply equal weight distribution
  const handleEqualWeight = useCallback(() => {
    if (currentHoldings.length === 0) {
      toast({ title: 'No holdings to rebalance', variant: 'destructive' });
      return;
    }

    setLoadingEqualWeight(true);

    // Small timeout for visual feedback
    setTimeout(() => {
      const numHoldings = currentHoldings.length;
      const equalWeight = Math.floor((100 / numHoldings) * 100) / 100; // Round down to 2 decimals
      
      const newTargets: Record<string, number> = {};
      let totalAssigned = 0;

      // Assign equal weight to all holdings except the last one
      currentHoldings.forEach((h, index) => {
        if (index === currentHoldings.length - 1) {
          // Last holding gets the remainder to ensure exactly 100%
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
      setShowTaxOptimizedAnalysis(false);
      setLoadingEqualWeight(false);

      toast({
        title: 'Equal Weights Applied',
        description: `All ${numHoldings} holdings set to ~${equalWeight.toFixed(2)}% each.`
      });
    }, 150);
  }, [currentHoldings]);

  // Fetch and apply policy weights
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

      if (error) {
        throw error;
      }

      if (!policy) {
        toast({
          title: 'No Investment Policy Found',
          description: 'Please define your investment policy in Settings first.',
          variant: 'destructive'
        });
        return;
      }

      // Calculate target weights for each asset class using midpoint of min/max
      const policyTargets: Record<string, number> = {
        equity: ((policy.equity_min_pct ?? 0) + (policy.equity_max_pct ?? 100)) / 2,
        fixed_income: ((policy.fixed_income_min_pct ?? 0) + (policy.fixed_income_max_pct ?? 100)) / 2,
        alternatives: ((policy.alternatives_min_pct ?? 0) + (policy.alternatives_max_pct ?? 100)) / 2,
        cash: policy.cash_min_pct ?? 0
      };

      // Normalize to sum to 100%
      const totalPolicyWeight = Object.values(policyTargets).reduce((a, b) => a + b, 0);
      if (totalPolicyWeight > 0 && totalPolicyWeight !== 100) {
        const scale = 100 / totalPolicyWeight;
        Object.keys(policyTargets).forEach(k => {
          policyTargets[k] *= scale;
        });
      }

      // Group current holdings by asset class
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

      // Calculate current weight per class
      const currentClassWeights: Record<string, number> = {
        equity: holdingsByClass.equity.reduce((sum, h) => sum + h.currentWeight, 0),
        fixed_income: holdingsByClass.fixed_income.reduce((sum, h) => sum + h.currentWeight, 0),
        alternatives: holdingsByClass.alternatives.reduce((sum, h) => sum + h.currentWeight, 0),
        cash: holdingsByClass.cash.reduce((sum, h) => sum + h.currentWeight, 0)
      };

      // Distribute policy target weights proportionally within each class
      const newTargets: Record<string, number> = {};

      Object.entries(holdingsByClass).forEach(([category, holdings]) => {
        const targetClassWeight = policyTargets[category];
        const currentClassWeight = currentClassWeights[category];

        if (holdings.length === 0 || currentClassWeight === 0) return;

        // Distribute proportionally based on current weight within class
        holdings.forEach(h => {
          const proportionInClass = h.currentWeight / currentClassWeight;
          newTargets[h.ticker] = targetClassWeight * proportionInClass;
        });
      });

      setManualTargets(newTargets);
      setPolicyApplied(true);
      setShowAnalysis(false);
      setShowTaxOptimizedAnalysis(false);

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
      const sharesSold = lot.quantity * proportion;
      
      const proceeds = valueTaken;
      const nominalGain = proportion * lot.nominalGain;
      const realGain = proportion * lot.realGain;
      const inflationAdj = proportion * lot.inflationAdjustment;
      const taxImpact = Math.max(0, realGain) * ISRAEL_CGT_RATE;

      selectedLots.push({
        purchaseDate: lot.purchaseDate,
        sharesSold,
        realGain,
        taxImpact,
        purchaseCPI: lot.purchaseCPI,
        currentCPI: lot.currentCPI,
      });

      totalProceeds += proceeds;
      totalNominalGain += nominalGain;
      totalRealGain += realGain;
      totalInflationAdj += inflationAdj;
      totalSharesSold += sharesSold;
      remainingValue -= valueTaken;
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

  // Calculate tax-optimized rebalance analysis
  const taxOptimizedAnalysis = useMemo((): TaxOptimizedRebalanceAnalysis | null => {
    if (!showTaxOptimizedAnalysis || totalPortfolioValue === 0) return null;

    const trades: SuggestedTrade[] = [];
    const taxOptimizedSells: TaxOptimizedSell[] = [];
    const warnings: string[] = [];
    let totalTurnover = 0;
    let cashImpact = 0;
    let totalTaxDue = 0;

    // Calculate trades for existing holdings
    currentHoldings.forEach(h => {
      const weightDiff = h.targetWeight - h.currentWeight;
      const valueDiff = (weightDiff / 100) * totalPortfolioValue;
      
      // Apply min trade size filter
      if (Math.abs(weightDiff) >= minTradeSize) {
        const action = weightDiff > 0 ? 'BUY' : 'SELL';
        const tradeValue = Math.abs(valueDiff);
        const tradeQty = h.currentPrice > 0 ? tradeValue / h.currentPrice : 0;

        trades.push({
          ticker: h.ticker,
          assetName: h.assetName,
          action,
          quantity: Math.round(tradeQty * 1000) / 1000,
          value: tradeValue,
          weightChange: weightDiff
        });

        // For SELL actions, apply tax optimization
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

    // Calculate trades for new positions
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

    // Sort trades by absolute value
    trades.sort((a, b) => b.value - a.value);

    // Calculate before/after allocations
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

    // Post-tax allocation (accounting for tax drag on sells)
    const totalNetProceeds = taxOptimizedSells.reduce((sum, s) => sum + s.netProceeds, 0);
    const postTaxAllocation = afterAllocation.map(a => ({
      name: a.name,
      weight: a.weight
    }));

    // Estimate tracking error impact
    const weightChanges = currentHoldings.map(h => Math.abs(h.targetWeight - h.currentWeight));
    const avgWeightChange = weightChanges.length > 0 
      ? weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length 
      : 0;
    const trackingErrorImpact = avgWeightChange * 0.1;

    // Check if targets can be fully met
    const targetsMet = warnings.length === 0 && Math.abs(totalTargetWeight - 100) < 0.5;

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
      postTaxAllocation,
      targetsMet,
      warnings
    };
  }, [showTaxOptimizedAnalysis, currentHoldings, newPositions, totalPortfolioValue, minTradeSize, selectTaxOptimizedLots, totalTargetWeight]);

  // Standard analysis (without tax optimization)
  const analysis = useMemo(() => {
    if (!showAnalysis || totalPortfolioValue === 0) return null;

    const trades: SuggestedTrade[] = [];
    let totalTurnover = 0;
    let cashImpact = 0;

    currentHoldings.forEach(h => {
      const weightDiff = h.targetWeight - h.currentWeight;
      const valueDiff = (weightDiff / 100) * totalPortfolioValue;
      
      if (Math.abs(weightDiff) >= minTradeSize) {
        const action = weightDiff > 0 ? 'BUY' : 'SELL';
        const tradeValue = Math.abs(valueDiff);
        const tradeQty = h.currentPrice > 0 ? tradeValue / h.currentPrice : 0;

        trades.push({
          ticker: h.ticker,
          assetName: h.assetName,
          action,
          quantity: Math.round(tradeQty * 1000) / 1000,
          value: tradeValue,
          weightChange: weightDiff
        });

        totalTurnover += tradeValue;
        cashImpact -= valueDiff;
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

    return {
      trades,
      totalTurnover: totalTurnover / 2,
      numberOfTrades: trades.length,
      cashImpact,
      estimatedCost: (totalTurnover / 2) * 0.001,
      trackingErrorImpact,
      beforeAllocation,
      afterAllocation
    };
  }, [showAnalysis, currentHoldings, newPositions, totalPortfolioValue, minTradeSize]);

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
                  Tax-Optimized
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
                Compare current vs. target allocation and generate tax-optimized trades.
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
                <span className={`${cpiError ? 'text-amber-400' : 'text-emerald-400'}`}>
                  Source: {cpiSource}
                </span>
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

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={async () => {
                  setShowAnalysis(true);
                  setShowTaxOptimizedAnalysis(false);
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
                variant="outline"
                className="flex-1 h-8 text-xs"
                disabled={Math.abs(totalTargetWeight - 100) >= 5}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Generate Analysis
              </Button>
              <Button
                onClick={async () => {
                  setShowTaxOptimizedAnalysis(true);
                  setShowAnalysis(false);
                  if (firstProjectId && taxOptimizedAnalysis) {
                    await logRebalanceActivity(firstProjectId, {
                      trades: taxOptimizedAnalysis.trades.map(t => ({
                        ticker: t.ticker,
                        action: t.action,
                        value: t.value,
                        weightChange: t.weightChange
                      })),
                      totalTurnover: taxOptimizedAnalysis.totalTurnover,
                      numberOfTrades: taxOptimizedAnalysis.numberOfTrades,
                      cashImpact: taxOptimizedAnalysis.cashImpact
                    });
                  }
                }}
                className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                disabled={Math.abs(totalTargetWeight - 100) >= 5 || cpiLoading}
              >
                <Calculator className="h-3 w-3 mr-1" />
                Tax-Optimized Rebalance
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

            {/* Standard Analysis Results */}
            {analysis && showAnalysis && (
              <div className="space-y-4 pt-4 border-t border-border">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Trades</div>
                    <div className="text-sm font-mono font-semibold text-primary">{analysis.numberOfTrades}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Turnover</div>
                    <div className="text-sm font-mono font-semibold text-foreground">{formatCurrency(analysis.totalTurnover)}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Turnover %</div>
                    <div className="text-sm font-mono font-semibold text-foreground">
                      {((analysis.totalTurnover / totalPortfolioValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Est. Cost</div>
                    <div className="text-sm font-mono font-semibold text-red-400">{formatCurrency(analysis.estimatedCost)}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Cash Impact</div>
                    <div className={`text-sm font-mono font-semibold ${
                      analysis.cashImpact >= 0 ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {analysis.cashImpact >= 0 ? '+' : ''}{formatCurrency(analysis.cashImpact)}
                    </div>
                  </div>
                </div>

                {/* Trade List */}
                {analysis.trades.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono text-muted-foreground mb-2 uppercase">Suggested Trades</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left p-2 text-muted-foreground">Action</th>
                            <th className="text-left p-2 text-muted-foreground">Ticker</th>
                            <th className="text-left p-2 text-muted-foreground">Asset</th>
                            <th className="text-right p-2 text-muted-foreground">Qty</th>
                            <th className="text-right p-2 text-muted-foreground">Value</th>
                            <th className="text-right p-2 text-muted-foreground">Weight Δ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.trades.map((trade, i) => (
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
                              <td className="p-2 text-foreground truncate max-w-[120px]">{trade.assetName}</td>
                              <td className="p-2 text-right text-foreground">
                                {trade.quantity > 0 ? trade.quantity.toLocaleString() : '—'}
                              </td>
                              <td className="p-2 text-right text-foreground">{formatCurrency(trade.value)}</td>
                              <td className={`p-2 text-right font-semibold ${
                                trade.weightChange > 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {trade.weightChange > 0 ? '+' : ''}{trade.weightChange.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {analysis.trades.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground text-xs">
                    No trades required. Portfolio is already at target weights (within {minTradeSize}% tolerance).
                  </div>
                )}
              </div>
            )}

            {/* Tax-Optimized Analysis Results */}
            {taxOptimizedAnalysis && showTaxOptimizedAnalysis && (
              <div className="space-y-4 pt-4 border-t border-border">
                {/* Warnings */}
                {taxOptimizedAnalysis.warnings.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px]">
                    <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      {taxOptimizedAnalysis.warnings.map((w, i) => (
                        <p key={i} className="text-yellow-500">{w}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary KPIs with Tax */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Trades</div>
                    <div className="text-sm font-mono font-semibold text-primary">{taxOptimizedAnalysis.numberOfTrades}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Turnover</div>
                    <div className="text-sm font-mono font-semibold text-foreground">{formatCurrency(taxOptimizedAnalysis.totalTurnover)}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Est. Cost</div>
                    <div className="text-sm font-mono font-semibold text-red-400">{formatCurrency(taxOptimizedAnalysis.estimatedCost)}</div>
                  </div>
                  <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded">
                    <div className="text-[9px] text-blue-400 uppercase">Total Tax (25%)</div>
                    <div className="text-sm font-mono font-semibold text-blue-400">{formatCurrency(taxOptimizedAnalysis.totalTaxDue)}</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Net Cash</div>
                    <div className={`text-sm font-mono font-semibold ${
                      taxOptimizedAnalysis.cashImpact >= 0 ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {taxOptimizedAnalysis.cashImpact >= 0 ? '+' : ''}{formatCurrency(taxOptimizedAnalysis.cashImpact)}
                    </div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <div className="text-[9px] text-muted-foreground uppercase">Targets Met</div>
                    <div className={`text-sm font-mono font-semibold ${taxOptimizedAnalysis.targetsMet ? 'text-green-500' : 'text-yellow-500'}`}>
                      {taxOptimizedAnalysis.targetsMet ? 'Yes' : 'Partial'}
                    </div>
                  </div>
                </div>

                {/* Unified Trade & Tax Execution Table */}
                {taxOptimizedAnalysis.trades.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono text-muted-foreground mb-2 uppercase flex items-center gap-2">
                      Tax-Optimized Trade Execution
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
                          {taxOptimizedAnalysis.trades.map((trade, i) => {
                            const taxData = taxOptimizedAnalysis.taxOptimizedSells.find(s => s.ticker === trade.ticker.toUpperCase());
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
                                    <td className="p-2 text-right text-muted-foreground">—</td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border font-semibold">
                            <td colSpan={3} className="p-2 text-muted-foreground">TOTAL</td>
                            <td className="p-2 text-right text-foreground">{formatCurrency(taxOptimizedAnalysis.totalTurnover * 2)}</td>
                            <td className="p-2 text-right text-emerald-400">
                              {formatCurrency(taxOptimizedAnalysis.taxOptimizedSells.reduce((sum, s) => sum + s.totalRealGain, 0))}
                            </td>
                            <td className="p-2 text-right text-blue-400">{formatCurrency(taxOptimizedAnalysis.totalTaxDue)}</td>
                            <td className="p-2 text-right text-foreground">{formatCurrency(taxOptimizedAnalysis.totalNetProceeds)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tax Lot Details (Expandable) */}
                {taxOptimizedAnalysis.taxOptimizedSells.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono text-muted-foreground uppercase">Tax Lot Selection Details</h4>
                    {taxOptimizedAnalysis.taxOptimizedSells.map((sell) => (
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

                {/* Israeli Tax Rules Info */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Israeli CGT Rules:</strong> Tax is calculated at 25% on real gains only. 
                    Cost basis is adjusted for inflation using CBS CPI data.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Tax-Optimized Selection:</strong> Lots are selected to minimize real gains (losses first, then lowest gains).
                  </p>
                </div>

                {taxOptimizedAnalysis.trades.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground text-xs">
                    No trades required. Portfolio is already at target weights (within {minTradeSize}% tolerance).
                  </div>
                )}

                {/* Tracking Error Impact */}
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-[10px]">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Estimated Tracking Error Impact: <span className="text-primary font-semibold">{taxOptimizedAnalysis.trackingErrorImpact.toFixed(3)}%</span>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
