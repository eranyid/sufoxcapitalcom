import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculatePositions, getLatestValuations } from '@/lib/calculations';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Building2,
  DollarSign,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Filter,
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  ListTodo,
  Search,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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

interface CrmTask {
  id: string;
  task_name: string;
  status: string;
  urgency: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

type EventType = 'all' | 'trade' | 'crm' | 'rebalance' | 'compliance' | 'task' | 'scenario';

interface TimelineEvent {
  id: string;
  type: 'trade_buy' | 'trade_sell' | 'crm_add' | 'crm_move' | 'crm_update' | 'rebalance' | 'compliance' | 'task' | 'scenario';
  ticker: string;
  title: string;
  description: string;
  timestamp: string;
  sourceModule: 'Transactions' | 'CRM' | 'Research' | 'Policy' | 'Scenarios' | 'Tasks';
  sourceId?: string;
  details?: {
    quantity?: number;
    price?: number;
    value?: number;
    weight?: number;
    pnl?: number;
    status?: string;
    query?: string;
    reasoning?: string;
    scenarioName?: string;
    impactSummary?: string;
    taskStatus?: string;
    urgency?: string;
    trades?: Array<{ ticker: string; action: string; value: number; weightChange: number }>;
  };
}

interface Props {
  projectId: string;
}

export default function ProjectTimeline({ projectId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, valuations } = usePortfolio();
  const [crmLogs, setCrmLogs] = useState<CrmActivityEntry[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventType>('all');
  const [tickerFilter, setTickerFilter] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Fetch CRM logs and tasks
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      const [logsRes, tasksRes] = await Promise.all([
        supabase
          .from('crm_activity_log')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('crm_tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (logsRes.error) {
        console.error('Failed to fetch activity logs:', logsRes.error);
      } else {
        setCrmLogs((logsRes.data as CrmActivityEntry[]) || []);
      }

      if (tasksRes.error) {
        console.error('Failed to fetch tasks:', tasksRes.error);
      } else {
        setTasks((tasksRes.data as CrmTask[]) || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [projectId, user]);

  // Build unified timeline
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Calculate current positions and weights
    const positions = calculatePositions(transactions);
    const latestVals = getLatestValuations(valuations);
    
    // Calculate total portfolio value for weight calculation
    let totalValue = 0;
    for (const [ticker, pos] of Object.entries(positions)) {
      if (pos.quantity > 0) {
        const valData = latestVals[ticker];
        const price = valData?.pricePerUnit || pos.avgCost;
        totalValue += pos.quantity * price;
      }
    }

    // Add transactions
    transactions.forEach(tx => {
      const isBuy = tx.transactionType === 'buy';
      const pos = positions[tx.ticker];
      const valData = latestVals[tx.ticker];
      const currentPrice = valData?.pricePerUnit || tx.pricePerUnit;
      const currentValue = (pos?.quantity || 0) * currentPrice;
      const weight = totalValue > 0 ? (currentValue / totalValue) : 0;
      
      events.push({
        id: `tx-${tx.id}`,
        type: isBuy ? 'trade_buy' : 'trade_sell',
        ticker: tx.ticker,
        title: isBuy ? 'Position Opened / Added' : 'Position Reduced / Closed',
        description: isBuy 
          ? `Bought ${tx.quantity.toLocaleString()} shares @ $${tx.pricePerUnit.toFixed(2)}`
          : `Sold ${tx.quantity.toLocaleString()} shares @ $${tx.pricePerUnit.toFixed(2)}`,
        timestamp: tx.date,
        sourceModule: 'Transactions',
        sourceId: tx.id,
        details: {
          quantity: tx.quantity,
          price: tx.pricePerUnit,
          value: tx.quantity * tx.pricePerUnit,
          weight: weight * 100
        }
      });
    });

    // Add CRM activity logs
    crmLogs.forEach(log => {
      let type: TimelineEvent['type'] = 'crm_update';
      let title = '';
      let description = '';
      let sourceModule: TimelineEvent['sourceModule'] = 'CRM';
      let details: TimelineEvent['details'] = {};

      switch (log.action) {
        case 'auto_add_ongoing':
          type = 'crm_add';
          title = 'Added to Portfolio Holdings';
          description = 'Auto-linked from transaction to CRM Ongoing Holdings';
          break;
        case 'auto_move_old_exits':
          type = 'crm_move';
          title = 'Position Fully Exited';
          description = 'Moved to Old Exits after position closed';
          break;
        case 'manual_edit':
          type = 'crm_update';
          title = 'CRM Record Updated';
          description = 'Manual update to company/fund details';
          break;
        case 'crm_add':
        case 'research_add':
          type = 'crm_add';
          title = 'Added to Research Pipeline';
          description = 'New company added to CRM for tracking';
          sourceModule = 'Research';
          break;
        case 'crm_move':
          type = 'crm_move';
          title = 'Status Changed';
          const moveDetails = log.details as { fromGroup?: string; toGroup?: string };
          description = moveDetails.fromGroup && moveDetails.toGroup
            ? `Moved from ${moveDetails.fromGroup} → ${moveDetails.toGroup}`
            : 'Company status updated';
          break;
        case 'watchlist_convert':
          type = 'crm_add';
          title = 'Watchlist Conversion';
          description = 'Converted from research watchlist to CRM pipeline';
          sourceModule = 'Research';
          break;
        case 'rebalance_planned': {
          type = 'rebalance';
          title = 'Rebalance Analysis';
          const rebalDetails = log.details as { numberOfTrades?: number; totalTurnover?: number; cashImpact?: number; trades?: Array<{ ticker: string; action: string; value: number; weightChange: number }> };
          description = `Planned ${rebalDetails.numberOfTrades || 0} trades with $${Math.round(rebalDetails.totalTurnover || 0).toLocaleString()} turnover`;
          sourceModule = 'Research';
          details = {
            value: rebalDetails.totalTurnover,
            trades: rebalDetails.trades
          };
          break;
        }
        case 'rebalance_executed':
          type = 'rebalance';
          title = 'Rebalance Executed';
          description = 'Portfolio rebalancing trades completed';
          sourceModule = 'Research';
          break;
        case 'compliance_check_manual': {
          type = 'compliance';
          title = 'Compliance Check';
          const compDetails = log.details as { query?: string; status?: string; reasoning?: string };
          const statusLabel = compDetails.status === 'allowed' ? 'Allowed' 
            : compDetails.status === 'allowed_with_conditions' ? 'Allowed with Conditions' 
            : 'Not Allowed';
          description = `Result: ${statusLabel}`;
          sourceModule = 'Policy';
          details = {
            status: compDetails.status,
            query: compDetails.query,
            reasoning: compDetails.reasoning
          };
          break;
        }
        case 'trade_buy':
        case 'trade_sell':
          // Skip - already handled from transactions
          return;
        default:
          title = log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          description = `Action: ${log.action}`;
      }

      events.push({
        id: `crm-${log.id}`,
        type,
        ticker: log.ticker,
        title,
        description,
        timestamp: log.created_at,
        sourceModule,
        sourceId: log.source_transaction_id || undefined,
        details
      });
    });

    // Add task events (creation only for now)
    tasks.forEach(task => {
      events.push({
        id: `task-${task.id}`,
        type: 'task',
        ticker: 'TASK',
        title: task.task_name,
        description: `Status: ${task.status.replace('_', ' ')} | Urgency: ${task.urgency}`,
        timestamp: task.created_at,
        sourceModule: 'Tasks',
        sourceId: task.id,
        details: {
          taskStatus: task.status,
          urgency: task.urgency
        }
      });
    });

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    let filtered = events;
    
    if (filter !== 'all') {
      filtered = filtered.filter(e => {
        if (filter === 'trade') return e.type === 'trade_buy' || e.type === 'trade_sell';
        if (filter === 'crm') return e.type === 'crm_add' || e.type === 'crm_move' || e.type === 'crm_update';
        if (filter === 'rebalance') return e.type === 'rebalance';
        if (filter === 'compliance') return e.type === 'compliance';
        if (filter === 'task') return e.type === 'task';
        if (filter === 'scenario') return e.type === 'scenario';
        return true;
      });
    }

    if (tickerFilter) {
      filtered = filtered.filter(e => 
        e.ticker.toLowerCase().includes(tickerFilter.toLowerCase()) ||
        e.title.toLowerCase().includes(tickerFilter.toLowerCase())
      );
    }

    return filtered;
  }, [transactions, valuations, crmLogs, tasks, filter, tickerFilter]);

  const toggleExpand = (id: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'trade_buy':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'trade_sell':
        return <TrendingDown size={16} className="text-red-400" />;
      case 'crm_add':
        return <ArrowUpRight size={16} className="text-primary" />;
      case 'crm_move':
        return <ArrowDownRight size={16} className="text-orange-400" />;
      case 'crm_update':
        return <Building2 size={16} className="text-muted-foreground" />;
      case 'rebalance':
        return <RefreshCw size={16} className="text-blue-400" />;
      case 'compliance':
        return <ShieldCheck size={16} className="text-blue-400" />;
      case 'task':
        return <ListTodo size={16} className="text-amber-400" />;
      case 'scenario':
        return <FlaskConical size={16} className="text-purple-400" />;
      default:
        return <Activity size={16} />;
    }
  };

  const getEventBadge = (event: TimelineEvent) => {
    const baseClasses = "text-[10px] font-mono uppercase tracking-wide";
    
    switch (event.type) {
      case 'trade_buy':
        return <Badge variant="outline" className={cn(baseClasses, "bg-green-500/10 text-green-400 border-green-500/30")}>BUY</Badge>;
      case 'trade_sell':
        return <Badge variant="outline" className={cn(baseClasses, "bg-red-500/10 text-red-400 border-red-500/30")}>SELL</Badge>;
      case 'crm_add':
        return <Badge variant="outline" className={cn(baseClasses, "bg-primary/10 text-primary border-primary/30")}>ADD</Badge>;
      case 'crm_move':
        return <Badge variant="outline" className={cn(baseClasses, "bg-orange-500/10 text-orange-400 border-orange-500/30")}>MOVE</Badge>;
      case 'crm_update':
        return <Badge variant="outline" className={cn(baseClasses, "bg-muted text-muted-foreground border-border")}>UPDATE</Badge>;
      case 'rebalance':
        return <Badge variant="outline" className={cn(baseClasses, "bg-blue-500/10 text-blue-400 border-blue-500/30")}>REBAL</Badge>;
      case 'compliance':
        return <Badge variant="outline" className={cn(baseClasses, "bg-blue-500/10 text-blue-400 border-blue-500/30")}>COMPLY</Badge>;
      case 'task':
        return <Badge variant="outline" className={cn(baseClasses, "bg-amber-500/10 text-amber-400 border-amber-500/30")}>TASK</Badge>;
      case 'scenario':
        return <Badge variant="outline" className={cn(baseClasses, "bg-purple-500/10 text-purple-400 border-purple-500/30")}>SCENARIO</Badge>;
      default:
        return <Badge variant="outline" className={baseClasses}>{event.type}</Badge>;
    }
  };

  const getModuleBadge = (module: TimelineEvent['sourceModule']) => {
    const colors: Record<TimelineEvent['sourceModule'], string> = {
      'Transactions': 'text-green-400',
      'CRM': 'text-primary',
      'Research': 'text-blue-400',
      'Policy': 'text-amber-400',
      'Scenarios': 'text-purple-400',
      'Tasks': 'text-amber-400'
    };
    
    return (
      <span className={cn("text-[10px] font-mono uppercase", colors[module])}>
        {module}
      </span>
    );
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

  const handleNavigate = (event: TimelineEvent) => {
    if (event.type === 'trade_buy' || event.type === 'trade_sell') {
      navigate(`/transactions?highlight=${event.sourceId}`);
    } else if (event.type === 'rebalance') {
      navigate('/research');
    }
  };

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: TimelineEvent[] }[] = [];
    let currentDate = '';
    
    timelineEvents.forEach(event => {
      const eventDate = format(new Date(event.timestamp), 'yyyy-MM-dd');
      if (eventDate !== currentDate) {
        currentDate = eventDate;
        groups.push({ date: eventDate, events: [event] });
      } else {
        groups[groups.length - 1].events.push(event);
      }
    });
    
    return groups;
  }, [timelineEvents]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card/50 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as EventType)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="trade">Trades</SelectItem>
              <SelectItem value="crm">CRM Changes</SelectItem>
              <SelectItem value="rebalance">Rebalance</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by ticker or name..."
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            className="h-8 text-xs pl-9 pr-8"
          />
          {tickerFilter && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setTickerFilter('')}
            >
              <X size={12} />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
          <Activity size={12} />
          <span>{timelineEvents.length} events</span>
        </div>
      </div>

