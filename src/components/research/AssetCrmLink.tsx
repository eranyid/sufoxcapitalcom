import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { usePortfolio } from '@/context/PortfolioContext';
import { 
  Building2, 
  ExternalLink, 
  Link2, 
  Plus,
  TrendingUp,
  TrendingDown,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface CrmCompanyLink {
  id: string;
  company_name: string;
  ticker: string;
  project_id: string;
  group_name: string;
  status: string;
  is_auto_linked: boolean;
}

interface CrmProject {
  id: string;
  name: string;
}

export default function AssetCrmLink() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { transactions, valuations } = usePortfolio();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [linkedCompanies, setLinkedCompanies] = useState<CrmCompanyLink[]>([]);
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [loading, setLoading] = useState(false);

  // Get unique tickers from portfolio
  const portfolioTickers = useMemo(() => {
    const tickerMap = new Map<string, { name: string; quantity: number; value: number }>();
    
    transactions.forEach(tx => {
      const existing = tickerMap.get(tx.ticker) || { name: tx.assetName, quantity: 0, value: 0 };
      if (tx.transactionType === 'buy') {
        existing.quantity += tx.quantity;
      } else {
        existing.quantity -= tx.quantity;
      }
      tickerMap.set(tx.ticker, existing);
    });

    // Add current values from valuations
    const latestValuations = new Map<string, number>();
    valuations.forEach(v => {
      const existing = latestValuations.get(v.ticker);
      if (!existing || v.month > (existing ? v.month : '')) {
        latestValuations.set(v.ticker, v.pricePerUnit);
      }
    });

    return Array.from(tickerMap.entries())
      .filter(([_, data]) => data.quantity > 0)
      .map(([ticker, data]) => ({
        ticker,
        name: data.name,
        quantity: data.quantity,
        value: data.quantity * (latestValuations.get(ticker) || 0)
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, valuations]);

  // Fetch CRM links and projects
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch all CRM companies with tickers
      const { data: companies } = await supabase
        .from('crm_companies')
        .select('id, company_name, ticker, project_id, group_name, status, is_auto_linked')
        .eq('user_id', user.id)
        .not('ticker', 'is', null);

      if (companies) {
        setLinkedCompanies(companies as CrmCompanyLink[]);
      }

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('crm_projects')
        .select('id, name')
        .eq('user_id', user.id);

      if (projectsData) {
        setProjects(projectsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Find linked companies for selected ticker
  const tickerLinks = useMemo(() => {
    if (!selectedTicker) return [];
    return linkedCompanies.filter(c => c.ticker === selectedTicker);
  }, [selectedTicker, linkedCompanies]);

  const selectedAsset = portfolioTickers.find(t => t.ticker === selectedTicker);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const getGroupBadge = (groupName: string) => {
    switch (groupName) {
      case 'ongoing_holding':
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">Ongoing</Badge>;
      case 'potential':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">Potential</Badge>;
      case 'old_exits':
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted text-xs">Old Exit</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{groupName}</Badge>;
    }
  };

  const handleNavigateToCrm = (projectId: string) => {
    navigate(`/crm/projects/${projectId}?tab=companies`);
  };

  const handleAddToCrm = async () => {
    if (!selectedTicker || !selectedAsset || projects.length === 0) {
      toast.error('No CRM projects available');
      return;
    }

    // Add to first active project as potential
    const targetProject = projects[0];
    
    const { error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user!.id,
        project_id: targetProject.id,
        company_name: selectedAsset.name,
        ticker: selectedTicker,
        group_name: 'potential',
        status: 'research',
        is_auto_linked: false
      });

    if (error) {
      toast.error('Failed to add to CRM');
      return;
    }

    // Log activity
    await logActivity({
      projectId: targetProject.id,
      ticker: selectedTicker,
      action: 'research_add',
      details: {
        source: 'portfolio_research',
        assetName: selectedAsset.name,
        value: selectedAsset.value,
        quantity: selectedAsset.quantity
      }
    });

    toast.success(`Added ${selectedTicker} to CRM → ${targetProject.name}`);
    
    // Refresh links
    const { data: companies } = await supabase
      .from('crm_companies')
      .select('id, company_name, ticker, project_id, group_name, status, is_auto_linked')
      .eq('user_id', user!.id)
      .not('ticker', 'is', null);

    if (companies) {
      setLinkedCompanies(companies as CrmCompanyLink[]);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono flex items-center gap-2">
          <Search size={14} className="text-primary" />
          ASSET RESEARCH
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticker Selection */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Select Asset</label>
          <Select value={selectedTicker} onValueChange={setSelectedTicker}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose from portfolio..." />
            </SelectTrigger>
            <SelectContent>
              {portfolioTickers.map(asset => (
                <SelectItem key={asset.ticker} value={asset.ticker}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-mono font-semibold">{asset.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {asset.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Asset Info */}
        {selectedAsset && (
          <div className="p-3 rounded-md bg-muted/30 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono font-semibold text-primary text-lg">
                  {selectedAsset.ticker}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedAsset.name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">
                  {formatCurrency(selectedAsset.value)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedAsset.quantity.toLocaleString()} shares
                </div>
              </div>
            </div>

            {/* CRM Link Status */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 size={12} />
                  CRM Status
                </span>
                {tickerLinks.length === 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs gap-1"
                          onClick={handleAddToCrm}
                        >
                          <Plus size={12} />
                          Add to CRM
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add as Potential to first CRM project</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {tickerLinks.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  Not linked to any CRM project
                </div>
              ) : (
                <div className="space-y-2">
                  {tickerLinks.map(link => (
                    <div 
                      key={link.id}
                      className="flex items-center justify-between p-2 rounded bg-background/50 border border-border hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => handleNavigateToCrm(link.project_id)}
                    >
                      <div className="flex items-center gap-2">
                        {link.is_auto_linked ? (
                          <Link2 size={12} className="text-primary" />
                        ) : (
                          <Building2 size={12} className="text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium">
                          {getProjectName(link.project_id)}
                        </span>
                        {getGroupBadge(link.group_name)}
                      </div>
                      <ExternalLink size={12} className="text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {portfolioTickers.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <div className="text-center p-2 rounded bg-muted/20">
              <div className="text-lg font-mono font-semibold text-foreground">
                {portfolioTickers.length}
              </div>
              <div className="text-xs text-muted-foreground">Holdings</div>
            </div>
            <div className="text-center p-2 rounded bg-muted/20">
              <div className="text-lg font-mono font-semibold text-primary">
                {linkedCompanies.filter(c => 
                  portfolioTickers.some(t => t.ticker === c.ticker)
                ).length}
              </div>
              <div className="text-xs text-muted-foreground">CRM Linked</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
