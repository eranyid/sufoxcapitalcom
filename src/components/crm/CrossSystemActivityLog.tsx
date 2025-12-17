import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { format } from 'date-fns';
import { 
  Activity, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Building2,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CrmActivityEntry {
  id: string;
  user_id: string;
  project_id: string;
  ticker: string;
  action: string;
  source_transaction_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

type ActivityType = 'all' | 'trade' | 'crm' | 'rebalance' | 'compliance';

interface UnifiedActivityItem {
  id: string;
  type: 'trade' | 'crm_move' | 'crm_add' | 'rebalance' | 'compliance';
  ticker: string;
  description: string;
  timestamp: string;
  sourceId?: string;
  metadata?: {
    quantity?: number;
    price?: number;
    value?: number;
    action?: string;
    fromGroup?: string;
    toGroup?: string;
    status?: string;
    query?: string;
  };
}

interface Props {
  projectId: string;
}

export default function CrossSystemActivityLog({ projectId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions } = usePortfolio();
  const [crmLogs, setCrmLogs] = useState<CrmActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<ActivityType>('all');

  useEffect(() => {
    if (!open || !user) return;

    const fetchCrmLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_activity_log')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Failed to fetch CRM activity logs:', error);
      } else {
        setCrmLogs((data as CrmActivityEntry[]) || []);
      }
      setLoading(false);
    };

    fetchCrmLogs();
  }, [open, projectId, user]);

  // Merge transactions and CRM logs into unified timeline
  const unifiedActivity = useMemo(() => {
    const items: UnifiedActivityItem[] = [];

    // Add transactions as activity items
    transactions.forEach(tx => {
      const isBuy = tx.transactionType === 'buy';
      items.push({
        id: `tx-${tx.id}`,
        type: 'trade',
        ticker: tx.ticker,
        description: isBuy 
          ? `Bought ${tx.quantity} shares @ $${tx.pricePerUnit.toFixed(2)}`
          : `Sold ${tx.quantity} shares @ $${tx.pricePerUnit.toFixed(2)}`,
        timestamp: tx.date,
        sourceId: tx.id,
        metadata: {
          quantity: tx.quantity,
          price: tx.pricePerUnit,
          value: tx.quantity * tx.pricePerUnit,
          action: tx.transactionType
        }
      });
    });

    // Add CRM logs as activity items
    crmLogs.forEach(log => {
      let type: UnifiedActivityItem['type'] = 'crm_move';
      let description = '';

      switch (log.action) {
        case 'auto_add_ongoing':
          type = 'crm_add';
          description = 'Added to Ongoing Holdings (auto-linked)';
          break;
        case 'auto_move_old_exits':
          type = 'crm_move';
          description = 'Moved to Old Exits (position closed)';
          break;
        case 'manual_edit':
          type = 'crm_move';
          description = 'Manual CRM update';
          break;
        case 'rebalance_planned':
          type = 'rebalance';
          const details = log.details as { numberOfTrades?: number; totalTurnover?: number; trades?: unknown[] };
          description = `Rebalance planned: ${details.numberOfTrades || 0} trades, $${Math.round(details.totalTurnover || 0).toLocaleString()} turnover`;
          break;
        case 'rebalance_executed':
          type = 'rebalance';
          description = 'Rebalance executed';
          break;
        case 'watchlist_convert':
          type = 'crm_add';
          description = 'Converted from watchlist to CRM Potential';
          break;
        case 'research_add':
          type = 'crm_add';
          description = 'Added from Research to CRM Potential';
          break;
        case 'compliance_check_manual': {
          type = 'compliance';
          const compDetails = log.details as { query?: string; status?: string };
          const statusLabel = compDetails.status === 'allowed' ? '✓ Allowed' 
            : compDetails.status === 'allowed_with_conditions' ? '⚠ Conditional' 
            : '✗ Not Allowed';
          description = `Compliance check: ${statusLabel}`;
          break;
        }
        default:
          description = log.action;
      }

      items.push({
        id: `crm-${log.id}`,
        type,
        ticker: log.ticker,
        description,
        timestamp: log.created_at,
        sourceId: log.source_transaction_id || undefined,
        metadata: {
          action: log.action,
          ...(log.action === 'rebalance_planned' && {
            value: (log.details as { totalTurnover?: number })?.totalTurnover
          })
        }
      });
    });

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filter
    if (filter === 'all') return items;
    if (filter === 'trade') return items.filter(i => i.type === 'trade');
    if (filter === 'crm') return items.filter(i => i.type === 'crm_move' || i.type === 'crm_add');
    if (filter === 'rebalance') return items.filter(i => i.type === 'rebalance');
    if (filter === 'compliance') return items.filter(i => i.type === 'compliance');

    return items;
  }, [transactions, crmLogs, filter]);

  const getActivityIcon = (item: UnifiedActivityItem) => {
    switch (item.type) {
      case 'trade':
        return item.metadata?.action === 'buy' 
          ? <TrendingUp size={14} className="text-green-400" />
          : <TrendingDown size={14} className="text-red-400" />;
      case 'crm_add':
        return <ArrowUpRight size={14} className="text-primary" />;
      case 'crm_move':
        return <ArrowDownRight size={14} className="text-orange-400" />;
      case 'rebalance':
        return <RefreshCw size={14} className="text-blue-400" />;
      case 'compliance':
        return <ShieldCheck size={14} className="text-blue-400" />;
      default:
        return <Activity size={14} />;
    }
  };

  const getActivityBadge = (item: UnifiedActivityItem) => {
    switch (item.type) {
      case 'trade':
        return item.metadata?.action === 'buy' ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
            BUY
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
            SELL
          </Badge>
        );
      case 'crm_add':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
            CRM ADD
          </Badge>
        );
      case 'crm_move':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
            CRM MOVE
          </Badge>
        );
      case 'rebalance':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
            REBALANCE
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{item.type}</Badge>;
    }
  };

  const handleNavigate = (item: UnifiedActivityItem) => {
    setOpen(false);
    if (item.type === 'trade' && item.sourceId) {
      navigate(`/transactions?highlight=${item.sourceId}`);
    } else if (item.type === 'rebalance') {
      navigate('/research');
    } else if (item.type === 'crm_add' || item.type === 'crm_move') {
      // Stay on current CRM project page - just close dialog
    }
  };

  const formatValue = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Activity size={14} />
          Activity Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Activity size={18} />
              Cross-System Activity Log
            </DialogTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as ActivityType)}>
              <SelectTrigger className="w-[140px] h-8">
                <Filter size={12} className="mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="trade">Trades Only</SelectItem>
                <SelectItem value="crm">CRM Only</SelectItem>
                <SelectItem value="rebalance">Rebalance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[550px] pr-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading activity...</div>
          ) : unifiedActivity.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity yet. Trades and CRM changes will appear here.
            </div>
          ) : (
            <div className="space-y-1">
              {unifiedActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-card/50 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => handleNavigate(item)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-muted/30">
                      {getActivityIcon(item)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">
                          {item.ticker}
                        </span>
                        {getActivityBadge(item)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    {item.metadata?.value && (
                      <span className="font-mono text-foreground">
                        {formatValue(item.metadata.value)}
                      </span>
                    )}
                    <span className="w-[100px] text-right">
                      {format(new Date(item.timestamp), 'MMM d, HH:mm')}
                    </span>
                    {item.sourceId && item.type === 'trade' && (
                      <ExternalLink size={12} className="text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <span>{unifiedActivity.length} events</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <DollarSign size={10} /> Trades: {unifiedActivity.filter(i => i.type === 'trade').length}
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={10} /> CRM: {unifiedActivity.filter(i => i.type.startsWith('crm')).length}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
