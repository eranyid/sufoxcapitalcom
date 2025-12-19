import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  FlaskConical, 
  Scan, 
  Search,
  ArrowRightLeft,
  Calendar,
  FileCheck,
  Settings,
  Contact,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceResult {
  status: 'allowed' | 'allowed_with_conditions' | 'not_allowed';
  reasoning: string;
  guidance: string | null;
  fullAnalysis: string;
}

const NAVIGATION_COMMANDS = [
  { command: 'crm', label: 'CRM', path: '/crm', icon: Contact },
  { command: 'main', label: 'Overview', path: '/', icon: LayoutDashboard },
  { command: 'perf', label: 'Performance', path: '/performance', icon: TrendingUp },
  { command: 'risk', label: 'Risk', path: '/risk', icon: Shield },
  { command: 'scen', label: 'Scenarios', path: '/scenarios', icon: FlaskConical },
  { command: 'x', label: 'X-Ray', path: '/xray', icon: Scan },
  { command: 'resea', label: 'Research', path: '/research', icon: Search },
  { command: 'tran', label: 'Transactions', path: '/transactions', icon: ArrowRightLeft },
  { command: 'value', label: 'Valuations', path: '/valuations', icon: Calendar },
  { command: 'poli', label: 'Policy', path: '/policy', icon: FileCheck },
  { command: 'set', label: 'Settings', path: '/settings', icon: Settings },
  { command: 'help', label: 'Help & Guide', path: '/help', icon: HelpCircle },
];

const SPECIAL_COMMANDS = [
  { command: 'poli check', label: 'Compliance Check', icon: ShieldCheck },
  { command: 'snapshot', label: 'Get Alpaca Snapshot', icon: TrendingUp, hasParam: true, paramHint: 'ticker' },
  { command: 'price', label: 'Get Latest Price', icon: TrendingUp, hasParam: true, paramHint: 'ticker' },
];

