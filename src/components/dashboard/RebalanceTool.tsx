import { useState, useMemo, useCallback } from 'react';
import { Scale, TrendingUp, TrendingDown, AlertCircle, Plus, Trash2, RefreshCw, ArrowRight, BarChart3, FileText, Loader2, Equal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

interface RebalanceAnalysis {
  trades: SuggestedTrade[];
  totalTurnover: number;
  numberOfTrades: number;
  cashImpact: number;
  estimatedCost: number;
  trackingErrorImpact: number;
  beforeAllocation: { name: string; weight: number }[];
  afterAllocation: { name: string; weight: number }[];
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

  // Calculate rebalance analysis
  const analysis = useMemo((): RebalanceAnalysis | null => {
    if (!showAnalysis || totalPortfolioValue === 0) return null;

    const trades: SuggestedTrade[] = [];
    let totalTurnover = 0;
    let cashImpact = 0;

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
          quantity: Math.round(tradeQty * 1000) / 1000, // Round to 3 decimals
          value: tradeValue,
          weightChange: weightDiff
        });

        totalTurnover += tradeValue;
        cashImpact -= valueDiff; // Negative for buys, positive for sells
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
          quantity: 0, // Unknown without price
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

    // Estimate tracking error impact (simplified)
    const weightChanges = currentHoldings.map(h => Math.abs(h.targetWeight - h.currentWeight));
    const avgWeightChange = weightChanges.length > 0 
      ? weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length 
      : 0;
    const trackingErrorImpact = avgWeightChange * 0.1; // Simplified estimate

    return {
      trades,
      totalTurnover: totalTurnover / 2, // One-way turnover
      numberOfTrades: trades.length,
      cashImpact,
      estimatedCost: (totalTurnover / 2) * 0.001, // 0.1% transaction cost
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
                Compare current vs. target allocation and generate suggested trades.
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
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAnalysis(true)}
                className="flex-1 h-8 text-xs"
                disabled={Math.abs(totalTargetWeight - 100) >= 5}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Generate Analysis
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

                {/* Before/After Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="p-3 bg-secondary/20 rounded">
                    <h4 className="text-[10px] font-mono text-muted-foreground mb-2 uppercase">Current Allocation</h4>
                    <div className="flex items-start gap-3">
                      <div className="h-[120px] w-[120px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analysis.beforeAllocation}
                              dataKey="weight"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={50}
                              innerRadius={25}
                            >
                              {analysis.beforeAllocation.map((_, index) => (
                                <Cell key={`before-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => `${value.toFixed(2)}%`}
                              contentStyle={{ 
                                backgroundColor: 'hsl(0 0% 13%)',
                                border: '1px solid hsl(0 0% 22%)',
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-mono">
                        {analysis.beforeAllocation.slice(0, 12).map((item, index) => (
                          <div key={item.name} className="flex items-center gap-1 truncate">
                            <span 
                              className="w-2 h-2 rounded-sm flex-shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-muted-foreground truncate">{item.name}</span>
                            <span className="text-foreground ml-auto">{item.weight.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* After */}
                  <div className="p-3 bg-secondary/20 rounded">
                    <h4 className="text-[10px] font-mono text-muted-foreground mb-2 uppercase">Target Allocation</h4>
                    <div className="flex items-start gap-3">
                      <div className="h-[120px] w-[120px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analysis.afterAllocation}
                              dataKey="weight"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={50}
                              innerRadius={25}
                            >
                              {analysis.afterAllocation.map((_, index) => (
                                <Cell key={`after-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => `${value.toFixed(2)}%`}
                              contentStyle={{ 
                                backgroundColor: 'hsl(0 0% 13%)',
                                border: '1px solid hsl(0 0% 22%)',
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-mono">
                        {analysis.afterAllocation.slice(0, 12).map((item, index) => (
                          <div key={item.name} className="flex items-center gap-1 truncate">
                            <span 
                              className="w-2 h-2 rounded-sm flex-shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-muted-foreground truncate">{item.name}</span>
                            <span className="text-foreground ml-auto">{item.weight.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weight Changes Bar Chart */}
                <div className="p-3 bg-secondary/20 rounded">
                  <h4 className="text-[10px] font-mono text-muted-foreground mb-2 uppercase">Weight Changes</h4>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={currentHoldings.map(h => ({
                          name: h.ticker,
                          change: h.targetWeight - h.currentWeight
                        })).filter(d => Math.abs(d.change) >= minTradeSize)}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number" 
                          tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name"
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          width={50}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Change']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--secondary))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}
                        />
                        <Bar dataKey="change">
                          {currentHoldings.map((h, index) => {
                            const change = h.targetWeight - h.currentWeight;
                            return (
                              <Cell 
                                key={`bar-${index}`} 
                                fill={change > 0 ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(0 84.2% 60.2%)'}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
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

                {/* Tracking Error Impact */}
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-[10px]">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Estimated Tracking Error Impact: <span className="text-primary font-semibold">{analysis.trackingErrorImpact.toFixed(3)}%</span>
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
