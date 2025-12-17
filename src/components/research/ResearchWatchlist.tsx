import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Eye, 
  Plus, 
  Building2, 
  Trash2,
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

interface WatchlistItem {
  id: string;
  symbol: string;
  display_name: string | null;
  asset_class: string | null;
  created_at: string;
}

interface CrmProject {
  id: string;
  name: string;
}

interface CrmCompany {
  ticker: string;
  project_id: string;
}

export default function ResearchWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [crmCompanies, setCrmCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newAssetClass, setNewAssetClass] = useState('equity');
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [watchlistRes, projectsRes, companiesRes] = await Promise.all([
      supabase
        .from('research_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('crm_projects')
        .select('id, name')
        .eq('user_id', user.id),
      supabase
        .from('crm_companies')
        .select('ticker, project_id')
        .eq('user_id', user.id)
        .not('ticker', 'is', null)
    ]);

    if (watchlistRes.data) setWatchlist(watchlistRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    if (companiesRes.data) setCrmCompanies(companiesRes.data as CrmCompany[]);
    
    setLoading(false);
  };

  const isInCrm = (symbol: string) => {
    return crmCompanies.some(c => c.ticker === symbol);
  };

  const handleAddToWatchlist = async () => {
    if (!user || !newSymbol.trim()) return;

    const { error } = await supabase
      .from('research_watchlist')
      .insert({
        user_id: user.id,
        symbol: newSymbol.toUpperCase().trim(),
        display_name: newName.trim() || null,
        asset_class: newAssetClass
      });

    if (error) {
      toast.error('Failed to add to watchlist');
      return;
    }

    toast.success(`Added ${newSymbol.toUpperCase()} to watchlist`);
    setNewSymbol('');
    setNewName('');
    fetchData();
  };

  const handleRemoveFromWatchlist = async (id: string) => {
    const { error } = await supabase
      .from('research_watchlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove from watchlist');
      return;
    }

    setWatchlist(prev => prev.filter(w => w.id !== id));
    toast.success('Removed from watchlist');
  };

  const handleConvertToCrm = async (item: WatchlistItem) => {
    if (!user || projects.length === 0) {
      toast.error('No CRM projects available');
      return;
    }

    setAddingSymbol(item.symbol);
    const targetProject = projects[0];

    const { error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        project_id: targetProject.id,
        company_name: item.display_name || item.symbol,
        ticker: item.symbol,
        group_name: 'potential',
        status: 'research',
        is_auto_linked: false
      });

    if (error) {
      toast.error('Failed to add to CRM');
      setAddingSymbol(null);
      return;
    }

    toast.success(`Added ${item.symbol} to CRM → ${targetProject.name}`);
    
    // Refresh CRM companies list
    const { data: companies } = await supabase
      .from('crm_companies')
      .select('ticker, project_id')
      .eq('user_id', user.id)
      .not('ticker', 'is', null);

    if (companies) {
      setCrmCompanies(companies as CrmCompany[]);
    }
    setAddingSymbol(null);
  };

  const getAssetClassBadge = (assetClass: string | null) => {
    switch (assetClass) {
      case 'equity':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">Equity</Badge>;
      case 'fixed_income':
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">Fixed Income</Badge>;
      case 'crypto':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">Crypto</Badge>;
      case 'commodity':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">Commodity</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{assetClass || 'Other'}</Badge>;
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono flex items-center gap-2">
          <Eye size={14} className="text-primary" />
          WATCHLIST
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Symbol */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Symbol (e.g., AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="flex-1 h-8 text-xs"
            />
            <Input
              placeholder="Name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 h-8 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Select value={newAssetClass} onValueChange={setNewAssetClass}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="fixed_income">Fixed Income</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="commodity">Commodity</SelectItem>
                <SelectItem value="etf">ETF</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              className="h-8 text-xs gap-1"
              onClick={handleAddToWatchlist}
              disabled={!newSymbol.trim()}
            >
              <Plus size={12} />
              Add
            </Button>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
          ) : watchlist.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4 italic">
              No items in watchlist
            </div>
          ) : (
            watchlist.map(item => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono font-semibold text-primary text-sm">
                    {item.symbol}
                  </span>
                  {item.display_name && (
                    <span className="text-xs text-muted-foreground truncate">
                      {item.display_name}
                    </span>
                  )}
                  {getAssetClassBadge(item.asset_class)}
                </div>
                <div className="flex items-center gap-1">
                  {isInCrm(item.symbol) ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs gap-1">
                            <Check size={10} />
                            In CRM
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Already added to CRM</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs gap-1 text-primary hover:text-primary"
                            onClick={() => handleConvertToCrm(item)}
                            disabled={addingSymbol === item.symbol}
                          >
                            <Building2 size={12} />
                            {addingSymbol === item.symbol ? 'Adding...' : 'To CRM'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Convert to CRM Potential</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveFromWatchlist(item.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove from watchlist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {watchlist.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <div className="text-center p-2 rounded bg-muted/20">
              <div className="text-lg font-mono font-semibold text-foreground">
                {watchlist.length}
              </div>
              <div className="text-xs text-muted-foreground">Watching</div>
            </div>
            <div className="text-center p-2 rounded bg-muted/20">
              <div className="text-lg font-mono font-semibold text-green-400">
                {watchlist.filter(w => isInCrm(w.symbol)).length}
              </div>
              <div className="text-xs text-muted-foreground">In CRM</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
