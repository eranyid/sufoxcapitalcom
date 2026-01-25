import { useMemo } from 'react';
import { CalendarEvent, CATEGORY_COLORS } from '@/types/calendar';
import {
  format,
  parseISO,
  setHours,
  setMinutes,
  differenceInMinutes,
  getHours,
  getMinutes,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
  selectedEventId?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour - larger for day view

export function DayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  selectedEventId,
}: DayViewProps) {
  const { timedEvents, allDayEvents } = useMemo(() => {
    const timed: CalendarEvent[] = [];
    const allDay: CalendarEvent[] = [];
    
    for (const event of events) {
      const eventStart = parseISO(event.startDateTime);
      if (format(eventStart, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')) {
        if (event.allDay) {
          allDay.push(event);
        } else {
          timed.push(event);
        }
      }
    }
    
    return { timedEvents: timed, allDayEvents: allDay };
  }, [events, currentDate]);

  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.startDateTime);
    const end = parseISO(event.endDateTime);
    const startHour = getHours(start) + getMinutes(start) / 60;
    const duration = differenceInMinutes(end, start);
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return {
      top: `${startHour * HOUR_HEIGHT}px`,
      height: `${Math.max(height, 30)}px`,
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day header */}
      <div className="py-3 text-center border-b border-border shrink-0">
        <div className="text-sm text-muted-foreground">
          {format(currentDate, 'EEEE')}
        </div>
        <div
          className={cn(
            "text-2xl font-bold mt-0.5",
            isToday(currentDate) && "text-primary"
          )}
        >
          {format(currentDate, 'd')}
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-border p-2 shrink-0">
          <div className="text-xs text-muted-foreground mb-1">All day</div>
          <div className="space-y-1">
            {allDayEvents.map((event) => {
              const colors = CATEGORY_COLORS[event.category];
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    "px-2 py-1 rounded text-sm cursor-pointer",
                    colors.bg,
                    colors.text,
                    selectedEventId === event.id && "ring-1 ring-primary"
                  )}
                >
                  {event.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time labels */}
          <div className="w-16 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full pr-3 text-right text-xs text-muted-foreground"
                style={{ top: `${hour * HOUR_HEIGHT - 8}px` }}
              >
                {hour === 0 ? '' : format(setMinutes(setHours(new Date(), hour), 0), 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Event column */}
          <div
            className={cn(
              "flex-1 relative border-l border-border",
              isToday(currentDate) && "bg-primary/5"
            )}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const hour = Math.floor(y / HOUR_HEIGHT);
              const clickedTime = setMinutes(setHours(currentDate, hour), 0);
              onTimeSlotClick(clickedTime);
            }}
          >
            {/* Hour lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-border/50"
                style={{ top: `${hour * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Events */}
            {timedEvents.map((event) => {
              const colors = CATEGORY_COLORS[event.category];
              const style = getEventStyle(event);
              
              return (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  className={cn(
                    "absolute left-1 right-1 px-2 py-1 rounded overflow-hidden cursor-pointer",
                    "border transition-all hover:brightness-110",
                    colors.bg,
                    colors.border,
                    colors.text,
                    selectedEventId === event.id && "ring-2 ring-primary"
                  )}
                  style={style}
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="opacity-75 text-xs">
                    {format(parseISO(event.startDateTime), 'HH:mm')} - {format(parseISO(event.endDateTime), 'HH:mm')}
                  </div>
                  {event.location && (
                    <div className="opacity-60 text-xs mt-0.5">{event.location}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
