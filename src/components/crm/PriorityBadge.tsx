import { cn } from '@/lib/utils';
import { Priority, PRIORITY_OPTIONS } from '@/types/crm';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityStyles: Record<Priority, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  critical: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const label = PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority;
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border',
      priorityStyles[priority],
      className
    )}>
      {label}
    </span>
  );
}
