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
  const { transactions } = usePortfolio();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [linkedCompanies, setLinkedCompanies] = useState<CrmCompanyLink[]>([]);
  const [projects, setProjects] = useState<CrmProject[]>([]);

  // Get unique tickers from portfolio (no value/quantity needed - just for selector)
  const portfolioTickers = useMemo(() => {
    const tickerMap = new Map<string, { name: string; quantity: number }>();
    
    transactions.forEach(tx => {
      const existing = tickerMap.get(tx.ticker) || { name: tx.assetName, quantity: 0 };
      if (tx.transactionType === 'buy') {
        existing.quantity += tx.quantity;
      } else {
        existing.quantity -= tx.quantity;
      }
      tickerMap.set(tx.ticker, existing);
    });

    return Array.from(tickerMap.entries())
      .filter(([_, data]) => data.quantity > 0)
      .map(([ticker, data]) => ({
        ticker,
        name: data.name
      }))
      .sort((a, b) => a.ticker.localeCompare(b.ticker));
  }, [transactions]);

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
      <CardContent className="space-y-3">
        {/* Portfolio Ticker Selection */}
        <Select value={selectedTicker} onValueChange={setSelectedTicker}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select from portfolio..." />
          </SelectTrigger>
          <SelectContent>
            {portfolioTickers.length === 0 ? (
              <SelectItem value="_empty" disabled>No holdings available</SelectItem>
            ) : (
              portfolioTickers.map(asset => (
                <SelectItem key={asset.ticker} value={asset.ticker}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{asset.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {asset.name}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* CRM Link - Subtle "Open in CRM" when linked */}
        {selectedAsset && tickerLinks.length > 0 && (
          <div className="space-y-1">
            {tickerLinks.map(link => (
              <div 
                key={link.id}
                className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border hover:bg-muted/30 cursor-pointer transition-colors text-xs"
                onClick={() => handleNavigateToCrm(link.project_id)}
              >
                <div className="flex items-center gap-2">
                  {link.is_auto_linked ? (
                    <Link2 size={10} className="text-primary" />
                  ) : (
                    <Building2 size={10} className="text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground">
                    {getProjectName(link.project_id)}
                  </span>
                  {getGroupBadge(link.group_name)}
                </div>
                <Button variant="ghost" size="sm" className="h-5 text-xs gap-1 px-2">
                  Open
                  <ExternalLink size={8} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Compact empty state */}
        {!selectedAsset && portfolioTickers.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-1 italic">
            No holdings in portfolio
          </div>
        )}
      </CardContent>
    </Card>
  );
}
