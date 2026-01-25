import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  location?: string;
  notes?: string;
  htmlLink?: string;
  status?: string;
}

interface ConnectionStatus {
  connected: boolean;
  isExpired?: boolean;
  lastUpdated?: string;
}

export function useGoogleCalendar() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);

  const getRedirectUri = () => {
    return `${window.location.origin}/calendar`;
  };

  const checkConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'check_status' },
      });

      if (error) throw error;

      setConnectionStatus(data);
      return data;
    } catch (error) {
      console.error('Failed to check connection:', error);
      setConnectionStatus({ connected: false });
      return { connected: false };
    }
  }, []);

  // Handle OAuth callback - detect code in URL on mount
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        toast.error(error === 'access_denied' ? 'Access was denied' : `OAuth error: ${error}`);
        // Clean URL
        window.history.replaceState({}, document.title, '/calendar');
        return;
      }

      if (code) {
        setIsConnecting(true);
        try {
          const { error: exchangeError } = await supabase.functions.invoke('gcal-auth', {
            body: {
              action: 'exchange_code',
              code,
              redirectUri: getRedirectUri(),
            },
          });

          if (exchangeError) throw exchangeError;

          toast.success('Google Calendar connected successfully');
          await checkConnection();
        } catch (err) {
          console.error('Token exchange failed:', err);
          toast.error('Failed to connect Google Calendar');
        } finally {
          setIsConnecting(false);
          // Clean URL after processing
          window.history.replaceState({}, document.title, '/calendar');
        }
      }
    };

    handleOAuthCallback();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Get auth URL from server
      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { 
          action: 'get_auth_url',
          redirectUri: getRedirectUri(),
        },
      });

      if (error) throw error;

      // Full-page redirect to Google auth (not popup)
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      toast.error('Failed to start Google authentication');
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('gcal-auth', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;

      setConnectionStatus({ connected: false });
      setGoogleEvents([]);
      toast.success('Google Calendar disconnected');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect Google Calendar');
    }
  }, []);

  const fetchEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gcal-events', {
        body: {
          timeMin: timeMin || new Date().toISOString(),
          timeMax,
        },
      });

      if (error) throw error;

      if (data.notConnected) {
        setConnectionStatus({ connected: false });
        return [];
      }

      setGoogleEvents(data.events || []);
      return data.events || [];
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to fetch Google Calendar events');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (event: {
    title: string;
    startDateTime: string;
    endDateTime: string;
    allDay?: boolean;
    location?: string;
    notes?: string;
    timezone?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('gcal-sync', {
        body: { action: 'create', event },
      });

      if (error) throw error;

      toast.success('Event added to Google Calendar');
      return data;
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to add event to Google Calendar');
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (eventId: string, event: {
    title: string;
    startDateTime: string;
    endDateTime: string;
    allDay?: boolean;
    location?: string;
    notes?: string;
    timezone?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('gcal-sync', {
        body: { action: 'update', eventId, event },
      });

      if (error) throw error;

      toast.success('Google Calendar event updated');
      return data;
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error('Failed to update Google Calendar event');
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gcal-sync', {
        body: { action: 'delete', eventId },
      });

      if (error) throw error;

      toast.success('Event removed from Google Calendar');
      return data;
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to remove event from Google Calendar');
      throw error;
    }
  }, []);

  return {
    connectionStatus,
    isConnecting,
    isLoading,
    googleEvents,
    connect,
    disconnect,
    checkConnection,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
