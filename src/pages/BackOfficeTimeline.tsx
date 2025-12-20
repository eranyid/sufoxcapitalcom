import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Filter, Calendar, TrendingUp, CheckSquare, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCrmCompanies } from '@/hooks/useCrmCompanies';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Input } from '@/components/ui/input';

interface TimelineEvent {
  id: string;
  type: 'decision' | 'task_activity' | 'crm_activity';
  timestamp: string;
  companyId: string | null;
  companyName: string | null;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export default function BackOfficeTimeline() {
  const { user } = useAuth();
  const { companies } = useCrmCompanies();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Create company lookup
  const companyMap = useMemo(() => {
    return companies.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, typeof companies[0]>);
  }, [companies]);

  // Fetch all timeline data
  useEffect(() => {
    if (!user) return;

    const fetchTimelineData = async () => {
      setLoading(true);
      const allEvents: TimelineEvent[] = [];

      // Fetch company decisions
      const { data: decisions } = await supabase
        .from('company_decisions')
        .select('*')
        .eq('user_id', user.id)
        .order('decision_date', { ascending: false });

      if (decisions) {
        decisions.forEach(d => {
          const company = companyMap[d.company_id];
          allEvents.push({
            id: `decision-${d.id}`,
            type: 'decision',
            timestamp: d.decision_date,
            companyId: d.company_id,
            companyName: company?.company_name || 'Unknown Company',
            title: `Investment Decision: ${d.decision_type}`,
            description: d.rationale,
          });
        });
      }

      // Fetch task activity logs
      const { data: taskActivities } = await supabase
        .from('task_activity_log')
        .select('*, crm_tasks(task_name, company_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (taskActivities) {
        taskActivities.forEach(a => {
          const task = a.crm_tasks as { task_name: string; company_id: string | null } | null;
          const company = task?.company_id ? companyMap[task.company_id] : null;
          allEvents.push({
            id: `task-${a.id}`,
            type: 'task_activity',
            timestamp: a.created_at,
            companyId: task?.company_id || null,
            companyName: company?.company_name || null,
            title: `Task: ${task?.task_name || 'Unknown'}`,
            description: a.field_name 
              ? `${a.field_name} changed from "${a.old_value || 'none'}" to "${a.new_value || 'none'}"`
              : a.action,
          });
        });
      }

      // Fetch CRM activity logs
      const { data: crmActivities } = await supabase
        .from('crm_activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (crmActivities) {
        crmActivities.forEach(a => {
          // Find company by ticker
          const company = companies.find(c => c.ticker === a.ticker);
          allEvents.push({
            id: `crm-${a.id}`,
            type: 'crm_activity',
            timestamp: a.created_at,
            companyId: company?.id || null,
            companyName: company?.company_name || a.ticker,
            title: `${a.action}`,
            description: a.ticker,
            metadata: a.details as Record<string, unknown>,
          });
        });
      }

      // Sort all events by timestamp descending
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setEvents(allEvents);
      setLoading(false);
    };

    fetchTimelineData();
  }, [user, companyMap, companies]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Type filter
      if (typeFilter !== 'all' && event.type !== typeFilter) return false;
      
      // Company filter
      if (companyFilter !== 'all' && event.companyId !== companyFilter) return false;
      
      // Date range filter
      if (dateFrom) {
        const fromDate = startOfDay(parseISO(dateFrom));
        if (isBefore(parseISO(event.timestamp), fromDate)) return false;
      }
      if (dateTo) {
        const toDate = endOfDay(parseISO(dateTo));
        if (isAfter(parseISO(event.timestamp), toDate)) return false;
      }
      
      return true;
    });
  }, [events, typeFilter, companyFilter, dateFrom, dateTo]);

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'decision':
        return <TrendingUp className="h-4 w-4" />;
      case 'task_activity':
        return <CheckSquare className="h-4 w-4" />;
      case 'crm_activity':
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'decision':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'task_activity':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'crm_activity':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  const getTypeLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'decision':
        return 'Decision';
      case 'task_activity':
        return 'Task';
      case 'crm_activity':
        return 'Activity';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Timeline</h1>
            <p className="text-xs text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} across all companies
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="decision">Decisions</SelectItem>
            <SelectItem value="task_activity">Task Activity</SelectItem>
            <SelectItem value="crm_activity">CRM Activity</SelectItem>
          </SelectContent>
        </Select>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[140px] bg-card border-border"
            placeholder="From"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[140px] bg-card border-border"
            placeholder="To"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {events.length === 0 ? 'No timeline events yet' : 'No events match your filters'}
          </div>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id}
              className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:bg-muted/20 transition-colors"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center border ${getEventColor(event.type)}`}>
                {getEventIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border ${getEventColor(event.type)}`}>
                        {getTypeLabel(event.type)}
                      </span>
                      <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{format(parseISO(event.timestamp), 'MMM d, yyyy h:mm a')}</span>
                      {event.companyId && event.companyName && (
                        <>
                          <span>•</span>
                          <Link
                            to={`/backoffice/company/${event.companyId}`}
                            className="text-primary hover:underline"
                          >
                            {event.companyName}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
