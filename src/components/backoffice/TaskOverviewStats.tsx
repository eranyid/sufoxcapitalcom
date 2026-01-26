import { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { CrmTask } from '@/types/crm';
import { isAfter, isBefore, startOfDay, endOfDay, subDays } from 'date-fns';

interface TaskOverviewStatsProps {
  tasks: CrmTask[];
}

export function TaskOverviewStats({ tasks }: TaskOverviewStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const weekAgo = subDays(today, 7);

    const total = tasks.length;
    
    const overdue = tasks.filter(task => {
      if (!task.due_date || task.status === 'completed' || task.status === 'canceled') return false;
      return isBefore(new Date(task.due_date), startOfDay(today));
    }).length;

    const completedThisWeek = tasks.filter(task => {
      if (task.status !== 'completed') return false;
      const updatedAt = new Date(task.updated_at);
      return isAfter(updatedAt, weekAgo);
    }).length;

    const inProgress = tasks.filter(task => 
      task.status === 'in_progress' || task.status === 'planned'
    ).length;

    const completionRate = total > 0 
      ? Math.round((tasks.filter(t => t.status === 'completed').length / total) * 100) 
      : 0;

    return { total, overdue, completedThisWeek, inProgress, completionRate };
  }, [tasks]);

  const statItems = [
    {
      label: 'Total Issues',
      value: stats.total,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: stats.overdue > 0 ? 'text-red-400' : 'text-muted-foreground',
      bgColor: stats.overdue > 0 ? 'bg-red-500/10' : 'bg-muted/50',
    },
    {
      label: 'Done This Week',
      value: stats.completedThisWeek,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`${item.bgColor} rounded-lg border border-border p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
          <div className={`text-2xl font-bold ${item.color}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
