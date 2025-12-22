import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string;
  status: string;
  htmlLink: string;
  updated: string;
  isTask: boolean;
}

interface CalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
  accessRole: string;
}

interface ConnectionStatus {
  connected: boolean;
  needsRefresh?: boolean;
  hasRefreshToken?: boolean;
  expiresAt?: string;
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'check-connection' }
      });

      if (error) throw error;
      
      const status = data as ConnectionStatus;
      setIsConnected(status.connected);
      
      if (status.connected && status.needsRefresh && !status.hasRefreshToken) {
        setLastError('Google connection needs reconfirmation');
      } else {
        setLastError(null);
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const getAuthUrl = useCallback(async (): Promise<string | null> => {
    try {
      const redirectUri = `${window.location.origin}/calendar`;
      
      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'get-auth-url', redirectUri }
      });

      if (error) throw error;
      return data.authUrl;
    } catch (err) {
      console.error('Failed to get auth URL:', err);
      toast.error('Failed to initiate Google connection');
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    const authUrl = await getAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  }, [getAuthUrl]);

  const exchangeCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const redirectUri = `${window.location.origin}/calendar`;
      
      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'exchange-code', code, redirectUri }
      });

      if (error) throw error;
      
      if (data.connected) {
        setIsConnected(true);
        toast.success('Google Calendar connected successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to exchange code:', err);
      toast.error('Failed to connect Google Calendar');
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'disconnect' }
      });

      if (error) throw error;
      
      setIsConnected(false);
      setCalendars([]);
      setEvents([]);
      toast.success('Disconnected from Google Calendar');
    } catch (err) {
      console.error('Failed to disconnect:', err);
      toast.error('Failed to disconnect');
    }
  }, []);

  const fetchCalendars = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gcal-calendars', {
        body: {}
      });

      if (error) throw error;
      setCalendars(data.calendars || []);
    } catch (err) {
      console.error('Failed to fetch calendars:', err);
    }
  }, []);

  const fetchEvents = useCallback(async (
    timeMin: string,
    timeMax: string,
    calendarId = 'primary',
    includeAllDay = true
  ): Promise<CalendarEvent[]> => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gcal-events', {
        body: { timeMin, timeMax, calendarId, includeAllDay }
      });

      if (error) throw error;
      
      const fetchedEvents = data.events || [];
      setEvents(fetchedEvents);
      return fetchedEvents;
    } catch (err) {
      console.error('Failed to fetch events:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch events';
      setLastError(message);
      return [];
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const syncTask = useCallback(async (
    taskId: string,
    action: 'create' | 'update' | 'cancel',
    calendarId = 'primary',
    eventTime = '10:00'
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('gcal-sync', {
        body: { taskId, action, calendarId, eventTime }
      });

      if (error) throw error;
      
      if (data.success) {
        const actionText = action === 'create' ? 'created' : action === 'update' ? 'updated' : 'cancelled';
        toast.success(`Calendar event ${actionText}`);
        return true;
      }
      
      if (data.error) {
        toast.error(data.error);
      }
      return false;
    } catch (err) {
      console.error('Failed to sync task:', err);
      const message = err instanceof Error ? err.message : 'Failed to sync task';
      toast.error(message);
      return false;
    }
  }, []);

  return {
    isConnected,
    isLoading,
    calendars,
    events,
    eventsLoading,
    lastError,
    connect,
    disconnect,
    reconnect: connect,
    exchangeCode,
    fetchCalendars,
    fetchEvents,
    syncTask,
    checkConnection,
  };
}
