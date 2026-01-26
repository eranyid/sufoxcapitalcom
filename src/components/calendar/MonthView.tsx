import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarEvents';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, events, onEventClick, onDayClick }: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(eventStart, day) ||
        isSameDay(eventEnd, day) ||
        (eventStart <= day && eventEnd >= day)
      );
    });
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDaysFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border flex-shrink-0">
        {weekDaysFull.map((day, i) => (
          <div
            key={day}
            className="py-1 md:py-2 text-center text-[10px] md:text-xs font-medium text-muted-foreground"
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{weekDays[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[60px] md:min-h-[80px] border-b border-r border-border p-0.5 md:p-1.5 cursor-pointer transition-colors hover:bg-muted/30 flex flex-col",
                !isCurrentMonth && "bg-muted/10",
                idx % 7 === 0 && "border-l-0",
              )}
            >
              <div className="flex items-center justify-center mb-0.5">
                <span
                  className={cn(
                    "text-[10px] md:text-xs font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full",
                    isCurrentDay && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-0.5 overflow-hidden flex-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={cn(
                      "text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded truncate cursor-pointer transition-opacity hover:opacity-80",
                      event.source === 'google' 
                        ? "bg-red-500/20 text-red-400 border-l-2 border-red-500"
                        : "text-white border-l-2"
                    )}
                    style={{ 
                      backgroundColor: event.source === 'google' ? undefined : `${event.color || '#3b82f6'}30`,
                      borderColor: event.source === 'google' ? undefined : event.color || '#3b82f6',
                      color: event.source === 'google' ? undefined : event.color || '#3b82f6'
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[8px] md:text-[10px] text-muted-foreground px-1">
                    +{dayEvents.length - 2} more
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
