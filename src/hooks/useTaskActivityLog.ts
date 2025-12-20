import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export function useTaskActivityLog(taskId: string | null) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('task_activity_log')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch activities:', error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  }, [taskId]);

  // Real-time subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task-activity-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_activity_log',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setActivities(prev => [payload.new as TaskActivity, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const logActivity = useCallback(async (
    action: string,
    fieldName?: string,
    oldValue?: string | null,
    newValue?: string | null
  ) => {
    if (!user || !taskId) return null;

    const { data, error } = await supabase
      .from('task_activity_log')
      .insert({
        task_id: taskId,
        user_id: user.id,
        action,
        field_name: fieldName || null,
        old_value: oldValue || null,
        new_value: newValue || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log activity:', error);
      return null;
    }

    return data;
  }, [user, taskId]);

  return {
    activities,
    loading,
    fetchActivities,
    logActivity,
  };
}
