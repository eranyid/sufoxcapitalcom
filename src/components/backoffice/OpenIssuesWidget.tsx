import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowRight, Circle } from 'lucide-react';
import { CrmTask, TaskStatus, STATUS_OPTIONS } from '@/types/crm';
import { statusConfig } from '@/components/crm/TaskStatusBadge';

interface OpenIssuesWidgetProps {
  tasks: CrmTask[];
}

export function OpenIssuesWidget({ tasks }: OpenIssuesWidgetProps) {
  const { openTasks, statusBreakdown, total } = useMemo(() => {
    // Filter only open (non-completed, non-canceled) tasks
    const open = tasks.filter(
      t => t.status !== 'completed' && t.status !== 'canceled'
    );
    
    // Sort by urgency priority, then by due date, then by updated_at
    const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
    const sorted = [...open].sort((a, b) => {
      // First by urgency
      const urgencyDiff = (urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 4) - 
                          (urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 4);
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Then by due date (earliest first, null last)
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      // Finally by updated_at (most recent first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    // Count by status for breakdown
    const breakdown: Record<string, number> = {};
    open.forEach(task => {
      const status = task.status as TaskStatus;
      breakdown[status] = (breakdown[status] || 0) + 1;
    });

    return { 
      openTasks: sorted.slice(0, 5), // Top 5 tasks
      statusBreakdown: breakdown,
      total: open.length 
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/50 border border-border/40 rounded-lg p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Open Issues
          </span>
        </div>
        <Link 
          to="/backoffice/issues" 
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Open
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Count and Progress Bar */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Open</div>
            <div className="text-2xl font-bold text-foreground">{total}</div>
          </div>
        </div>
        
        {/* Progress bar showing open vs total */}
        <div className="flex-1 h-6 bg-muted/30 rounded-md overflow-hidden border border-border/40">
          <div 
            className="h-full bg-emerald-500/80 transition-all duration-500"
            style={{ 
              width: tasks.length > 0 
                ? `${(total / tasks.length) * 100}%` 
                : '0%' 
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-[11px] text-muted-foreground">
        {Object.entries(statusBreakdown).map(([status, count]) => {
          const config = statusConfig[status as TaskStatus];
          const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-sm" 
                style={{ backgroundColor: config?.hexColor || '#6b7280' }}
              />
              <span>{label}: {count}</span>
            </div>
          );
        })}
      </div>

      {/* Task List */}
      {openTasks.length > 0 && (
        <div className="space-y-1.5 border-t border-border/40 pt-3">
          {openTasks.map((task, index) => {
            const statusColor = statusConfig[task.status as TaskStatus]?.hexColor || '#6b7280';
            return (
              <div 
                key={task.id}
                className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/30 transition-colors"
              >
                <span className="text-muted-foreground font-mono text-xs w-4">
                  {index + 1}.
                </span>
                <Circle 
                  className="h-2 w-2 flex-shrink-0" 
                  fill={statusColor}
                  stroke={statusColor}
                />
                <span className="text-foreground truncate flex-1">
                  {task.task_name}
                </span>
                {task.urgency === 'urgent' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                    URGENT
                  </span>
                )}
                {task.urgency === 'high' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">
                    HIGH
                  </span>
                )}
              </div>
            );
          })}
          
          {total > 5 && (
            <Link 
              to="/backoffice/issues"
              className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors pt-2"
            >
              +{total - 5} more issues
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
