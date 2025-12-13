import { cn } from '@/lib/utils';
import { TaskStatus, STATUS_OPTIONS } from '@/types/crm';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusStyles: Record<TaskStatus, string> = {
  backlog: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-primary/20 text-primary border-primary/40',
  waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  completed: 'bg-green-500/20 text-green-400 border-green-500/40',
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border',
      statusStyles[status],
      className
    )}>
      {label}
    </span>
  );
}
