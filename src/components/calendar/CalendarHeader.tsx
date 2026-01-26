import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';

type ViewType = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onNewEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onNewEvent
}: CalendarHeaderProps) {
  const goToToday = () => onDateChange(new Date());

  const goPrev = () => {
    switch (view) {
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(subDays(currentDate, 1));
        break;
    }
  };

  const goNext = () => {
    switch (view) {
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return format(currentDate, 'MMMM yyyy');
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs font-medium h-8 px-2"
          >
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goPrev} className="h-8 w-8">
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext} className="h-8 w-8">
            <ChevronRight size={16} />
          </Button>
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground">{getTitle()}</h2>
      </div>

      {/* Bottom row: View toggle + New Event */}
      <div className="flex items-center justify-between gap-2">
        {/* View Toggle */}
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5 flex-1 sm:flex-none">
          {(['day', 'week', 'month'] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                view === v
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <Button onClick={onNewEvent} size="sm" className="gap-1.5 h-8">
          <Plus size={14} />
          <span className="hidden sm:inline">New Event</span>
        </Button>
      </div>
    </div>
  );
}
