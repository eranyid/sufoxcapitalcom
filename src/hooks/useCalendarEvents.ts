import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { calendarStorage, expandRecurringEvents } from '@/services/calendarStorage';
import { generateSeedEvents } from '@/data/calendarSeedData';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedEvents = await calendarStorage.getEvents();
      
      // If no events, seed with sample data
      if (storedEvents.length === 0) {
        const seedEvents = generateSeedEvents();
        await calendarStorage.seedEvents(seedEvents);
        setEvents(seedEvents);
      } else {
        setEvents(storedEvents);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load calendar events');
      console.error('Calendar load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const getEventsForRange = useCallback((start: Date, end: Date) => {
    return expandRecurringEvents(events, start, end);
  }, [events]);

  const getEventsForMonth = useCallback((date: Date) => {
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    return getEventsForRange(start, end);
  }, [getEventsForRange]);

  const createEvent = useCallback(async (
    event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const newEvent = await calendarStorage.createEvent(event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError('Failed to create event');
      throw err;
    }
  }, []);

  const updateEvent = useCallback(async (
    id: string,
    updates: Partial<CalendarEvent>,
    updateSeries = false
  ) => {
    try {
      // If it's a recurring event instance, get the original event
      const originalId = id.includes('_') ? id.split('_')[0] : id;
      
      if (updateSeries) {
        const updated = await calendarStorage.updateEvent(originalId, updates);
        if (updated) {
          setEvents(prev => prev.map(e => e.id === originalId ? updated : e));
        }
        return updated;
      } else {
        const updated = await calendarStorage.updateEvent(originalId, updates);
        if (updated) {
          setEvents(prev => prev.map(e => e.id === originalId ? updated : e));
        }
        return updated;
      }
    } catch (err) {
      setError('Failed to update event');
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string, deleteSeries = false) => {
    try {
      const originalId = id.includes('_') ? id.split('_')[0] : id;
      
      if (deleteSeries) {
        await calendarStorage.deleteEventSeries(originalId);
        setEvents(prev => prev.filter(e => e.id !== originalId && e.seriesId !== originalId));
      } else {
        await calendarStorage.deleteEvent(originalId);
        setEvents(prev => prev.filter(e => e.id !== originalId));
      }
      return true;
    } catch (err) {
      setError('Failed to delete event');
      throw err;
    }
  }, []);

  const toggleEventComplete = useCallback(async (id: string) => {
    const originalId = id.includes('_') ? id.split('_')[0] : id;
    const event = events.find(e => e.id === originalId);
    if (event) {
      return updateEvent(originalId, { isCompleted: !event.isCompleted });
    }
  }, [events, updateEvent]);

  return {
    events,
    isLoading,
    error,
    getEventsForRange,
    getEventsForMonth,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleEventComplete,
    reload: loadEvents,
  };
}
