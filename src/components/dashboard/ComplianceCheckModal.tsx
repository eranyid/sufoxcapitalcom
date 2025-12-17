import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceResult {
  status: 'allowed' | 'allowed_with_conditions' | 'not_allowed';
  reasoning: string;
  guidance: string | null;
  fullAnalysis: string;
}

interface Props {
  onCheckComplete?: (result: ComplianceResult, query: string) => void;
}

export function ComplianceCheckModal({ onCheckComplete }: Props) {
  const { user } = useAuth();
  const { transactions, valuations, cashBalances } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);

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

  const runComplianceCheck = async () => {
    if (!user || !query.trim()) {
      toast.error('Please describe the action you want to check');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Fetch user's investment policy
      const { data: policyData, error: policyError } = await supabase
        .from('investment_policies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (policyError) throw policyError;

      if (!policyData) {
        toast.error('No investment policy found. Please set up your policy first.');
        setIsAnalyzing(false);
        return;
      }

      const portfolio = buildPortfolioSummary();

      // Call AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-policy', {
        body: {
          policy: policyData,
          portfolio,
          query: query.trim(),
          mode: 'compliance-check',
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const complianceResult: ComplianceResult = {
        status: data.analysis.status || 'not_allowed',
        reasoning: data.analysis.reasoning || 'Unable to determine compliance.',
        guidance: data.analysis.guidance || null,
        fullAnalysis: data.analysis.fullAnalysis || data.rawResponse || '',
      };

      setResult(complianceResult);
      onCheckComplete?.(complianceResult, query.trim());
      
    } catch (error) {
      console.error('Compliance check error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run compliance check');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'allowed':
        return { color: 'bg-success text-success-foreground', icon: CheckCircle2, label: 'ALLOWED' };
      case 'allowed_with_conditions':
        return { color: 'bg-warning text-warning-foreground', icon: AlertTriangle, label: 'ALLOWED WITH CONDITIONS' };
      case 'not_allowed':
      default:
        return { color: 'bg-destructive text-destructive-foreground', icon: XCircle, label: 'NOT ALLOWED' };
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuery('');
  };

  const StatusIcon = result ? getStatusConfig(result.status).icon : null;
  const statusConfig = result ? getStatusConfig(result.status) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
          <ShieldCheck className="h-4 w-4" />
          Compliance Check
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            Compliance Check
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe an intended action in natural language and check if it complies with your investment policy.
            </p>
            <Textarea
              placeholder="e.g., Increase AAPL to 12%, Add leverage, Open FX hedge USD/ILS, Buy small-cap growth stock..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isAnalyzing}
            />
            <Button
              onClick={runComplianceCheck}
              disabled={isAnalyzing || !query.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Check Compliance
                </>
              )}
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Query recap */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase mb-1">Your Request</p>
                <p className="text-sm font-medium">{query}</p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge className={`${statusConfig?.color} px-3 py-1.5 text-xs font-mono`}>
                  {StatusIcon && <StatusIcon className="h-3.5 w-3.5 mr-1.5" />}
                  {statusConfig?.label}
                </Badge>
              </div>

              {/* Reasoning */}
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Reasoning</p>
                <p className="text-sm">{result.reasoning}</p>
              </div>

              {/* Guidance */}
              {result.guidance && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400 uppercase mb-2">Guidance</p>
                  <p className="text-sm text-blue-100">{result.guidance}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                  New Check
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
