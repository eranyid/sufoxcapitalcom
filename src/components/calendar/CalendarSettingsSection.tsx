import { useState } from 'react';
import { RefreshCw, Link2, Unlink, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function CalendarSettingsSection() {
  const { 
    integration, 
    isLoading, 
    saveUrl, 
    disconnect, 
    syncCalendar, 
    isSyncing 
  } = useCalendarIntegration();

  const [icsUrl, setIcsUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const hasIntegration = !!integration?.ics_url;

  const handleSave = () => {
    if (icsUrl.trim()) {
      saveUrl.mutate(icsUrl.trim(), {
        onSuccess: () => {
          setIcsUrl('');
          setShowUrlInput(false);
        }
      });
    }
  };

  const handleDisconnect = () => {
    disconnect.mutate();
  };

  const handleSync = () => {
    syncCalendar.mutate();
  };

  const getStatusIcon = () => {
    if (!integration) return null;
    switch (integration.sync_status) {
      case 'success':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'error':
        return <XCircle size={14} className="text-destructive" />;
      default:
        return <AlertCircle size={14} className="text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bloomberg-panel p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Calendar Integration</span>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your Google Calendar by providing a public ICS URL. Events will be synced and displayed in your calendar.
        </p>

        {hasIntegration && !showUrlInput ? (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="currentColor">
                    <path d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5z" opacity="0.2"/>
                    <path d="M12 7v5l4 2"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Google Calendar</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {integration?.ics_url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
              </div>
            </div>

            {/* Last Sync Info */}
            {integration?.last_synced_at && (
              <div className="text-xs text-muted-foreground">
                Last synced: {format(new Date(integration.last_synced_at), 'MMM d, yyyy h:mm a')}
              </div>
            )}

            {/* Sync Error */}
            {integration?.sync_error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                {integration.sync_error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="gap-1.5"
              >
                <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUrlInput(true)}
                className="gap-1.5"
              >
                <Link2 size={14} />
                Change URL
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Unlink size={14} />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ics-url">Google Calendar ICS URL</Label>
              <Input
                id="ics-url"
                type="url"
                value={icsUrl}
                onChange={(e) => setIcsUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/..."
              />
              <p className="text-xs text-muted-foreground">
                Find this in Google Calendar → Settings → Calendar → Secret address in iCal format
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!icsUrl.trim() || saveUrl.isPending}
              >
                {saveUrl.isPending ? 'Saving...' : 'Save'}
              </Button>
              {showUrlInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUrlInput(false);
                    setIcsUrl('');
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
