import { useMemo } from 'react';
import { CalendarEvent, CATEGORY_COLORS } from '@/types/calendar';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  parseISO,
  setHours,
  setMinutes,
  differenceInMinutes,
  getHours,
  getMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
  selectedEventId?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // pixels per hour

export function WeekView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  selectedEventId,
}: WeekViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    for (const event of events) {
      if (event.allDay) continue;
      
      const eventStart = parseISO(event.startDateTime);
      const dateKey = format(eventStart, 'yyyy-MM-dd');
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    }
    
    return map;
  }, [events]);

  const allDayEvents = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    for (const event of events) {
      if (!event.allDay) continue;
      
      const eventStart = parseISO(event.startDateTime);
      const dateKey = format(eventStart, 'yyyy-MM-dd');
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    }
    
    return map;
  }, [events]);

  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.startDateTime);
    const end = parseISO(event.endDateTime);
    const startHour = getHours(start) + getMinutes(start) / 60;
    const duration = differenceInMinutes(end, start);
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return {
      top: `${startHour * HOUR_HEIGHT}px`,
      height: `${Math.max(height, 20)}px`,
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with day names */}
      <div className="flex border-b border-border shrink-0">
        <div className="w-14 shrink-0" />
        <div className="flex-1 grid grid-cols-7">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="py-2 text-center border-l border-border"
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-0.5",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All-day events row */}
      {Array.from(allDayEvents.values()).some(arr => arr.length > 0) && (
        <div className="flex border-b border-border shrink-0">
          <div className="w-14 shrink-0 text-[10px] text-muted-foreground p-1">
            All day
          </div>
          <div className="flex-1 grid grid-cols-7">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = allDayEvents.get(dateKey) || [];
              
              return (
                <div key={dateKey} className="border-l border-border p-1 min-h-[32px]">
                  {dayEvents.map((event) => {
                    const colors = CATEGORY_COLORS[event.category];
                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded cursor-pointer truncate",
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
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time labels */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full pr-2 text-right text-[10px] text-muted-foreground"
                style={{ top: `${hour * HOUR_HEIGHT - 6}px` }}
              >
                {hour === 0 ? '' : format(setMinutes(setHours(new Date(), hour), 0), 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {/* Hour lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-border/50"
                style={{ top: `${hour * HOUR_HEIGHT}px` }}
              />
            ))}

            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(dateKey) || [];
              
              return (
                <div
                  key={dateKey}
                  className={cn(
                    "relative border-l border-border",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const hour = Math.floor(y / HOUR_HEIGHT);
                    const clickedTime = setMinutes(setHours(day, hour), 0);
                    onTimeSlotClick(clickedTime);
                  }}
                >
                  {dayEvents.map((event) => {
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
                          "absolute left-0.5 right-0.5 px-1 py-0.5 rounded text-[10px] overflow-hidden cursor-pointer",
                          "border transition-all hover:brightness-110",
                          colors.bg,
                          colors.border,
                          colors.text,
                          selectedEventId === event.id && "ring-2 ring-primary"
                        )}
                        style={style}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-75 text-[9px]">
                          {format(parseISO(event.startDateTime), 'HH:mm')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
