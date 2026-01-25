import { CalendarEvent, CATEGORY_COLORS } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Check } from 'lucide-react';

interface CalendarEventPillProps {
  event: CalendarEvent;
  onClick?: () => void;
  isSelected?: boolean;
  showTime?: boolean;
  compact?: boolean;
}

export function CalendarEventPill({
  event,
  onClick,
  isSelected,
  showTime = false,
  compact = false,
}: CalendarEventPillProps) {
  const colors = CATEGORY_COLORS[event.category];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border transition-all",
        "hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/50",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-primary border-primary",
        event.isCompleted && "opacity-60",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {event.isCompleted && (
          <Check className={cn("h-3 w-3 shrink-0", colors.text)} />
        )}
        <span className={cn(
          "truncate font-medium",
          colors.text,
          event.isCompleted && "line-through"
        )}>
          {showTime && !event.allDay && (
            <span className="opacity-80 mr-1">
              {format(parseISO(event.startDateTime), 'HH:mm')}
            </span>
          )}
          {event.title}
        </span>
      </div>
    </button>
  );
}
