import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Link2, Link2Off, ExternalLink, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameMonth, isSameDay, parseISO, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'day';

interface TaskCalendarLink {
  id: string;
  task_id: string;
  event_id: string;
  calendar_id: string;
  status: 'linked' | 'cancelled' | 'error';
  last_synced_at: string | null;
  last_error: string | null;
}

export default function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [includeAllDay, setIncludeAllDay] = useState(true);
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);
  const [showTaskEvents, setShowTaskEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [taskLinks, setTaskLinks] = useState<TaskCalendarLink[]>([]);
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const {
    isConnected,
    isLoading: connectionLoading,
    calendars,
    events,
    eventsLoading,
    lastError,
    errorCode,
    connect,
    disconnect,
    exchangeCode,
    fetchCalendars,
    fetchEvents,
    syncTask,
    checkConnection,
  } = useGoogleCalendar();

  const { tasks, loading: tasksLoading } = useCrmTasks();

  // Handle OAuth callback - both success and error cases
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      // Handle OAuth error from Google
      console.error('[Calendar] OAuth error:', error, errorDescription);
      
      let userMessage = 'Google Calendar connection failed.';
      switch (error) {
        case 'access_denied':
          userMessage = 'Access was denied. Please grant calendar permissions when prompted.';
          break;
        case 'invalid_scope':
          userMessage = 'Invalid permissions requested. Please try again.';
          break;
        case 'unauthorized_client':
          userMessage = 'This app is not authorized. The OAuth app may be in testing mode - ask the app owner to add your Google account as a test user.';
          break;
        case 'org_internal':
          userMessage = 'This app is restricted to internal organization users only.';
          break;
        default:
          userMessage = errorDescription || `Connection failed: ${error}`;
      }
      
      setOauthError(userMessage);
      setSearchParams({});
      return;
    }
    
    if (code) {
      setOauthError(null);
      exchangeCode(code).then((success) => {
        if (success) {
          setSearchParams({});
        }
      });
    }
  }, [searchParams, exchangeCode, setSearchParams]);

  // Fetch calendars when connected
  useEffect(() => {
    if (isConnected) {
      fetchCalendars();
    }
  }, [isConnected, fetchCalendars]);

  // Fetch events based on view and date
  const { timeMin, timeMax } = useMemo(() => {
    let start: Date, end: Date;
    
    if (viewMode === 'month') {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    }

    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    };
  }, [currentDate, viewMode]);

  useEffect(() => {
    if (isConnected) {
      fetchEvents(timeMin, timeMax, selectedCalendar, includeAllDay);
    }
  }, [isConnected, timeMin, timeMax, selectedCalendar, includeAllDay, fetchEvents]);

  // Fetch task calendar links
  useEffect(() => {
    const fetchLinks = async () => {
      const { data } = await supabase
        .from('task_calendar_links')
        .select('*');
      
      if (data) {
        setTaskLinks(data as TaskCalendarLink[]);
      }
    };
    fetchLinks();
  }, []);

  const getTaskLink = useCallback((taskId: string) => {
    return taskLinks.find(l => l.task_id === taskId);
  }, [taskLinks]);

  const handleSyncTask = async (taskId: string, action: 'create' | 'update' | 'cancel') => {
    setSyncingTaskId(taskId);
    const success = await syncTask(taskId, action, selectedCalendar);
    if (success) {
      // Refresh links
      const { data } = await supabase.from('task_calendar_links').select('*');
      if (data) setTaskLinks(data as TaskCalendarLink[]);
      // Refresh events
      fetchEvents(timeMin, timeMax, selectedCalendar, includeAllDay);
    }
    setSyncingTaskId(null);
  };

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    
    const fn = direction === 'prev' ? 
      (viewMode === 'month' ? subMonths : viewMode === 'week' ? subWeeks : subDays) :
      (viewMode === 'month' ? addMonths : viewMode === 'week' ? addWeeks : addDays);
    
    setCurrentDate(fn(currentDate, 1));
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.isTask && !showTaskEvents) return false;
      if (!e.isTask && !showGoogleEvents) return false;
      return true;
    });
  }, [events, showGoogleEvents, showTaskEvents]);

  // Generate calendar grid for month view
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const getEventsForDay = useCallback((day: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.start);
      return isSameDay(eventDate, day);
    });
  }, [filteredEvents]);

  // Integration health stats
  const healthStats = useMemo(() => {
    const linkedTasks = taskLinks.filter(l => l.status === 'linked').length;
    const errorTasks = taskLinks.filter(l => l.status === 'error').length;
    const lastSync = taskLinks
      .filter(l => l.last_synced_at)
      .sort((a, b) => new Date(b.last_synced_at!).getTime() - new Date(a.last_synced_at!).getTime())[0];

    return {
      eventsLoaded: events.length,
      tasksSynced: linkedTasks,
      errors: errorTasks,
      lastSync: lastSync?.last_synced_at,
      lastError: taskLinks.find(l => l.last_error)?.last_error,
    };
  }, [events, taskLinks]);

  if (connectionLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">CALENDAR</h1>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button onClick={connect} className="bg-primary hover:bg-primary/90">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          ) : (
            <>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              <Button variant="outline" size="sm" onClick={connect}>
                Reconnect
              </Button>
              <Button variant="destructive" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>

      {/* OAuth Error from Google redirect */}
      {oauthError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-1">Connection Failed</h4>
                <p className="text-sm text-muted-foreground mb-3">{oauthError}</p>
                <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                  <strong>Troubleshooting:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>If you see "403" or "access denied", the OAuth app may be in Testing mode</li>
                    <li>Ask the app owner to add your Google account as a test user</li>
                    <li>Or publish the OAuth app for production use</li>
                    <li>Check that your redirect URI matches exactly: <code className="bg-muted px-1 rounded">{window.location.origin}/calendar</code></li>
                  </ul>
                </div>
                <Button size="sm" onClick={() => { setOauthError(null); connect(); }}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API/Connection Error */}
      {lastError && !oauthError && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-3 flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{lastError}</span>
            {errorCode && <Badge variant="outline" className="text-xs">{errorCode}</Badge>}
            <Button variant="outline" size="sm" className="ml-auto" onClick={connect}>
              Reconnect
            </Button>
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="task-sync">Task Sync</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('today')}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <span className="font-semibold">
                {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
                {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
              </span>

              <div className="flex-1" />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="google-events"
                    checked={showGoogleEvents}
                    onCheckedChange={setShowGoogleEvents}
                  />
                  <Label htmlFor="google-events" className="text-sm">Google Events</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="task-events"
                    checked={showTaskEvents}
                    onCheckedChange={setShowTaskEvents}
                  />
                  <Label htmlFor="task-events" className="text-sm">Tasks</Label>
                </div>
              </div>

              {calendars.length > 0 && (
                <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        {cal.summary} {cal.primary && '(Primary)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchEvents(timeMin, timeMax, selectedCalendar, includeAllDay)}
                disabled={eventsLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", eventsLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-0">
                {viewMode === 'month' && (
                  <div className="grid grid-cols-7">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day, idx) => {
                      const dayEvents = getEventsForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isCurrentDay = isToday(day);

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "min-h-[100px] p-1 border-b border-r",
                            !isCurrentMonth && "bg-muted/30",
                            isCurrentDay && "bg-primary/5"
                          )}
                        >
                          <div className={cn(
                            "text-sm mb-1 px-1",
                            isCurrentDay && "text-primary font-bold",
                            !isCurrentMonth && "text-muted-foreground"
                          )}>
                            {format(day, 'd')}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={cn(
                                  "text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                                  event.isTask
                                    ? "bg-primary/20 text-primary"
                                    : "bg-blue-500/20 text-blue-500"
                                )}
                              >
                                {event.summary}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground px-1">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'week' && (
                  <div className="divide-y">
                    {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate), i)).map((day) => {
                      const dayEvents = getEventsForDay(day);
                      return (
                        <div key={day.toISOString()} className="p-3">
                          <div className={cn(
                            "text-sm font-medium mb-2",
                            isToday(day) && "text-primary"
                          )}>
                            {format(day, 'EEEE, MMM d')}
                          </div>
                          {dayEvents.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No events</div>
                          ) : (
                            <div className="space-y-1">
                              {dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={cn(
                                    "text-sm px-2 py-1 rounded cursor-pointer hover:opacity-80 flex items-center gap-2",
                                    event.isTask
                                      ? "bg-primary/20 text-primary"
                                      : "bg-blue-500/20 text-blue-500"
                                  )}
                                >
                                  <Clock className="h-3 w-3" />
                                  <span>{!event.isAllDay && format(parseISO(event.start), 'HH:mm')}</span>
                                  <span className="truncate">{event.summary}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'day' && (
                  <div className="p-4">
                    <div className="text-lg font-medium mb-4">{format(currentDate, 'EEEE, MMMM d, yyyy')}</div>
                    {filteredEvents.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">No events for this day</div>
                    ) : (
                      <div className="space-y-2">
                        {filteredEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={cn(
                              "p-3 rounded-lg cursor-pointer hover:opacity-80 border",
                              event.isTask
                                ? "bg-primary/10 border-primary/30"
                                : "bg-blue-500/10 border-blue-500/30"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {event.isAllDay ? 'All day' : `${format(parseISO(event.start), 'HH:mm')} - ${format(parseISO(event.end), 'HH:mm')}`}
                              </span>
                            </div>
                            <div className="font-medium mt-1">{event.summary}</div>
                            {event.location && (
                              <div className="text-sm text-muted-foreground mt-1">{event.location}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Integration Health */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Integration Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Calendar</div>
                    <div className="font-mono">{selectedCalendar}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Events Loaded</div>
                    <div className="font-mono">{healthStats.eventsLoaded}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tasks Synced</div>
                    <div className="font-mono">{healthStats.tasksSynced}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Sync</div>
                    <div className="font-mono">
                      {healthStats.lastSync ? format(parseISO(healthStats.lastSync), 'HH:mm:ss') : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Errors</div>
                    <div className={cn("font-mono", healthStats.errors > 0 && "text-destructive")}>
                      {healthStats.errors}
                    </div>
                  </div>
                </div>
                {healthStats.lastError && (
                  <div className="mt-2 text-xs text-destructive">
                    Last error: {healthStats.lastError}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="task-sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Task → Calendar Sync</CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Calendar</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => {
                        const link = getTaskLink(task.id);
                        const isSyncing = syncingTaskId === task.id;
                        const hasDueDate = !!task.due_date;

                        return (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {task.task_name}
                            </TableCell>
                            <TableCell>
                              {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{task.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={task.urgency === 'high' ? 'destructive' : 'secondary'}>
                                {task.urgency}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {link?.status === 'linked' && (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                                  <Link2 className="h-3 w-3 mr-1" />
                                  Linked
                                </Badge>
                              )}
                              {link?.status === 'error' && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="destructive">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Error
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>{link.last_error}</TooltipContent>
                                </Tooltip>
                              )}
                              {link?.status === 'cancelled' && (
                                <Badge variant="secondary">Cancelled</Badge>
                              )}
                              {!link && (
                                <span className="text-muted-foreground text-sm">Not linked</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {!link || link.status !== 'linked' ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSyncTask(task.id, 'create')}
                                        disabled={!hasDueDate || isSyncing}
                                      >
                                        {isSyncing ? (
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Link2 className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {hasDueDate ? 'Create Event' : 'Set due date first'}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleSyncTask(task.id, 'update')}
                                          disabled={isSyncing}
                                        >
                                          <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Update Event</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleSyncTask(task.id, 'cancel')}
                                          disabled={isSyncing}
                                        >
                                          <Link2Off className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Cancel Event</TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Calendar Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <Label>Calendar ID</Label>
                    <span className="font-mono text-sm text-muted-foreground">{selectedCalendar}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="all-day">Include All-Day Events</Label>
                    <Switch
                      id="all-day"
                      checked={includeAllDay}
                      onCheckedChange={setIncludeAllDay}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Timezone</Label>
                    <span className="font-mono text-sm text-muted-foreground">Asia/Jerusalem</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Default Event Time</Label>
                    <span className="font-mono text-sm text-muted-foreground">10:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Event Details Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedEvent?.summary}</SheetTitle>
            <SheetDescription>
              {selectedEvent?.isTask ? 'SUFOX Task Event' : 'Google Calendar Event'}
            </SheetDescription>
          </SheetHeader>
          {selectedEvent && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-muted-foreground">Time</Label>
                <p className="font-medium">
                  {selectedEvent.isAllDay
                    ? 'All day'
                    : `${format(parseISO(selectedEvent.start), 'MMM d, yyyy HH:mm')} - ${format(parseISO(selectedEvent.end), 'HH:mm')}`}
                </p>
              </div>

              {selectedEvent.location && (
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div className="pt-4">
                <Button asChild variant="outline" className="w-full">
                  <a href={selectedEvent.htmlLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Calendar
                  </a>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
