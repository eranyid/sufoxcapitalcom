import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CalendarIntegration {
  id: string;
  ics_url: string | null;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
}

export function useCalendarIntegration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ['calendar-integration', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as CalendarIntegration | null;
    },
    enabled: !!user
  });

  const saveUrl = useMutation({
    mutationFn: async (icsUrl: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Validate URL
      try {
        new URL(icsUrl);
      } catch {
        throw new Error('Invalid URL format');
      }

      const { data: existing } = await supabase
        .from('calendar_integrations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('calendar_integrations')
          .update({ 
            ics_url: icsUrl, 
            sync_status: 'pending',
            sync_error: null 
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('calendar_integrations')
          .insert({ 
            user_id: user.id, 
            ics_url: icsUrl,
            provider: 'google_ics',
            sync_status: 'pending'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integration'] });
      toast.success('Calendar URL saved');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save URL');
    }
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Delete external events
      await supabase
        .from('external_events')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google_ics');

      // Update integration
      const { error } = await supabase
        .from('calendar_integrations')
        .update({ 
          ics_url: null, 
          sync_status: 'pending',
          sync_error: null,
          last_synced_at: null 
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integration'] });
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      toast.success('Calendar disconnected');
    },
    onError: () => {
      toast.error('Failed to disconnect');
    }
  });

  const syncCalendar = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('sync-calendar', {});
      
      if (response.error) {
        throw new Error(response.error.message || 'Sync failed');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integration'] });
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      toast.success(`Synced ${data?.eventsCount || 0} events`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
    }
  });

  return {
    integration,
    isLoading,
    saveUrl,
    disconnect,
    syncCalendar,
    isSyncing: syncCalendar.isPending
  };
}
