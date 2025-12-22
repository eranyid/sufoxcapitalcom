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

interface OAuthError {
  error: string;
  code?: string;
  details?: string;
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

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

      if (error) {
        console.error('Connection check error:', error);
        setIsConnected(false);
        setLastError('Failed to check connection status');
        return;
      }
      
      const status = data as ConnectionStatus;
      setIsConnected(status.connected);
      
      if (status.connected && status.needsRefresh && !status.hasRefreshToken) {
        setLastError('Google connection expired. Please reconnect.');
        setErrorCode('TOKEN_EXPIRED');
      } else {
        setLastError(null);
        setErrorCode(null);
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
      setIsConnected(false);
      setLastError('Connection check failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const getAuthUrl = useCallback(async (): Promise<string | null> => {
    try {
      // Use the current origin + /calendar as redirect
      const redirectUri = `${window.location.origin}/calendar`;
      
      console.log('[useGoogleCalendar] Requesting auth URL with redirect:', redirectUri);

      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'get-auth-url', redirectUri }
      });

      if (error) {
        console.error('Get auth URL error:', error);
        throw new Error(error.message || 'Failed to get auth URL');
      }

      if (data.error) {
        console.error('Auth URL error response:', data);
        const oauthError = data as OAuthError;
        throw new Error(oauthError.error);
      }

      console.log('[useGoogleCalendar] Auth URL received, redirect URI:', data.redirectUri);
      return data.authUrl;
    } catch (err) {
      console.error('Failed to get auth URL:', err);
      const message = err instanceof Error ? err.message : 'Failed to initiate Google connection';
      toast.error(message);
      setLastError(message);
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    setLastError(null);
    setErrorCode(null);
    
    const authUrl = await getAuthUrl();
    if (authUrl) {
      // Redirect to Google OAuth
      window.location.href = authUrl;
    }
  }, [getAuthUrl]);

  const exchangeCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const redirectUri = `${window.location.origin}/calendar`;
      
      console.log('[useGoogleCalendar] Exchanging code with redirect URI:', redirectUri);

      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'exchange-code', code, redirectUri }
      });

      if (error) {
        console.error('Code exchange invoke error:', error);
        throw new Error(error.message || 'Failed to exchange authorization code');
      }

      if (data.error) {
        console.error('Code exchange error response:', data);
        const oauthError = data as OAuthError;
        setLastError(oauthError.error);
        setErrorCode(oauthError.code || null);
        toast.error(oauthError.error);
        return false;
      }
      
      if (data.connected) {
        setIsConnected(true);
        setLastError(null);
        setErrorCode(null);
        toast.success('Google Calendar connected successfully');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to exchange code:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect Google Calendar';
      toast.error(message);
      setLastError(message);
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
      setLastError(null);
      setErrorCode(null);
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
      
      if (data.error) {
        console.error('Fetch calendars error:', data);
        setLastError(data.error);
        return;
      }
      
      setCalendars(data.calendars || []);
    } catch (err) {
      console.error('Failed to fetch calendars:', err);
      setLastError('Failed to fetch calendars');
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
      
      if (data.error) {
        console.error('Fetch events error:', data);
        setLastError(data.error);
        return [];
      }
      
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
    errorCode,
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
