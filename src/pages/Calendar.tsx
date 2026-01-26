import { useState, useEffect, useMemo } from 'react';
import { useCalendarEvents, CalendarEvent, InternalEventInput } from '@/hooks/useCalendarEvents';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { EventModal } from '@/components/calendar/EventModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

type ViewType = 'month' | 'week' | 'day';

export default function Calendar() {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>(isMobile ? 'day' : 'month');
  const [showInternal, setShowInternal] = useState(true);
  const [showGoogle, setShowGoogle] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Event modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<Date | undefined>();

  const { 
    events, 
    isLoading, 
    createEvent, 
    updateEvent, 
    deleteEvent 
  } = useCalendarEvents();

  const { 
    integration, 
    syncCalendar 
  } = useCalendarIntegration();

  // Auto-sync on mount if integration exists and last sync was > 15 min ago
  useEffect(() => {
    if (integration?.ics_url && integration.last_synced_at) {
      const lastSync = new Date(integration.last_synced_at);
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (lastSync < fifteenMinutesAgo) {
        syncCalendar.mutate();
      }
    } else if (integration?.ics_url && !integration.last_synced_at) {
      syncCalendar.mutate();
    }
  }, [integration?.ics_url]);

  // Filter events based on toggles
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (event.source === 'internal' && !showInternal) return false;
      if (event.source === 'google' && !showGoogle) return false;
      return true;
    });
  }, [events, showInternal, showGoogle]);

  const handleNewEvent = () => {
    setSelectedEvent(null);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    setDefaultEventDate(now);
    setModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDefaultEventDate(undefined);
    setModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    if (view === 'month') {
      setCurrentDate(date);
      setView('day');
    }
  };

  const handleTimeSlotClick = (date: Date) => {
    setSelectedEvent(null);
    setDefaultEventDate(date);
    setModalOpen(true);
  };

  const handleSaveEvent = (input: InternalEventInput) => {
    if (selectedEvent && selectedEvent.source === 'internal') {
      updateEvent.mutate({ id: selectedEvent.id, ...input }, {
        onSuccess: () => setModalOpen(false)
      });
    } else {
      createEvent.mutate(input, {
        onSuccess: () => setModalOpen(false)
      });
    }
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent.mutate(id);
  };

  const sidebarContent = (
    <CalendarSidebar
      currentDate={currentDate}
      onDateChange={(date) => {
        setCurrentDate(date);
        setSidebarOpen(false);
      }}
      showInternal={showInternal}
      onToggleInternal={setShowInternal}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <div className="bloomberg-panel p-6">
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">Calendar</h1>
          <p className="text-sm text-muted-foreground">Manage your schedule and events</p>
        </div>
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Main Content */}
      <div className="bloomberg-panel overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-64 border-r border-border p-4 flex-shrink-0 overflow-y-auto">
              {sidebarContent}
            </div>
          )}

          {/* Calendar Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <CalendarHeader
                currentDate={currentDate}
                view={view}
                onDateChange={setCurrentDate}
                onViewChange={setView}
                onNewEvent={handleNewEvent}
              />
            </div>

            <div className="flex-1 overflow-auto">
              {view === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onDayClick={handleDayClick}
                />
              )}
              {view === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              )}
              {view === 'day' && (
                <DayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
        defaultDate={defaultEventDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        isSaving={createEvent.isPending || updateEvent.isPending}
      />
    </div>
  );
}
