import { useMemo, useState, useEffect } from 'react';
import { CrmTask, TaskStatus, STATUS_OPTIONS } from '@/types/crm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Battery } from 'lucide-react';

interface StatusDistributionBatteryProps {
  tasks: CrmTask[];
}

// Map status to hex colors for the battery segments
const statusColors: Record<TaskStatus, string> = {
  backlog: '#f59e0b',      // amber-500
  planned: '#6b7280',      // gray-500
  in_progress: '#f59e0b',  // amber-500
  completed: '#818cf8',    // indigo-400
  canceled: '#6b7280',     // gray-500
};

export function StatusDistributionBattery({ tasks }: StatusDistributionBatteryProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const distribution = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return [];

    // Count by status
    const counts: Record<TaskStatus, number> = {
      backlog: 0,
      planned: 0,
      in_progress: 0,
      completed: 0,
      canceled: 0,
    };

    tasks.forEach(task => {
      const status = task.status as TaskStatus;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    // Build segments for statuses that have tasks
    const segments: {
      status: TaskStatus;
      label: string;
      count: number;
      percentage: number;
      color: string;
    }[] = [];

    // Use STATUS_OPTIONS order
    STATUS_OPTIONS.forEach(option => {
      const count = counts[option.value];
      if (count > 0) {
        segments.push({
          status: option.value,
          label: option.label,
          count,
          percentage: (count / total) * 100,
          color: statusColors[option.value],
        });
      }
    });

    return segments;
  }, [tasks]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/50 border border-border/40 rounded-lg p-3 md:p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Battery className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Status Distribution
        </span>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          {tasks.length} issue{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Battery Bar */}
      <TooltipProvider delayDuration={100}>
        <div className="relative">
          {/* Battery container */}
          <div className="flex h-6 md:h-7 rounded-md overflow-hidden border border-border/60 bg-muted/30">
            {distribution.map((segment, index) => (
              <Tooltip key={segment.status}>
                <TooltipTrigger asChild>
                  <div
                    className="relative flex items-center justify-center hover:brightness-110 cursor-pointer overflow-hidden"
                    style={{
                      width: isAnimated ? `${segment.percentage}%` : '0%',
                      backgroundColor: segment.color,
                      minWidth: isAnimated && segment.percentage > 0 ? '8px' : '0',
                      transition: `width 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s, min-width 0.3s ease ${index * 0.1}s`,
                    }}
                  >
                    {/* Show label if segment is wide enough */}
                    {segment.percentage >= 12 && (
                      <span 
                        className="text-[10px] md:text-xs font-mono font-medium text-white/90 truncate px-1"
                        style={{
                          opacity: isAnimated ? 1 : 0,
                          transition: `opacity 0.3s ease ${0.4 + index * 0.1}s`,
                        }}
                      >
                        {segment.percentage >= 20 ? segment.label : `${Math.round(segment.percentage)}%`}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="bg-card border-border"
                >
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">{segment.label}</p>
                    <p className="text-muted-foreground">
                      {segment.count} issue{segment.count !== 1 ? 's' : ''} – {segment.percentage.toFixed(1)}%
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Battery cap (optional visual) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-1 h-3 bg-border/60 rounded-r-sm ml-px" />
          </div>
        </div>
      </TooltipProvider>

      {/* Legend - compact */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
        {distribution.map((segment, index) => (
          <div 
            key={segment.status} 
            className="flex items-center gap-1.5"
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'translateY(0)' : 'translateY(4px)',
              transition: `opacity 0.3s ease ${0.3 + index * 0.05}s, transform 0.3s ease ${0.3 + index * 0.05}s`,
            }}
          >
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {segment.label}: {segment.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}