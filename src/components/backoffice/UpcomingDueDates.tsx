import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { CrmTask } from '@/types/crm';
import { format, addDays, startOfDay, isSameDay, isAfter, isBefore } from 'date-fns';

interface UpcomingDueDatesProps {
  tasks: CrmTask[];
}

export function UpcomingDueDates({ tasks }: UpcomingDueDatesProps) {
  const upcomingDays = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const tasksOnDay = tasks.filter(task => {
        if (!task.due_date) return false;
        if (task.status === 'completed' || task.status === 'canceled') return false;
        return isSameDay(new Date(task.due_date), date);
      });

      days.push({
        date,
        dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE'),
        dateLabel: format(date, 'MMM d'),
        count: tasksOnDay.length,
        hasUrgent: tasksOnDay.some(t => t.urgency === 'urgent' || t.urgency === 'high'),
      });
    }

    return days;
  }, [tasks]);

  const overdueCount = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.filter(task => {
      if (!task.due_date) return false;
      if (task.status === 'completed' || task.status === 'canceled') return false;
      return isBefore(new Date(task.due_date), today);
    }).length;
  }, [tasks]);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Upcoming Due Dates</h3>
      </div>
      
      {overdueCount > 0 && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md">
          <span className="text-sm text-red-400 font-medium">
            {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {upcomingDays.map((day, index) => (
          <div
            key={index}
            className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg min-w-[60px] border ${
              day.count > 0
                ? day.hasUrgent
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-primary/10 border-primary/30'
                : 'bg-muted/30 border-border'
            }`}
          >
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {day.dayLabel}
            </span>
            <span className={`text-lg font-bold ${
              day.count > 0
                ? day.hasUrgent ? 'text-orange-400' : 'text-primary'
                : 'text-muted-foreground'
            }`}>
              {day.count}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {day.dateLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
