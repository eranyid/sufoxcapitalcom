import { cn } from '@/lib/utils';
import { TaskStatus, STATUS_OPTIONS } from '@/types/crm';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusStyles: Record<TaskStatus, string> = {
  backlog: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  blocked: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
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
