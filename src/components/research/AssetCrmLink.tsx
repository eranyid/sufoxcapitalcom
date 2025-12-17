import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { 
  Building2, 
  ExternalLink, 
  Link2, 
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
  const { transactions, valuations } = usePortfolio();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [linkedCompanies, setLinkedCompanies] = useState<CrmCompanyLink[]>([]);
  const [projects, setProjects] = useState<CrmProject[]>([]);

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Search size={14} className="text-primary" />
            ASSET RESEARCH
          </CardTitle>
          {selectedAsset && tickerLinks.length > 0 && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs gap-1">
              <Link2 size={10} />
              Linked to CRM
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

            {/* CRM Link - Subtle indicator with Open action */}
            {tickerLinks.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="space-y-1">
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
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                        Open in CRM
                        <ExternalLink size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact empty state when no asset selected */}
        {!selectedAsset && portfolioTickers.length > 0 && (
          <div className="text-xs text-muted-foreground text-center py-2 italic">
            Select a holding to view research
          </div>
        )}

        {portfolioTickers.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2 italic">
            No holdings in portfolio
          </div>
        )}
      </CardContent>
    </Card>
  );
}
