import { useMemo } from 'react';
import { isSameDay, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { useIsMobile } from '@/hooks/use-mobile';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

export function DayView({ currentDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
  const isMobile = useIsMobile();
  
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const dayEvents = useMemo(() => {
    return events.filter(event => isSameDay(new Date(event.start), currentDate));
  }, [events, currentDate]);

  const getEventStyle = (event: CalendarEvent) => {
    const hourHeight = isMobile ? 48 : 64; // 48px on mobile, 64px on desktop
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const duration = endHour - startHour || 1;
    
    return {
      top: `${startHour * hourHeight}px`,
      height: `${Math.max(duration * hourHeight, 24)}px`,
    };
  };

  return (
    <div className="flex-1 overflow-auto h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border py-2 md:py-4 text-center">
        <div className={cn(
          "text-xl md:text-2xl font-semibold",
          isToday(currentDate) && "text-primary"
        )}>
          {format(currentDate, 'EEEE')}
        </div>
        <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
          {format(currentDate, 'MMMM d, yyyy')}
        </div>
      </div>

      {/* Time grid */}
      <div className="relative flex">
        {/* Time labels */}
        <div className="w-12 md:w-16 flex-shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-12 md:h-16 border-b border-border/50 pr-1 md:pr-2 flex items-start justify-end"
            >
              <span className="text-[10px] md:text-xs text-muted-foreground -mt-2">
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
              className="h-12 md:h-16 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
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
                "absolute left-0.5 right-0.5 md:left-1 md:right-1 px-1.5 md:px-2 py-1 md:py-1.5 rounded cursor-pointer overflow-hidden transition-opacity hover:opacity-90 text-white"
              )}
              style={{
                ...getEventStyle(event),
                backgroundColor: event.source === 'google' ? '#ea4335' : (event.color || '#3b82f6'),
              }}
            >
              <div className="font-medium truncate text-xs md:text-sm">{event.title}</div>
              <div className="text-white/80 text-[10px] md:text-xs truncate">
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
