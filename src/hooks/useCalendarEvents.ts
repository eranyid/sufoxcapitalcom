import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  isAllDay?: boolean;
  source: 'internal' | 'google';
  color?: string;
  location?: string;
  recurrenceType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: Date;
  reminderMinutes?: number;
}

export interface InternalEventInput {
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  color?: string;
  location?: string;
  is_all_day?: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_end_date?: string;
  reminder_minutes?: number;
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch internal events
  const { data: internalEvents = [], isLoading: loadingInternal } = useQuery({
    queryKey: ['internal-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('internal_events')
        .select('*')
        .order('start_at', { ascending: true });
      
      if (error) throw error;
      return data.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start: new Date(e.start_at),
        end: new Date(e.end_at),
        isAllDay: e.is_all_day || false,
        source: 'internal' as const,
        color: e.color || '#3b82f6',
        location: e.location || undefined,
        recurrenceType: (e.recurrence_type as CalendarEvent['recurrenceType']) || 'none',
        recurrenceEndDate: e.recurrence_end_date ? new Date(e.recurrence_end_date) : undefined,
        reminderMinutes: e.reminder_minutes || undefined
      }));
    },
    enabled: !!user
  });

  // Fetch external events
  const { data: externalEvents = [], isLoading: loadingExternal } = useQuery({
    queryKey: ['external-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('external_events')
        .select('*')
        .order('start_at', { ascending: true });
      
      if (error) throw error;
      return data.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start: new Date(e.start_at),
        end: new Date(e.end_at),
        isAllDay: e.is_all_day || false,
        source: 'google' as const,
        color: '#ea4335',
        location: e.location
      }));
    },
    enabled: !!user
  });

  // Create internal event
  const createEvent = useMutation({
    mutationFn: async (input: InternalEventInput) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('internal_events')
        .insert({
          user_id: user.id,
          ...input
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-events'] });
      toast.success('Event created');
    },
    onError: (error) => {
      toast.error('Failed to create event');
      console.error(error);
    }
  });

  // Update internal event
  const updateEvent = useMutation({
    mutationFn: async ({ id, ...input }: InternalEventInput & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('internal_events')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-events'] });
      toast.success('Event updated');
    },
    onError: (error) => {
      toast.error('Failed to update event');
      console.error(error);
    }
  });

  // Delete internal event
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('internal_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-events'] });
      toast.success('Event deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete event');
      console.error(error);
    }
  });

  const allEvents: CalendarEvent[] = [...internalEvents, ...externalEvents];

  return {
    events: allEvents,
    internalEvents,
    externalEvents,
    isLoading: loadingInternal || loadingExternal,
    createEvent,
    updateEvent,
    deleteEvent
  };
}
