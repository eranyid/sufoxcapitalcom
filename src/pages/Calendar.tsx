import { useState, useMemo, useEffect } from 'react';
import { CalendarView } from '@/types/calendar';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { AgendaView } from '@/components/calendar/AgendaView';
import { EventModal } from '@/components/calendar/EventModal';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarEvent } from '@/types/calendar';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

export default function Calendar() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<CalendarView>(isMobile ? 'agenda' : 'month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultModalDate, setDefaultModalDate] = useState<Date | undefined>();

  const {
    events,
    isLoading,
    getEventsForRange,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendarEvents();

  // Update default view based on mobile
  useEffect(() => {
    if (isMobile && view === 'month') {
      setView('agenda');
    }
  }, [isMobile]);

  // Get events for current view range
  const visibleEvents = useMemo(() => {
    const start = startOfWeek(startOfMonth(subMonths(currentDate, 1)));
    const end = endOfWeek(endOfMonth(addMonths(currentDate, 1)));
    return getEventsForRange(start, end);
  }, [currentDate, getEventsForRange, events]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDefaultModalDate(undefined);
    setIsModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setDefaultModalDate(date);
    setSelectedEvent(undefined);
    setIsModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date) => {
    setDefaultModalDate(date);
    setSelectedEvent(undefined);
    setIsModalOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setDefaultModalDate(new Date());
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createEvent(eventData);
  };

  const handleUpdateEvent = async (id: string, updates: Partial<CalendarEvent>, updateSeries?: boolean) => {
    await updateEvent(id, updates, updateSeries);
  };

  const handleDeleteEvent = async (id: string, deleteSeries?: boolean) => {
    await deleteEvent(id, deleteSeries);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
    setDefaultModalDate(undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onDateChange={setCurrentDate}
          onViewChange={setView}
          onAddEvent={handleAddEvent}
        />
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card/50">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={visibleEvents}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
            selectedEventId={selectedEvent?.id}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={visibleEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            selectedEventId={selectedEvent?.id}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={visibleEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            selectedEventId={selectedEvent?.id}
          />
        )}
        {view === 'agenda' && (
          <div className="h-full overflow-auto px-4">
            <AgendaView
              currentDate={currentDate}
              events={visibleEvents}
              onEventClick={handleEventClick}
              selectedEventId={selectedEvent?.id}
            />
          </div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        event={selectedEvent}
        defaultDate={defaultModalDate}
        onSave={handleSaveEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
