import { useState, useCallback } from 'react';
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

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gcal-auth', {
        body: { 
          action: 'get_auth_url',
          redirectUri: getRedirectUri(),
        },
      });

      if (error) throw error;

      // Open Google auth in new window
      const authWindow = window.open(data.authUrl, 'google-auth', 'width=500,height=600');

      // Listen for the OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'google-oauth-callback' && event.data?.code) {
          authWindow?.close();
          window.removeEventListener('message', handleMessage);

          try {
            const { error: exchangeError } = await supabase.functions.invoke('gcal-auth', {
              body: {
                action: 'exchange_code',
                code: event.data.code,
                redirectUri: getRedirectUri(),
              },
            });

            if (exchangeError) throw exchangeError;

            toast.success('Google Calendar connected successfully');
            await checkConnection();
          } catch (err) {
            console.error('Token exchange failed:', err);
            toast.error('Failed to connect Google Calendar');
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Check for URL params on current page (if redirected here)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        try {
          const { error: exchangeError } = await supabase.functions.invoke('gcal-auth', {
            body: {
              action: 'exchange_code',
              code,
              redirectUri: getRedirectUri(),
            },
          });

          if (exchangeError) throw exchangeError;

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast.success('Google Calendar connected successfully');
          await checkConnection();
        } catch (err) {
          console.error('Token exchange failed:', err);
          toast.error('Failed to connect Google Calendar');
        }
      }
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      toast.error('Failed to start Google authentication');
    } finally {
      setIsConnecting(false);
    }
  }, [checkConnection]);

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
