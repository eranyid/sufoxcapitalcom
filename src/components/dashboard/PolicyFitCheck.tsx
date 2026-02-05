import { useState, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shield, Play, Loader2, CheckCircle2, AlertTriangle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ComplianceCheckModal } from './ComplianceCheckModal';
import { useActivityLog } from '@/hooks/useActivityLog';

interface PolicyAnalysis {
  classification: string;
  findings: string[];
  recommendations: string[];
  fullAnalysis: string;
}

interface PolicyData {
  strategy_philosophy: string | null;
  equity_min_pct: number;
  equity_max_pct: number;
  fixed_income_min_pct: number;
  fixed_income_max_pct: number;
  alternatives_min_pct: number;
  alternatives_max_pct: number;
  cash_min_pct: number;
  max_single_position_pct: number;
  max_sector_allocation_pct: number;
  geographic_limits: Record<string, { min: number; max: number }>;
  risk_tolerance: 'low' | 'medium' | 'high';
  investment_horizon_years: number;
  leverage_allowed: boolean;
  max_leverage_ratio: number;
  min_liquid_assets_pct: number;
  special_constraints: string | null;
}

export function PolicyFitCheck() {
  const { user } = useAuth();
  const { transactions, valuations, cashBalances } = usePortfolio();
  const { logActivity } = useActivityLog();
  const [isRunning, setIsRunning] = useState(false);
  const [analysis, setAnalysis] = useState<PolicyAnalysis | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null);

  // Fetch default project for logging
  useEffect(() => {
    if (!user) return;
    supabase
      .from('crm_projects')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setDefaultProjectId(data[0].id);
      });
  }, [user]);

  const handleComplianceCheckComplete = async (result: { status: string; reasoning: string; guidance: string | null }, query: string) => {
    if (!defaultProjectId) return;
    
    await logActivity({
      projectId: defaultProjectId,
      ticker: 'COMPLIANCE',
      action: 'compliance_check_manual',
      details: {
        query,
        status: result.status,
        reasoning: result.reasoning,
        guidance: result.guidance
      }
    });
  };

  const getClassificationConfig = (classification: string) => {
    if (classification.includes('Feasible & Suitable')) {
      return { color: 'bg-success text-success-foreground', icon: CheckCircle2, label: 'ALIGNED' };
    }
    if (classification.includes('Feasible but Not')) {
      return { color: 'bg-warning text-warning-foreground', icon: AlertTriangle, label: 'PARTIAL' };
    }
    if (classification.includes('Not Feasible')) {
      return { color: 'bg-destructive text-destructive-foreground', icon: XCircle, label: 'VIOLATIONS' };
    }
    return { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: 'NOT ALIGNED' };
  };

  const buildPortfolioSummary = () => {
    // Calculate holdings from transactions
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

    // Update with latest valuations
    valuations.forEach(val => {
      const holding = holdingsMap.get(val.ticker);
      if (holding) {
        holding.latestPrice = val.pricePerUnit;
      }
    });

    // Filter out zero/negative quantities and calculate values
    const holdings = Array.from(holdingsMap.values())
      .filter(h => h.quantity > 0)
      .map(h => ({
        ...h,
        value: h.quantity * h.latestPrice,
      }));

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalCash = (cashBalances?.USD || 0) + (cashBalances?.EUR || 0) + (cashBalances?.ILS || 0) * 0.27;
    const portfolioTotal = totalValue + totalCash;

    // Calculate allocations
    const allocationByAssetType: Record<string, number> = {};
    const allocationByGeography: Record<string, number> = {};

    holdings.forEach(h => {
      const weight = portfolioTotal > 0 ? (h.value / portfolioTotal) * 100 : 0;
      
      // Map asset types to categories
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

    // Add cash
    const cashPct = portfolioTotal > 0 ? (totalCash / portfolioTotal) * 100 : 0;
    if (cashPct > 0) {
      allocationByAssetType['cash'] = cashPct;
    }

    // Top positions
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

  const runPolicyCheck = async () => {
    if (!user) {
      toast.error('Please sign in to run policy check');
      return;
    }

    setIsRunning(true);
    setAnalysis(null);

    try {
      // Fetch user's investment policy
      const { data: policyData, error: policyError } = await supabase
        .from('investment_policies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (policyError) throw policyError;

      if (!policyData) {
        toast.error('No investment policy found. Please set up your policy first.', {
          action: {
            label: 'Set up policy',
            onClick: () => window.location.href = '/policy',
          },
        });
        setIsRunning(false);
        return;
      }

      setPolicy({
        ...policyData,
        geographic_limits: (policyData.geographic_limits as unknown as Record<string, { min: number; max: number }>) || {},
      } as PolicyData);

      // Build portfolio summary
      const summary = buildPortfolioSummary();
      setPortfolioSummary(summary);

      if (summary.numberOfHoldings === 0) {
        toast.error('No holdings found. Add transactions first.');
        setIsRunning(false);
        return;
      }

      // Call AI analysis endpoint
      const { data, error } = await supabase.functions.invoke('analyze-policy', {
        body: {
          policy: policyData,
          portfolio: summary,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      toast.success('Policy analysis complete');
    } catch (error) {
      console.error('Error running policy check:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze policy');
    } finally {
      setIsRunning(false);
    }
  };

  const config = analysis ? getClassificationConfig(analysis.classification) : null;
  const StatusIcon = config?.icon || AlertCircle;

  return (
    <>
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="bloomberg-header-title">AI Policy Fit Check</span>
        </div>
        <div className="p-3 space-y-4">
          {!analysis ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Check if your portfolio aligns with your investment policy using AI analysis
              </p>
              <div className="flex flex-col items-center justify-center gap-2">
                <ComplianceCheckModal onCheckComplete={handleComplianceCheckComplete} />
                <Button 
                  onClick={runPolicyCheck} 
                  disabled={isRunning}
                  className="gradient-gold text-primary-foreground w-full sm:w-auto"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Policy Check
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-3">
                <Link to="/policy" className="text-xs text-primary hover:underline flex items-center justify-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Configure Investment Policy
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={`${config?.color} px-3 py-1 text-xs font-mono`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config?.label}
                </Badge>
                <Button variant="ghost" size="sm" onClick={runPolicyCheck} disabled={isRunning}>
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Re-run'}
                </Button>
              </div>

              {/* Classification */}
              <p className="text-sm font-medium">{analysis.classification}</p>

              {/* Key Findings */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Key Findings</p>
                <ul className="text-sm space-y-1">
                  {analysis.findings.slice(0, 3).map((finding, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* View Full Analysis */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowDetail(true)}
              >
                View Full Analysis
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              AI Policy Analysis Report
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Strategy */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase">Your Strategy</h3>
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  {policy?.strategy_philosophy || 'No strategy defined'}
                </div>
                
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-4">Policy Constraints</h4>
                <div className="space-y-1 text-xs">
                  <p>Equity: {policy?.equity_min_pct}% - {policy?.equity_max_pct}%</p>
                  <p>Fixed Income: {policy?.fixed_income_min_pct}% - {policy?.fixed_income_max_pct}%</p>
                  <p>Alternatives: {policy?.alternatives_min_pct}% - {policy?.alternatives_max_pct}%</p>
                  <p>Min Cash: {policy?.cash_min_pct}%</p>
                  <p>Max Position: {policy?.max_single_position_pct}%</p>
                  <p>Risk: {policy?.risk_tolerance}</p>
                </div>

                {policy?.special_constraints && (
                  <>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-4">Special Constraints</h4>
                    <p className="text-xs text-muted-foreground">{policy.special_constraints}</p>
                  </>
                )}
              </div>

              {/* Middle: Portfolio Stats */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase">Current Portfolio</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <p className="text-lg font-bold text-primary">{portfolioSummary?.numberOfHoldings || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Holdings</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <p className="text-lg font-bold text-primary">{portfolioSummary?.cashPct?.toFixed(1) || 0}%</p>
                    <p className="text-[10px] text-muted-foreground">Cash</p>
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-muted-foreground uppercase">By Asset Type</h4>
                <div className="space-y-1 text-xs">
                  {portfolioSummary && Object.entries(portfolioSummary.allocationByAssetType).map(([type, pct]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{(pct as number).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Top Positions</h4>
                <div className="space-y-1 text-xs">
                  {portfolioSummary?.topPositions?.slice(0, 5).map((pos: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-mono text-primary">{pos.ticker}</span>
                      <span className="font-mono">{pos.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: AI Analysis */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase">AI Assessment</h3>
                
                {analysis && (
                  <>
                    <Badge className={`${config?.color} px-3 py-1`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {analysis.classification}
                    </Badge>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Key Findings</h4>
                        <ul className="text-sm space-y-2">
                          {analysis.findings.map((f, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-warning">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recommendations</h4>
                        <ul className="text-sm space-y-2">
                          {analysis.recommendations.map((r, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-success">→</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Full AI Response */}
            {analysis?.fullAnalysis && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-primary uppercase mb-3">Full AI Analysis</h3>
                <div className="p-4 bg-muted/20 rounded-lg text-sm whitespace-pre-wrap font-mono">
                  {analysis.fullAnalysis}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