      {/* Timeline */}
      {timelineEvents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No activity recorded yet.</p>
          <p className="text-xs mt-1">Events will appear here as you trade, update CRM, and run analyses.</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-6 pr-4">
            {groupedEvents.map(group => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-background py-2 z-10">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {format(new Date(group.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="outline" className="text-[10px]">
                    {group.events.length} events
                  </Badge>
                </div>

                {/* Events */}
                <div className="space-y-2 pl-2 border-l-2 border-border ml-1">
                  {group.events.map(event => (
                    <Collapsible
                      key={event.id}
                      open={expandedEvents.has(event.id)}
                      onOpenChange={() => toggleExpand(event.id)}
                    >
                      <div className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[11px] top-4 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                          {getEventIcon(event)}
                        </div>

                        {/* Event Card */}
                        <div className="ml-6 bg-card/50 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 cursor-pointer">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {event.ticker !== 'TASK' && event.ticker !== 'PORTFOLIO' && (
                                    <span className="font-mono text-sm font-semibold text-primary">
                                      {event.ticker}
                                    </span>
                                  )}
                                  {getEventBadge(event)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{event.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                {event.details?.value && (
                                  <span className="font-mono text-foreground">
                                    {formatValue(event.details.value)}
                                  </span>
                                )}
                                {getModuleBadge(event.sourceModule)}
                                <span className="w-[50px] text-right font-mono">
                                  {format(new Date(event.timestamp), 'HH:mm')}
                                </span>
                                {expandedEvents.has(event.id) ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="px-3 pb-3 pt-0 border-t border-border/50">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs">
                                {event.details?.quantity && (
                                  <div>
                                    <span className="text-muted-foreground">Quantity</span>
                                    <p className="font-mono font-medium">{event.details.quantity.toLocaleString()}</p>
                                  </div>
                                )}
                                {event.details?.price && (
                                  <div>
                                    <span className="text-muted-foreground">Price</span>
                                    <p className="font-mono font-medium">${event.details.price.toFixed(2)}</p>
                                  </div>
                                )}
                                {event.details?.value && (
                                  <div>
                                    <span className="text-muted-foreground">Value</span>
                                    <p className="font-mono font-medium">{formatValue(event.details.value)}</p>
                                  </div>
                                )}
                                {event.details?.weight !== undefined && event.details.weight > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Portfolio Weight</span>
                                    <p className="font-mono font-medium">{event.details.weight.toFixed(2)}%</p>
                                  </div>
                                )}
                                {event.details?.status && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Status</span>
                                    <p className={cn(
                                      "font-medium",
                                      event.details.status === 'allowed' && "text-green-400",
                                      event.details.status === 'allowed_with_conditions' && "text-amber-400",
                                      event.details.status === 'not_allowed' && "text-red-400"
                                    )}>
                                      {event.details.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                  </div>
                                )}
                                {event.details?.query && (
                                  <div className="col-span-full">
                                    <span className="text-muted-foreground">Query</span>
                                    <p className="font-medium text-foreground">{event.details.query}</p>
                                  </div>
                                )}
                                {event.details?.reasoning && (
                                  <div className="col-span-full">
                                    <span className="text-muted-foreground">Reasoning</span>
                                    <p className="text-muted-foreground">{event.details.reasoning}</p>
                                  </div>
                                )}
                                {event.details?.trades && event.details.trades.length > 0 && (
                                  <div className="col-span-full">
                                    <span className="text-muted-foreground mb-2 block">Planned Trades</span>
                                    <div className="space-y-1">
                                      {event.details.trades.slice(0, 5).map((t, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                                          <span className="font-mono text-primary">{t.ticker}</span>
                                          <span className={t.action === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                            {t.action.toUpperCase()}
                                          </span>
                                          <span className="font-mono">{formatValue(t.value)}</span>
                                          <span className="text-muted-foreground">
                                            {t.weightChange > 0 ? '+' : ''}{t.weightChange.toFixed(2)}%
                                          </span>
                                        </div>
                                      ))}
                                      {event.details.trades.length > 5 && (
                                        <p className="text-muted-foreground text-center">
                                          +{event.details.trades.length - 5} more trades
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Navigation Link */}
                              {(event.type === 'trade_buy' || event.type === 'trade_sell' || event.type === 'rebalance') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-3 h-7 text-xs gap-1"
                                  onClick={() => handleNavigate(event)}
                                >
                                  <ExternalLink size={12} />
                                  View in {event.sourceModule}
                                </Button>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-card/30 rounded-lg border border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <DollarSign size={12} className="text-green-400" />
            Trades: {timelineEvents.filter(e => e.type === 'trade_buy' || e.type === 'trade_sell').length}
          </span>
          <span className="flex items-center gap-1">
            <Building2 size={12} className="text-primary" />
            CRM: {timelineEvents.filter(e => e.type.startsWith('crm')).length}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-blue-400" />
            Compliance: {timelineEvents.filter(e => e.type === 'compliance').length}
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw size={12} className="text-blue-400" />
            Rebalance: {timelineEvents.filter(e => e.type === 'rebalance').length}
          </span>
        </div>
        <span className="font-mono">
          Last updated: {format(new Date(), 'MMM d, HH:mm')}
        </span>
      </div>
    </div>
  );
}
