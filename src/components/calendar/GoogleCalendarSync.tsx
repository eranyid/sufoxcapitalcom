import { useEffect, useState } from 'react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarEvent } from '@/types/calendar';
import { 
  Link2, 
  Unlink, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  AlertCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface GoogleCalendarSyncProps {
  localEvents: CalendarEvent[];
  onSyncToGoogle?: (event: CalendarEvent) => void;
}

export function GoogleCalendarSync({ localEvents, onSyncToGoogle }: GoogleCalendarSyncProps) {
  const {
    connectionStatus,
    isConnecting,
    isLoading,
    googleEvents,
    connect,
    disconnect,
    checkConnection,
    fetchEvents,
    createEvent,
  } = useGoogleCalendar();

  const [isInitializing, setIsInitializing] = useState(true);
  const [syncingEvents, setSyncingEvents] = useState<Set<string>>(new Set());

  // Check connection and handle OAuth callback on mount
  useEffect(() => {
    const init = async () => {
      // Handle OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      // Check if we're in a popup - if so, handle callback differently
      const isPopup = window.opener && window.opener !== window;
      
      if (isPopup && code) {
        // Post message to parent window
        try {
          window.opener.postMessage(
            { type: 'google-oauth-callback', code },
            window.location.origin
          );
          // Close popup after a short delay
          setTimeout(() => window.close(), 500);
        } catch (err) {
          console.error('Failed to post message to parent:', err);
        }
        return;
      }
      
      if (code && !isPopup) {
        // Direct redirect mode - exchange code
        await connect();
        // Clean URL after handling
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        // Handle OAuth error
        console.error('OAuth error:', error);
      }
      
      await checkConnection();
      setIsInitializing(false);
    };

    init();
  }, [checkConnection, connect]);

  // Fetch events when connected
  useEffect(() => {
    if (connectionStatus.connected && !isInitializing) {
      fetchEvents();
    }
  }, [connectionStatus.connected, isInitializing, fetchEvents]);

  const handleSyncEvent = async (event: CalendarEvent) => {
    setSyncingEvents(prev => new Set(prev).add(event.id));
    
    try {
      await createEvent({
        title: event.title,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        allDay: event.allDay,
        location: event.location,
        notes: event.notes,
        timezone: event.timezone,
      });
      
      onSyncToGoogle?.(event);
    } catch (error) {
      // Error already handled in hook
    } finally {
      setSyncingEvents(prev => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
    }
  };

  const handleRefresh = async () => {
    await fetchEvents();
    toast.success('Events refreshed');
  };

  if (isInitializing) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              connectionStatus.connected 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-muted text-muted-foreground"
            )}>
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Google Calendar</h3>
              <p className="text-xs text-muted-foreground">
                {connectionStatus.connected 
                  ? connectionStatus.isExpired 
                    ? 'Token expired - click refresh'
                    : 'Connected and syncing'
                  : 'Not connected'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {connectionStatus.connected ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="text-destructive hover:text-destructive"
                >
                  <Unlink className="h-4 w-4 mr-1.5" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={connect}
                disabled={isConnecting}
                size="sm"
              >
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-1.5" />
                )}
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>

      {connectionStatus.connected && (
        <>
          {/* Sync Local Events to Google */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-medium mb-3">Sync to Google Calendar</h4>
            
            {localEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No local events to sync
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {localEvents.slice(0, 10).map((event) => (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.allDay 
                          ? format(parseISO(event.startDateTime), 'MMM d, yyyy')
                          : format(parseISO(event.startDateTime), 'MMM d, HH:mm')
                        }
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncEvent(event)}
                      disabled={syncingEvents.has(event.id)}
                    >
                      {syncingEvents.has(event.id) ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Google Calendar Events */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">From Google Calendar</h4>
              <span className="text-xs text-muted-foreground">
                {googleEvents.length} events
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : googleEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming events in Google Calendar
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {googleEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.allDay 
                          ? format(parseISO(event.startDateTime), 'MMM d, yyyy')
                          : format(parseISO(event.startDateTime), 'MMM d, HH:mm')
                        }
                      </p>
                    </div>
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Connection Instructions - show only when not connected */}
      {!connectionStatus.connected && !isConnecting && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex gap-3">
            <CalendarIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Connect to Google Calendar</p>
              <p>
                Click the "Connect" button above to sync your calendar events with Google Calendar.
                You'll be redirected to Google to authorize access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
