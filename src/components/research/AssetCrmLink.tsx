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
  Search,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  
  // Asset Lookup state
  const [lookupSymbol, setLookupSymbol] = useState('');
  const [lookupName, setLookupName] = useState('');
  const [addingToCrm, setAddingToCrm] = useState(false);

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
      
      const { data: companies } = await supabase
        .from('crm_companies')
        .select('id, company_name, ticker, project_id, group_name, status, is_auto_linked')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .not('ticker', 'is', null);

      if (companies) {
        setLinkedCompanies(companies as CrmCompanyLink[]);
      }

      const { data: projectsData } = await supabase
        .from('crm_projects')
        .select('id, name')
        .eq('user_id', user.id)
        .is('deleted_at', null);

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

  // Check if lookup symbol exists in CRM
  const lookupCrmStatus = useMemo(() => {
    if (!lookupSymbol.trim()) return null;
    const symbol = lookupSymbol.toUpperCase().trim();
    const existingCompanies = linkedCompanies.filter(c => c.ticker === symbol);
    if (existingCompanies.length === 0) return null;
    return existingCompanies;
  }, [lookupSymbol, linkedCompanies]);

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
    
    const { data: companies } = await supabase
      .from('crm_companies')
      .select('id, company_name, ticker, project_id, group_name, status, is_auto_linked')
      .eq('user_id', user!.id)
      .is('deleted_at', null)
      .not('ticker', 'is', null);

    if (companies) {
      setLinkedCompanies(companies as CrmCompanyLink[]);
    }
  };

  // Handle Asset Lookup - Add to CRM as Potential
  const handleLookupAddToCrm = async () => {
    if (!user || !lookupSymbol.trim() || projects.length === 0) {
      toast.error('No CRM projects available');
      return;
    }

    const symbol = lookupSymbol.toUpperCase().trim();
    const name = lookupName.trim() || symbol;
    const targetProject = projects[0];

    // Check for duplicates in the target project
    const existingInProject = linkedCompanies.find(
      c => c.ticker === symbol && c.project_id === targetProject.id
    );

    if (existingInProject) {
      toast.error(`${symbol} already exists in ${targetProject.name}`);
      return;
    }

    setAddingToCrm(true);

    const { error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        project_id: targetProject.id,
        company_name: name,
        ticker: symbol,
        group_name: 'potential',
        status: 'research',
        is_auto_linked: false
      });

    if (error) {
      toast.error('Failed to add to CRM');
      setAddingToCrm(false);
      return;
    }

    await logActivity({
      projectId: targetProject.id,
      ticker: symbol,
      action: 'research_add',
      details: {
        source: 'asset_lookup',
        displayName: name
      }
    });

    toast.success(`Added ${symbol} to CRM → ${targetProject.name} (Potential)`);
    
    // Refresh CRM companies
    const { data: companies } = await supabase
      .from('crm_companies')
      .select('id, company_name, ticker, project_id, group_name, status, is_auto_linked')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .not('ticker', 'is', null);

    if (companies) {
      setLinkedCompanies(companies as CrmCompanyLink[]);
    }

    setLookupSymbol('');
    setLookupName('');
    setAddingToCrm(false);
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
        {/* Asset Lookup - Add any ticker to CRM */}
        <div className="p-3 rounded-md bg-muted/20 border border-border space-y-2">
          <label className="text-xs text-muted-foreground font-medium">Quick Add to CRM (Potential)</label>
          <div className="flex gap-2">
            <Input
              placeholder="Symbol (e.g., AAPL)"
              value={lookupSymbol}
              onChange={(e) => setLookupSymbol(e.target.value.toUpperCase())}
              className="flex-1 h-8 text-xs font-mono"
            />
            <Input
              placeholder="Name (optional)"
              value={lookupName}
              onChange={(e) => setLookupName(e.target.value)}
              className="flex-1 h-8 text-xs"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    className="h-8 text-xs gap-1"
                    onClick={handleLookupAddToCrm}
                    disabled={!lookupSymbol.trim() || addingToCrm || projects.length === 0 || (lookupCrmStatus !== null && lookupCrmStatus.some(c => c.project_id === projects[0]?.id))}
                  >
                    <Plus size={12} />
                    {addingToCrm ? 'Adding...' : 'Add'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to CRM as Potential</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* CRM Status for lookup symbol */}
          {lookupCrmStatus && lookupCrmStatus.length > 0 && (
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-2 text-xs">
                <Check size={12} className="text-green-400" />
                <span className="text-muted-foreground">Already in CRM:</span>
              </div>
              <div className="mt-1 space-y-1">
                {lookupCrmStatus.map(company => (
                  <div 
                    key={company.id}
                    className="flex items-center justify-between p-1.5 rounded bg-background/50 border border-border hover:bg-muted/20 cursor-pointer transition-colors text-xs"
                    onClick={() => handleNavigateToCrm(company.project_id)}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={10} className="text-muted-foreground" />
                      <span className="font-medium">{getProjectName(company.project_id)}</span>
                      {getGroupBadge(company.group_name)}
                    </div>
                    <ExternalLink size={10} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Ticker Selection */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Select from Portfolio</label>
          <Select value={selectedTicker} onValueChange={setSelectedTicker}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose from holdings..." />
            </SelectTrigger>
            <SelectContent>
              {portfolioTickers.length === 0 ? (
                <SelectItem value="_empty" disabled>No holdings available</SelectItem>
              ) : (
                portfolioTickers.map(asset => (
                  <SelectItem key={asset.ticker} value={asset.ticker}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-mono font-semibold">{asset.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {asset.name}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
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
