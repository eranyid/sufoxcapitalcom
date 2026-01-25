import { useMemo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarEventPill } from './CalendarEventPill';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  selectedEventId?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
  selectedEventId,
}: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    for (const event of events) {
      const eventStart = parseISO(event.startDateTime);
      const dateKey = format(eventStart, 'yyyy-MM-dd');
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    }
    
    // Sort events within each day
    map.forEach((dayEvents) => {
      dayEvents.sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      });
    });
    
    return map;
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const maxVisible = 3;
          const hasMore = dayEvents.length > maxVisible;

          return (
            <div
              key={index}
              onClick={() => onDayClick(day)}
              className={cn(
                "border-b border-r border-border p-1 min-h-[100px] cursor-pointer",
                "hover:bg-accent/5 transition-colors",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              {/* Day Number */}
              <div className="flex justify-end mb-1">
                <span
                  className={cn(
                    "w-6 h-6 flex items-center justify-center text-xs rounded-full",
                    isCurrentDay && "bg-primary text-primary-foreground font-semibold",
                    !isCurrentMonth && "text-muted-foreground/50"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <CalendarEventPill
                      event={event}
                      isSelected={selectedEventId === event.id}
                      compact
                    />
                  </div>
                ))}
                {hasMore && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayEvents.length - maxVisible} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
