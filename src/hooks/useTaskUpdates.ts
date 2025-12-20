import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TaskUpdate {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useTaskUpdates(taskId: string | null) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUpdates = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('task_updates')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch updates:', error);
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  }, [taskId]);

  // Real-time subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task-updates-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_updates',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setUpdates(prev => [payload.new as TaskUpdate, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'task_updates',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setUpdates(prev => prev.filter(u => u.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const createUpdate = useCallback(async (content: string) => {
    if (!user || !taskId || !content.trim()) return null;

    const { data, error } = await supabase
      .from('task_updates')
      .insert({
        task_id: taskId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to post update');
      console.error(error);
      return null;
    }

    toast.success('Update posted');
    return data;
  }, [user, taskId]);

  const deleteUpdate = useCallback(async (updateId: string) => {
    const { error } = await supabase
      .from('task_updates')
      .delete()
      .eq('id', updateId);

    if (error) {
      toast.error('Failed to delete update');
      console.error(error);
      return false;
    }

    return true;
  }, []);

  return {
    updates,
    loading,
    fetchUpdates,
    createUpdate,
    deleteUpdate,
  };
}
