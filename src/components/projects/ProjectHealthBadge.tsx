import { cn } from '@/lib/utils';
import type { ProjectHealth } from '@/types/projects';

const HEALTH_STYLES: Record<ProjectHealth, string> = {
  on_track: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  at_risk: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  off_track: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const HEALTH_LABELS: Record<ProjectHealth, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  off_track: 'Off Track',
};

interface ProjectHealthBadgeProps {
  health: ProjectHealth;
  className?: string;
}

export function ProjectHealthBadge({ health, className }: ProjectHealthBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        HEALTH_STYLES[health],
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        health === 'on_track' && 'bg-emerald-400',
        health === 'at_risk' && 'bg-amber-400',
        health === 'off_track' && 'bg-red-400'
      )} />
      {HEALTH_LABELS[health]}
    </span>
  );
}
