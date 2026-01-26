import { useMemo } from 'react';
import { isSameDay, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarEvents';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

export function DayView({ currentDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const dayEvents = useMemo(() => {
    return events.filter(event => isSameDay(new Date(event.start), currentDate));
  }, [events, currentDate]);

  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const duration = endHour - startHour || 1;
    
    return {
      top: `${startHour * 64}px`,
      height: `${Math.max(duration * 64, 32)}px`,
    };
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border py-4 text-center">
        <div className={cn(
          "text-2xl font-semibold",
          isToday(currentDate) && "text-primary"
        )}>
          {format(currentDate, 'EEEE')}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {format(currentDate, 'MMMM d, yyyy')}
        </div>
      </div>

      {/* Time grid */}
      <div className="relative flex">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-border/50 pr-2 flex items-start justify-end"
            >
              <span className="text-xs text-muted-foreground -mt-2">
                {format(new Date().setHours(hour, 0), 'h a')}
              </span>
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className={cn(
          "flex-1 relative border-l border-border",
          isToday(currentDate) && "bg-primary/5"
        )}>
          {/* Hour slots */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => {
                const date = new Date(currentDate);
                date.setHours(hour, 0, 0, 0);
                onTimeSlotClick(date);
              }}
            />
          ))}

          {/* Events */}
          {dayEvents.map((event) => (
            <div
              key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(event);
              }}
              className={cn(
                "absolute left-1 right-1 px-2 py-1.5 rounded cursor-pointer overflow-hidden transition-opacity hover:opacity-90",
                event.source === 'google'
                  ? "bg-red-500/80 text-white"
                  : "bg-blue-500/80 text-white"
              )}
              style={getEventStyle(event)}
            >
              <div className="font-medium truncate text-sm">{event.title}</div>
              <div className="text-white/80 text-xs truncate">
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
              </div>
              {event.source === 'google' && (
                <div className="text-[10px] text-white/60 mt-0.5">Google Calendar</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