export function CommandBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, valuations, cashBalances } = usePortfolio();
  
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [complianceQuery, setComplianceQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  
  const complianceInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setInputValue('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus compliance input when modal opens
  useEffect(() => {
    if (complianceModalOpen && complianceInputRef.current) {
      setTimeout(() => complianceInputRef.current?.focus(), 100);
    }
  }, [complianceModalOpen]);

  // Filter commands based on prefix match
  const getMatchingNavCommands = useCallback((input: string) => {
    const normalized = input.toLowerCase().trim();
    if (!normalized) return NAVIGATION_COMMANDS;
    return NAVIGATION_COMMANDS.filter(cmd => 
      cmd.command.toLowerCase().startsWith(normalized) ||
      cmd.label.toLowerCase().startsWith(normalized)
    );
  }, []);

  const getMatchingSpecialCommands = useCallback((input: string) => {
    const normalized = input.toLowerCase().trim();
    if (!normalized) return SPECIAL_COMMANDS;
    const parts = normalized.split(/\s+/);
    const commandPart = parts[0];
    
    return SPECIAL_COMMANDS.filter(cmd => {
      const cmdBase = cmd.command.toLowerCase().split(' ')[0];
      // Match if user is typing the command or command with param
      return cmdBase.startsWith(commandPart) || 
             cmd.label.toLowerCase().startsWith(normalized) ||
             normalized.startsWith(cmdBase);
    });
  }, []);

  // Alpaca API call
  const callAlpacaApi = useCallback(async (action: string, ticker: string) => {
    if (!ticker) {
      toast.error('Please provide a ticker symbol');
      return;
    }

    const loadingToast = toast.loading(`Fetching ${action} for ${ticker.toUpperCase()}...`);

    try {
      const { data, error } = await supabase.functions.invoke('alpaca-test', {
        body: { action, symbol: ticker.toUpperCase() },
      });

      toast.dismiss(loadingToast);

      if (error) throw error;
      if (data.status === 'error') throw new Error(data.message);

      if (action === 'snapshot') {
        const snap = data.data;
        const latestTrade = snap?.latestTrade?.p || snap?.latestTrade?.price || 'N/A';
        const latestQuote = snap?.latestQuote;
        const bid = latestQuote?.bp || latestQuote?.bid_price || 'N/A';
        const ask = latestQuote?.ap || latestQuote?.ask_price || 'N/A';
        
        toast.success(
          <div className="font-mono text-xs space-y-1">
            <div className="font-bold text-sm">{ticker.toUpperCase()} Snapshot</div>
            <div>Price: ${typeof latestTrade === 'number' ? latestTrade.toFixed(2) : latestTrade}</div>
            <div>Bid: ${typeof bid === 'number' ? bid.toFixed(2) : bid}</div>
            <div>Ask: ${typeof ask === 'number' ? ask.toFixed(2) : ask}</div>
            <div className="text-muted-foreground">Latency: {data.latency_ms}ms</div>
          </div>,
          { duration: 8000 }
        );
      } else if (action === 'latest-trade') {
        const trade = data.data?.trade || data.data;
        const price = trade?.p || trade?.price || 'N/A';
        const size = trade?.s || trade?.size || 'N/A';
        
        toast.success(
          <div className="font-mono text-xs space-y-1">
            <div className="font-bold text-sm">{ticker.toUpperCase()} Price</div>
            <div>Price: ${typeof price === 'number' ? price.toFixed(2) : price}</div>
            <div>Size: {size}</div>
            <div className="text-muted-foreground">Latency: {data.latency_ms}ms</div>
          </div>,
          { duration: 6000 }
        );
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Alpaca API error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch Alpaca data');
    }
  }, []);

  const handleSelect = useCallback((value: string) => {
    const normalized = value.toLowerCase().trim();
    
    // Check for special commands first
    if (normalized === 'poli check' || normalized.startsWith('poli check')) {
      setOpen(false);
      setInputValue('');
      setComplianceQuery('');
      setComplianceResult(null);
      setComplianceModalOpen(true);
      return;
    }

    // Check navigation commands
    const navMatch = NAVIGATION_COMMANDS.find(cmd => 
      cmd.command.toLowerCase() === normalized ||
      cmd.label.toLowerCase() === normalized
    );
    
    if (navMatch) {
      setOpen(false);
      setInputValue('');
      navigate(navMatch.path);
    }
  }, [navigate]);

  // Handle Enter key in command dialog
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const normalized = inputValue.toLowerCase().trim();
      const parts = normalized.split(/\s+/);
      const command = parts[0];
      const param = parts[1]?.toUpperCase();
      
      // Alpaca commands
      if (command === 'snapshot' && param) {
        e.preventDefault();
        setOpen(false);
        setInputValue('');
        callAlpacaApi('snapshot', param);
        return;
      }
      
      if (command === 'price' && param) {
        e.preventDefault();
        setOpen(false);
        setInputValue('');
        callAlpacaApi('latest-trade', param);
        return;
      }
      
      // Special command exact match
      if (normalized === 'poli check') {
        e.preventDefault();
        handleSelect('poli check');
        return;
      }

      // Navigation command exact or prefix match
      const navMatch = NAVIGATION_COMMANDS.find(cmd => 
        cmd.command.toLowerCase() === normalized
      );
      
      if (navMatch) {
        e.preventDefault();
        handleSelect(navMatch.command);
      }
    }
  }, [inputValue, handleSelect, callAlpacaApi]);

  // Build portfolio summary for compliance check
  const buildPortfolioSummary = useCallback(() => {
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
  }, [transactions, valuations, cashBalances]);

  // Log compliance check to activity log
  const logComplianceCheck = useCallback(async (query: string, result: ComplianceResult) => {
    if (!user) return;

    try {
      await supabase.from('crm_activity_log').insert({
        user_id: user.id,
        project_id: '00000000-0000-0000-0000-000000000000', // System-level log
        ticker: 'SYSTEM',
        action: 'compliance_check',
        details: {
          type: 'compliance_check',
          source: 'command_bar',
          query,
          result: {
            status: result.status,
            reasoning: result.reasoning,
            guidance: result.guidance,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log compliance check:', error);
    }
  }, [user]);

  // Run compliance check
  const runComplianceCheck = useCallback(async () => {
    if (!user || !complianceQuery.trim()) {
      toast.error('Please describe the action you want to check');
      return;
    }

    setIsAnalyzing(true);
    setComplianceResult(null);

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
          query: complianceQuery.trim(),
          mode: 'compliance-check',
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const result: ComplianceResult = {
        status: data.analysis.status || 'not_allowed',
        reasoning: data.analysis.reasoning || 'Unable to determine compliance.',
        guidance: data.analysis.guidance || null,
        fullAnalysis: data.analysis.fullAnalysis || data.rawResponse || '',
      };

      setComplianceResult(result);
      
      // Log to activity log
      await logComplianceCheck(complianceQuery.trim(), result);
      
    } catch (error) {
      console.error('Compliance check error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run compliance check');
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, complianceQuery, buildPortfolioSummary, logComplianceCheck]);

  // Handle Enter in compliance modal
  const handleComplianceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isAnalyzing) {
      e.preventDefault();
      runComplianceCheck();
    }
  }, [runComplianceCheck, isAnalyzing]);

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
    setComplianceResult(null);
    setComplianceQuery('');
    setTimeout(() => complianceInputRef.current?.focus(), 100);
  };

  const matchingNavCommands = getMatchingNavCommands(inputValue);
  const matchingSpecialCommands = getMatchingSpecialCommands(inputValue);
  const StatusIcon = complianceResult ? getStatusConfig(complianceResult.status).icon : null;
  const statusConfig = complianceResult ? getStatusConfig(complianceResult.status) : null;

  return (
    <>
      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
          <span className="font-mono font-bold text-orange-500">&gt;_</span>
          <span className="text-xs font-mono text-muted-foreground tracking-widest">COMMAND BAR</span>
          <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </div>
        <div className="flex items-center border-b">
          <input 
            placeholder="Type a command (e.g. price AAPL)..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex h-11 w-full rounded-md bg-transparent py-3 px-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            autoFocus
          />
        </div>
        {/* Hint for param commands */}
        {inputValue.toLowerCase().startsWith('price') && !inputValue.includes(' ') && (
          <div className="px-4 py-2 bg-muted/50 border-b text-xs font-mono text-muted-foreground">
            💡 Type: <span className="text-orange-400">price AAPL</span> then press Enter
          </div>
        )}
        {inputValue.toLowerCase().startsWith('snapshot') && !inputValue.includes(' ') && (
          <div className="px-4 py-2 bg-muted/50 border-b text-xs font-mono text-muted-foreground">
            💡 Type: <span className="text-orange-400">snapshot AAPL</span> then press Enter
          </div>
        )}
        <CommandList>
          <CommandEmpty className="py-6 text-center">
            <span className="text-muted-foreground font-mono text-sm">No matching commands</span>
          </CommandEmpty>
          
          {matchingSpecialCommands.length > 0 && (
            <CommandGroup heading="Actions" className="font-mono text-xs">
              {matchingSpecialCommands.map((cmd) => (
                <CommandItem
                  key={cmd.command}
                  value={cmd.command}
                  onSelect={() => {
                    // For commands with params, just set the command in input
                    if ('hasParam' in cmd && cmd.hasParam) {
                      setInputValue(cmd.command.split(' ')[0] + ' ');
                    } else {
                      handleSelect(cmd.command);
                    }
                  }}
                  className="font-mono"
                >
                  <cmd.icon className="mr-2 h-4 w-4 text-blue-400" />
                  <span className="text-primary font-semibold">{cmd.command.split(' ')[0]}</span>
                  {'hasParam' in cmd && cmd.hasParam && (
                    <span className="ml-1 text-orange-400">&lt;{cmd.paramHint}&gt;</span>
                  )}
                  <span className="ml-2 text-muted-foreground">→ {cmd.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {matchingNavCommands.length > 0 && (
            <CommandGroup heading="Navigation" className="font-mono text-xs">
              {matchingNavCommands.map((cmd) => (
                <CommandItem
                  key={cmd.command}
                  value={cmd.command}
                  onSelect={() => handleSelect(cmd.command)}
                  className="font-mono"
                >
                  <cmd.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-primary font-semibold">{cmd.command}</span>
                  <span className="ml-2 text-muted-foreground">→ {cmd.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Compliance Check Modal */}
      <Dialog open={complianceModalOpen} onOpenChange={setComplianceModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              Compliance Check
            </DialogTitle>
          </DialogHeader>

          {!complianceResult ? (
            <div className="space-y-4">
              <Input
                ref={complianceInputRef}
                placeholder="Describe what you want to do (e.g. increase AAPL to 8%, rebalance equal weight, open FX hedge)"
                value={complianceQuery}
                onChange={(e) => setComplianceQuery(e.target.value)}
                onKeyDown={handleComplianceKeyDown}
                disabled={isAnalyzing}
                className="font-mono text-sm h-12"
              />
              {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground font-mono">Analyzing...</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground font-mono">
                Press Enter to check compliance
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Query recap */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Request</p>
                  <p className="text-sm font-mono">{complianceQuery}</p>
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
                  <p className="text-[10px] text-muted-foreground uppercase font-mono mb-2">Explanation</p>
                  <p className="text-sm">{complianceResult.reasoning}</p>
                </div>

                {/* Guidance */}
                {complianceResult.guidance && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-[10px] text-blue-400 uppercase font-mono mb-2">Guidance</p>
                    <p className="text-sm text-blue-100">{complianceResult.guidance}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleReset}
                    className="flex-1 px-3 py-2 text-sm font-mono border border-border rounded hover:bg-muted/50 transition-colors"
                  >
                    New Check
                  </button>
                  <button 
                    onClick={() => setComplianceModalOpen(false)}
                    className="flex-1 px-3 py-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
