import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ShieldCheck, 
  ListTodo,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  id: string;
  type: 'trade_buy' | 'trade_sell' | 'crm_add' | 'crm_move' | 'crm_update' | 'rebalance' | 'compliance' | 'task' | 'scenario';
  ticker: string;
  title: string;
  description: string;
  timestamp: string;
  sourceModule: 'Transactions' | 'CRM' | 'Research' | 'Policy' | 'Scenarios' | 'Tasks';
  sourceId?: string;
  status?: 'planned' | 'executed';
  details?: {
    quantity?: number;
    price?: number;
    value?: number;
    weight?: number;
    pnl?: number;
    status?: string;
    query?: string;
    reasoning?: string;
    taskStatus?: string;
    urgency?: string;
    dueDate?: string;
  };
}

type EventCategory = 'trades' | 'rebalance' | 'compliance' | 'research' | 'tasks';

interface Props {
  events: CalendarEvent[];
  onNavigate?: (path: string, params?: Record<string, string>) => void;
}

const categoryFilters: { id: EventCategory; label: string; color: string }[] = [
  { id: 'trades', label: 'Trades', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'rebalance', label: 'Rebalance', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'compliance', label: 'Compliance', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'research', label: 'Research', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'tasks', label: 'Tasks', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
];

export default function OperationalCalendar({ events, onNavigate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(
    new Set(['trades', 'rebalance', 'compliance', 'research', 'tasks'])
  );

  const toggleFilter = (category: EventCategory) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filterEvent = (event: CalendarEvent): boolean => {
    if (activeFilters.size === 0) return false;
    
    if (event.type === 'trade_buy' || event.type === 'trade_sell') {
      return activeFilters.has('trades');
    }
    if (event.type === 'rebalance') {
      return activeFilters.has('rebalance');
    }
    if (event.type === 'compliance') {
      return activeFilters.has('compliance');
    }
    if (event.type === 'crm_add' || event.type === 'crm_move' || event.type === 'crm_update' || event.type === 'scenario') {
      return activeFilters.has('research');
    }
    if (event.type === 'task') {
      return activeFilters.has('tasks');
    }
    return true;
  };

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    events.filter(filterEvent).forEach(event => {
      const dateKey = format(parseISO(event.timestamp), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      existing.push(event);
      map.set(dateKey, existing);
    });
    
    return map;
  }, [events, activeFilters]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Get day metrics
  const getDayMetrics = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = eventsByDate.get(dateKey) || [];
    
    const trades = dayEvents.filter(e => e.type === 'trade_buy' || e.type === 'trade_sell').length;
    const tasks = dayEvents.filter(e => e.type === 'task').length;
    const overdueTasks = dayEvents.filter(e => 
      e.type === 'task' && 
      e.details?.taskStatus !== 'done' &&
      e.details?.dueDate &&
      new Date(e.details.dueDate) < new Date()
    ).length;
    const complianceFlags = dayEvents.filter(e => 
      e.type === 'compliance' && 
      e.details?.status !== 'allowed'
    ).length;
    
    return { trades, tasks, overdueTasks, complianceFlags, total: dayEvents.length };
  };

  // Selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return (eventsByDate.get(dateKey) || []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [selectedDate, eventsByDate]);

  // Day summary
  const daySummary = useMemo(() => {
    if (!selectedDate) return null;
    
    const events = selectedDayEvents;
    const trades = events.filter(e => e.type === 'trade_buy' || e.type === 'trade_sell');
    const buyValue = trades
      .filter(e => e.type === 'trade_buy')
      .reduce((sum, e) => sum + (e.details?.value || 0), 0);
    const sellValue = trades
      .filter(e => e.type === 'trade_sell')
      .reduce((sum, e) => sum + (e.details?.value || 0), 0);
    const netFlow = sellValue - buyValue;
    
    const complianceFlags = events.filter(e => 
      e.type === 'compliance' && e.details?.status !== 'allowed'
    ).length;
    
    const overdueTasks = events.filter(e =>
      e.type === 'task' &&
      e.details?.taskStatus !== 'completed' &&
      e.details?.dueDate &&
      new Date(e.details.dueDate) < new Date()
    ).length;
    
    return {
      trades: trades.length,
      netFlow,
      complianceFlags,
      overdueTasks
    };
  }, [selectedDayEvents, selectedDate]);

  const getEventIcon = (event: CalendarEvent) => {
    switch (event.type) {
      case 'trade_buy':
        return <TrendingUp size={14} className="text-green-400" />;
      case 'trade_sell':
        return <TrendingDown size={14} className="text-red-400" />;
      case 'rebalance':
        return <RefreshCw size={14} className="text-blue-400" />;
      case 'compliance':
        return <ShieldCheck size={14} className="text-amber-400" />;
      case 'task':
        return <ListTodo size={14} className="text-orange-400" />;
      default:
        return null;
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

  const handleEventClick = (event: CalendarEvent) => {
    if (!onNavigate) return;
    
    if (event.type === 'trade_buy' || event.type === 'trade_sell') {
      onNavigate('/transactions', { highlight: event.sourceId || '' });
    } else if (event.type === 'rebalance') {
      onNavigate('/research');
    } else if (event.type === 'compliance') {
      onNavigate('/policy');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categoryFilters.map(cat => (
          <button
            key={cat.id}
            onClick={() => toggleFilter(cat.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
              activeFilters.has(cat.id)
                ? cat.color
                : "bg-muted/30 text-muted-foreground border-border opacity-50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Week Header */}
        <div className="grid grid-cols-7 bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground border-b border-border"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const metrics = getDayMetrics(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEvents = metrics.total > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[80px] p-1.5 border-b border-r border-border text-left transition-colors",
                  !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                  isCurrentMonth && "bg-card hover:bg-muted/20",
                  isToday(day) && "ring-1 ring-primary ring-inset",
                  isSelected && "bg-primary/10"
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasEvents && (
                    <div className="flex flex-wrap gap-0.5 justify-end">
                      {metrics.trades > 0 && (
                        <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded bg-green-500/20 text-green-400">
                          {metrics.trades}
                        </span>
                      )}
                      {metrics.tasks > 0 && (
                        <span className={cn(
                          "w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded",
                          metrics.overdueTasks > 0
                            ? "bg-red-500/20 text-red-400"
                            : "bg-orange-500/20 text-orange-400"
                        )}>
                          {metrics.tasks}
                        </span>
                      )}
                      {metrics.complianceFlags > 0 && (
                        <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded bg-amber-500/20 text-amber-400">
                          !
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Activity Drawer */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Day Activity</span>
              <span className="text-sm font-normal text-muted-foreground">
                {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Day Summary */}
          {daySummary && (
            <div className="grid grid-cols-4 gap-2 py-4 border-b border-border">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{daySummary.trades}</div>
                <div className="text-[10px] text-muted-foreground">Trades</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-lg font-bold",
                  daySummary.netFlow >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {daySummary.netFlow >= 0 ? '+' : ''}{formatValue(daySummary.netFlow)}
                </div>
                <div className="text-[10px] text-muted-foreground">Net Flow</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-lg font-bold",
                  daySummary.complianceFlags > 0 ? "text-amber-400" : "text-muted-foreground"
                )}>
                  {daySummary.complianceFlags}
                </div>
                <div className="text-[10px] text-muted-foreground">Flags</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-lg font-bold",
                  daySummary.overdueTasks > 0 ? "text-red-400" : "text-muted-foreground"
                )}>
                  {daySummary.overdueTasks}
                </div>
                <div className="text-[10px] text-muted-foreground">Overdue</div>
              </div>
            </div>
          )}

          {/* Events List */}
          <ScrollArea className="h-[calc(100vh-220px)] mt-4">
            {selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ListTodo className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No activity on this day</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {selectedDayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={cn(
                      "p-3 rounded-lg border border-border bg-card/50 transition-colors",
                      onNavigate && (event.type === 'trade_buy' || event.type === 'trade_sell' || event.type === 'rebalance')
                        ? "cursor-pointer hover:bg-muted/30"
                        : ""
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-muted/30 shrink-0">
                        {getEventIcon(event)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {event.ticker}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] px-1.5",
                              event.status === 'planned' 
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" 
                                : "bg-green-500/10 text-green-400 border-green-500/30"
                            )}
                          >
                            {event.status === 'planned' ? 'PLANNED' : 'EXECUTED'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{format(parseISO(event.timestamp), 'HH:mm')}</span>
                          {event.details?.value && (
                            <span className="font-mono text-foreground">
                              {formatValue(event.details.value)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
