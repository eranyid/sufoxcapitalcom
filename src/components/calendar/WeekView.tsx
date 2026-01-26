import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
  isSameDay,
  isToday,
  format,
  differenceInMinutes
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarEvents';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

export function WeekView({ currentDate, events, onEventClick, onTimeSlotClick }: WeekViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      return isSameDay(new Date(event.start), day);
    });
  };

  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const duration = endHour - startHour || 1;
    
    return {
      top: `${startHour * 48}px`,
      height: `${Math.max(duration * 48, 24)}px`,
    };
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header with day names */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="grid grid-cols-8">
          <div className="w-14" /> {/* Time column spacer */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "py-2 text-center border-l border-border",
                isToday(day) && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                "text-lg font-semibold mt-0.5",
                isToday(day) && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <div className="relative">
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="w-14">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 border-b border-border/50 pr-2 flex items-start justify-end"
              >
                <span className="text-[10px] text-muted-foreground -mt-1.5">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l border-border",
                  isToday(day) && "bg-primary/5"
                )}
              >
                {/* Hour slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      const date = new Date(day);
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
                      "absolute left-0.5 right-0.5 px-1.5 py-1 rounded text-[10px] cursor-pointer overflow-hidden transition-opacity hover:opacity-90",
                      event.source === 'google'
                        ? "bg-red-500/80 text-white"
                        : "bg-blue-500/80 text-white"
                    )}
                    style={getEventStyle(event)}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-white/80 truncate">
                      {format(event.start, 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
