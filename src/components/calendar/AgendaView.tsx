import { useMemo } from 'react';
import { CalendarEvent, CATEGORY_COLORS, CATEGORY_OPTIONS } from '@/types/calendar';
import {
  format,
  parseISO,
  isSameDay,
  startOfDay,
  addDays,
  isToday,
  isTomorrow,
  isYesterday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, MapPin, Clock, Link2 } from 'lucide-react';

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  selectedEventId?: string;
}

export function AgendaView({
  currentDate,
  events,
  onEventClick,
  selectedEventId,
}: AgendaViewProps) {
  const groupedEvents = useMemo(() => {
    // Get next 30 days of events
    const start = startOfDay(currentDate);
    const end = addDays(start, 30);
    
    const filteredEvents = events.filter((event) => {
      const eventStart = parseISO(event.startDateTime);
      return eventStart >= start && eventStart <= end;
    });
    
    // Sort by date/time
    filteredEvents.sort((a, b) => 
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );
    
    // Group by date
    const groups = new Map<string, CalendarEvent[]>();
    
    for (const event of filteredEvents) {
      const dateKey = format(parseISO(event.startDateTime), 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    }
    
    return groups;
  }, [events, currentDate]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  if (groupedEvents.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground text-lg">No upcoming events</div>
        <div className="text-muted-foreground/60 text-sm mt-1">
          Click "Add" to create a new event
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {Array.from(groupedEvents.entries()).map(([dateKey, dayEvents]) => {
        const date = parseISO(dateKey);
        
        return (
          <div key={dateKey}>
            {/* Date header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
              <h3 className={cn(
                "text-sm font-semibold",
                isToday(date) && "text-primary"
              )}>
                {getDateLabel(date)}
              </h3>
            </div>

            {/* Events */}
            <div className="space-y-2">
              {dayEvents.map((event) => {
                const colors = CATEGORY_COLORS[event.category];
                const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === event.category)?.label;
                
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={cn(
                      "rounded-lg border p-3 cursor-pointer transition-all",
                      "hover:bg-accent/5",
                      colors.border,
                      selectedEventId === event.id && "ring-2 ring-primary bg-accent/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Category indicator */}
                      <div className={cn(
                        "w-1 h-full min-h-[40px] rounded-full shrink-0",
                        colors.bg.replace('/20', '')
                      )} />

                      <div className="flex-1 min-w-0">
                        {/* Title and complete status */}
                        <div className="flex items-center gap-2">
                          {event.isCompleted && (
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                          <h4 className={cn(
                            "font-medium",
                            event.isCompleted && "line-through text-muted-foreground"
                          )}>
                            {event.title}
                          </h4>
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className={cn("font-medium", colors.text)}>
                            {categoryLabel}
                          </span>
                          
                          {!event.allDay && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(event.startDateTime), 'HH:mm')} - {format(parseISO(event.endDateTime), 'HH:mm')}
                            </span>
                          )}
                          
                          {event.allDay && (
                            <span>All day</span>
                          )}
                          
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}

                          {event.linkedModule !== 'none' && (
                            <span className="flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {event.linkedModule.replace('_', ' ')}
                            </span>
                          )}
                          
                          {event.recurrenceRule && event.recurrenceRule.frequency !== 'none' && (
                            <span className="text-primary/80">Recurring</span>
                          )}
                        </div>

                        {/* Notes preview */}
                        {event.notes && (
                          <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
