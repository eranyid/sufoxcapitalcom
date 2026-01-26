import { useEffect, useState } from 'react';
import { Activity, CheckSquare, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  action: string;
  taskName: string;
  timestamp: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
}

export function RecentActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRecentActivity = async () => {
      const { data, error } = await supabase
        .from('task_activity_log')
        .select('*, crm_tasks(task_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setActivities(
          data.map(item => ({
            id: item.id,
            action: item.action,
            taskName: (item.crm_tasks as { task_name: string } | null)?.task_name || 'Unknown Task',
            timestamp: item.created_at,
            fieldName: item.field_name || undefined,
            oldValue: item.old_value || undefined,
            newValue: item.new_value || undefined,
          }))
        );
      }
      setLoading(false);
    };

    fetchRecentActivity();
  }, [user]);

  const getActionIcon = (action: string) => {
    if (action.includes('status')) return <CheckSquare className="h-3 w-3" />;
    if (action.includes('urgency')) return <AlertCircle className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  const formatAction = (item: ActivityItem) => {
    if (item.fieldName && item.oldValue && item.newValue) {
      return (
        <span className="flex items-center gap-1 flex-wrap">
          <span className="text-muted-foreground line-through text-xs">{item.oldValue}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-primary text-xs">{item.newValue}</span>
        </span>
      );
    }
    return <span className="text-xs text-muted-foreground capitalize">{item.action.replace(/_/g, ' ')}</span>;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-10 bg-muted/30 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h3>
      {activities.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No recent activity
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors"
            >
              <div className="mt-0.5 text-muted-foreground">
                {getActionIcon(item.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.taskName}</p>
                {formatAction(item)}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
