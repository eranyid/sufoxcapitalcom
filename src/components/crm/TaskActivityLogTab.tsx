import { useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CircleDot, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Edit3,
  Activity
} from 'lucide-react';
import { useTaskActivityLog, TaskActivity } from '@/hooks/useTaskActivityLog';

interface Props {
  taskId: string;
}

export function TaskActivityLogTab({ taskId }: Props) {
  const { activities, loading, fetchActivities } = useTaskActivityLog(taskId);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return Plus;
      case 'status_changed':
        return CircleDot;
      case 'urgency_changed':
        return AlertTriangle;
      case 'due_date_changed':
        return Calendar;
      default:
        return Edit3;
    }
  };

  const getActivityDescription = (activity: TaskActivity) => {
    switch (activity.action) {
      case 'created':
        return 'Task created';
      case 'status_changed':
        return (
          <span>
            Status changed from <span className="font-medium">{activity.old_value || 'none'}</span> to{' '}
            <span className="font-medium">{activity.new_value}</span>
          </span>
        );
      case 'urgency_changed':
        return (
          <span>
            Priority changed from <span className="font-medium">{activity.old_value || 'none'}</span> to{' '}
            <span className="font-medium">{activity.new_value}</span>
          </span>
        );
      case 'due_date_changed':
        return (
          <span>
            Due date changed to <span className="font-medium">{activity.new_value || 'none'}</span>
          </span>
        );
      case 'name_changed':
        return (
          <span>
            Task renamed to <span className="font-medium">{activity.new_value}</span>
          </span>
        );
      default:
        return `${activity.field_name || 'Field'} updated`;
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted/30 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Activity size={48} className="text-muted-foreground/30 mb-4" />
        <h3 className="font-medium text-muted-foreground">No activity yet</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Activity will appear here as changes are made
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

        {/* Activity items */}
        <div className="space-y-4">
          {activities.map(activity => {
            const Icon = getActivityIcon(activity.action);
            return (
              <div key={activity.id} className="flex gap-3 relative">
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center z-10 flex-shrink-0">
                  <Icon size={12} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(activity.created_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
