import { cn } from '@/lib/utils';
import type { ProjectPriority } from '@/types/projects';

const PRIORITY_STYLES: Record<ProjectPriority, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

interface ProjectPriorityBadgeProps {
  priority: ProjectPriority;
  className?: string;
}

export function ProjectPriorityBadge({ priority, className }: ProjectPriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        PRIORITY_STYLES[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
