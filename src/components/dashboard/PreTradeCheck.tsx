import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AssetType, Geography } from '@/types/investment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface PreTradeAnalysis {
  classification: string;
  findings: string[];
  recommendations: string[];
  fullAnalysis: string;
}

interface ProposedTrade {
  ticker: string;
  assetName: string;
  assetType: AssetType;
  geography: Geography;
  transactionType: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
}

const ASSET_TYPES: AssetType[] = ['equity', 'bond', 'commodity', 'crypto', 'real_estate', 'cash', 'alternative', 'etf', 'mutual_fund', 'private_equity', 'private_debt', 'hedge_fund'];
const GEOGRAPHIES: Geography[] = ['north_america', 'europe', 'asia_pacific', 'emerging_markets', 'global', 'other'];

const emptyTrade: ProposedTrade = {
  ticker: '',
  assetName: '',
  assetType: 'equity',
  geography: 'north_america',
  transactionType: 'buy',
  quantity: 0,
  pricePerUnit: 0,
};

export function PreTradeCheck() {
  const { user } = useAuth();
  const { transactions, valuations, cashBalances } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [trade, setTrade] = useState<ProposedTrade>(emptyTrade);
  const [analysis, setAnalysis] = useState<PreTradeAnalysis | null>(null);

  const getClassificationConfig = (classification: string) => {
    if (classification.includes('APPROVED - Trade Compliant') || classification.includes('Feasible & Suitable')) {
      return { color: 'bg-success text-success-foreground', icon: CheckCircle2, label: 'APPROVED' };
    }
    if (classification.includes('APPROVED WITH CAUTION') || classification.includes('Feasible but Not')) {
      return { color: 'bg-warning text-warning-foreground', icon: AlertTriangle, label: 'CAUTION' };
    }
    if (classification.includes('REJECTED') || classification.includes('Not Feasible')) {
      return { color: 'bg-destructive text-destructive-foreground', icon: XCircle, label: 'REJECTED' };
    }
    return { color: 'bg-muted text-muted-foreground', icon: AlertTriangle, label: 'REVIEW' };
  };

  const buildPortfolioSummary = () => {
    const holdingsMap = new Map<string, {
      ticker: string;
      assetName: string;
      assetType: string;
      geography: string;
      quantity: number;
      latestPrice: number;
    }>();

    transactions.forEach(tx => {
      const existing = holdingsMap.get(tx.ticker);
      const qty = tx.transactionType === 'buy' ? tx.quantity : -tx.quantity;
      
      if (existing) {
        existing.quantity += qty;
      } else {
        holdingsMap.set(tx.ticker, {
          ticker: tx.ticker,
          assetName: tx.assetName,
          assetType: tx.assetType,
          geography: tx.geography,
          quantity: qty,
          latestPrice: tx.pricePerUnit,
        });
      }
    });

    valuations.forEach(val => {
      const holding = holdingsMap.get(val.ticker);
      if (holding) {
        holding.latestPrice = val.pricePerUnit;
      }
    });

    const holdings = Array.from(holdingsMap.values())
      .filter(h => h.quantity > 0)
      .map(h => ({
        ...h,
        value: h.quantity * h.latestPrice,
      }));

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalCash = (cashBalances?.USD || 0) + (cashBalances?.EUR || 0) + (cashBalances?.ILS || 0) * 0.27;
    const portfolioTotal = totalValue + totalCash;

    const allocationByAssetType: Record<string, number> = {};
    const allocationByGeography: Record<string, number> = {};

    holdings.forEach(h => {
      const weight = portfolioTotal > 0 ? (h.value / portfolioTotal) * 100 : 0;
      
      let category = 'other';
      if (['equity', 'etf', 'mutual_fund'].includes(h.assetType)) {
        category = 'equity';
      } else if (['bond'].includes(h.assetType)) {
        category = 'fixed_income';
      } else if (['private_equity', 'private_debt', 'hedge_fund', 'real_estate', 'alternative'].includes(h.assetType)) {
        category = 'alternatives';
      } else if (['commodity', 'crypto'].includes(h.assetType)) {
        category = h.assetType;
      }

      allocationByAssetType[category] = (allocationByAssetType[category] || 0) + weight;
      allocationByGeography[h.geography] = (allocationByGeography[h.geography] || 0) + weight;
    });

    const cashPct = portfolioTotal > 0 ? (totalCash / portfolioTotal) * 100 : 0;
    if (cashPct > 0) {
      allocationByAssetType['cash'] = cashPct;
    }

    const topPositions = holdings
      .map(h => ({
        ticker: h.ticker,
        weight: portfolioTotal > 0 ? (h.value / portfolioTotal) * 100 : 0,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    return {
      totalValue: portfolioTotal,
      holdings: holdings.map(h => ({
        ...h,
        weight: portfolioTotal > 0 ? (h.value / portfolioTotal) * 100 : 0,
      })),
      allocationByAssetType,
      allocationByGeography,
      topPositions,
      cashPct,
      numberOfHoldings: holdings.length,
    };
  };

  const runPreTradeCheck = async () => {
    if (!user) {
      toast.error('Please sign in');
      return;
    }

    if (!trade.ticker || !trade.assetName || trade.quantity <= 0 || trade.pricePerUnit <= 0) {
      toast.error('Please fill in all trade details');
      return;
    }

    setIsRunning(true);
    setAnalysis(null);

    try {
      const { data: policyData, error: policyError } = await supabase
        .from('investment_policies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (policyError) throw policyError;

      if (!policyData) {
        toast.error('No investment policy found. Please set up your policy first.');
        setIsRunning(false);
        return;
      }

      const portfolio = buildPortfolioSummary();

      const { data, error } = await supabase.functions.invoke('analyze-policy', {
        body: {
          policy: {
            ...policyData,
            geographic_limits: policyData.geographic_limits || {},
          },
          portfolio,
          proposedTrade: trade,
          mode: 'pre-trade',
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast.success('Pre-trade analysis complete');
    } catch (error) {
      console.error('Error running pre-trade check:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze trade');
    } finally {
      setIsRunning(false);
    }
  };

  const resetForm = () => {
    setTrade(emptyTrade);
    setAnalysis(null);
  };

  const config = analysis ? getClassificationConfig(analysis.classification) : null;
  const StatusIcon = config?.icon || AlertTriangle;
  const tradeValue = trade.quantity * trade.pricePerUnit;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Pre-Trade Check
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Pre-Trade Compliance Check
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {!analysis ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Simulate a proposed trade to check if it would keep your portfolio within policy limits.
              </p>

              {/* Trade Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select 
                    value={trade.transactionType} 
                    onValueChange={(v: 'buy' | 'sell') => setTrade(prev => ({ ...prev, transactionType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">
                        <span className="text-success font-medium">BUY</span>
                      </SelectItem>
                      <SelectItem value="sell">
                        <span className="text-destructive font-medium">SELL</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select 
                    value={trade.assetType} 
                    onValueChange={(v: AssetType) => setTrade(prev => ({ ...prev, assetType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map(t => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ticker & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ticker Symbol</Label>
                  <Input
                    value={trade.ticker}
                    onChange={(e) => setTrade(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                    placeholder="e.g. AAPL"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Asset Name</Label>
                  <Input
                    value={trade.assetName}
                    onChange={(e) => setTrade(prev => ({ ...prev, assetName: e.target.value }))}
                    placeholder="e.g. Apple Inc."
                  />
                </div>
              </div>

              {/* Geography */}
              <div className="space-y-2">
                <Label>Geography</Label>
                <Select 
                  value={trade.geography} 
                  onValueChange={(v: Geography) => setTrade(prev => ({ ...prev, geography: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GEOGRAPHIES.map(g => (
                      <SelectItem key={g} value={g}>
                        {g.replace(/_/g, ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={0}
                    value={trade.quantity || ''}
                    onChange={(e) => setTrade(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per Unit ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={trade.pricePerUnit || ''}
                    onChange={(e) => setTrade(prev => ({ ...prev, pricePerUnit: Number(e.target.value) }))}
                    placeholder="150.00"
                  />
                </div>
              </div>

              {/* Trade Summary */}
              {tradeValue > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Trade Value</span>
                    <span className="text-lg font-bold text-primary font-mono">
                      ${tradeValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              <Button 
                onClick={runPreTradeCheck} 
                disabled={isRunning}
                className="w-full gradient-gold text-primary-foreground"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Trade...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Check Compliance
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Result Header */}
              <div className="flex items-center justify-between">
                <Badge className={`${config?.color} px-4 py-2 text-sm font-mono`}>
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {config?.label}
                </Badge>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  New Check
                </Button>
              </div>

              {/* Trade Summary */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className={trade.transactionType === 'buy' ? 'text-success font-bold' : 'text-destructive font-bold'}>
                    {trade.transactionType.toUpperCase()}
                  </span>
                  <span className="font-mono text-primary">{trade.ticker}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{trade.quantity.toLocaleString()} shares @ ${trade.pricePerUnit}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-bold">${tradeValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Classification */}
              <p className="text-sm font-medium">{analysis.classification}</p>

              {/* Findings */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Impact Analysis</h4>
                <ul className="text-sm space-y-2">
                  {analysis.findings.map((finding, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-warning">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Recommendations</h4>
                <ul className="text-sm space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-success">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Analysis */}
              {analysis.fullAnalysis && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Full AI Analysis</h4>
                  <div className="p-3 bg-muted/20 rounded-lg text-xs whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {analysis.fullAnalysis}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
