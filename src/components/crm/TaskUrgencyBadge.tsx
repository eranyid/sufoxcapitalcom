import { cn } from '@/lib/utils';
import { TaskUrgency, URGENCY_OPTIONS } from '@/types/crm';

interface TaskUrgencyBadgeProps {
  urgency: TaskUrgency;
  className?: string;
}

const urgencyStyles: Record<TaskUrgency, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  high: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
};

export function TaskUrgencyBadge({ urgency, className }: TaskUrgencyBadgeProps) {
  const label = URGENCY_OPTIONS.find(u => u.value === urgency)?.label || urgency;
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border',
      urgencyStyles[urgency],
      className
    )}>
      {label}
    </span>
  );
}
