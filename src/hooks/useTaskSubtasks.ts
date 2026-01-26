import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TaskSubtask } from '@/types/subtasks';
import { toast } from 'sonner';

export function useTaskSubtasks(taskId: string | null) {
  const { user } = useAuth();
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubtasks = useCallback(async () => {
    if (!user || !taskId) {
      setSubtasks([]);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('task_subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Failed to fetch subtasks:', error);
    } else {
      setSubtasks(data as TaskSubtask[]);
    }
    setLoading(false);
  }, [user, taskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`subtasks-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_subtasks',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchSubtasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, fetchSubtasks]);

  const createSubtask = async (title: string) => {
    if (!user || !taskId) return null;

    const maxOrder = subtasks.length > 0 
      ? Math.max(...subtasks.map(s => s.order_index)) 
      : -1;

    const { data, error } = await supabase
      .from('task_subtasks')
      .insert({
        task_id: taskId,
        user_id: user.id,
        title,
        order_index: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create subtask');
      console.error(error);
      return null;
    }

    return data as TaskSubtask;
  };

  const updateSubtask = async (id: string, updates: Partial<TaskSubtask>) => {
    const { error } = await supabase
      .from('task_subtasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update subtask');
      console.error(error);
      return false;
    }

    return true;
  };

  const deleteSubtask = async (id: string) => {
    const { error } = await supabase
      .from('task_subtasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete subtask');
      console.error(error);
      return false;
    }

    return true;
  };

  const toggleSubtask = async (id: string) => {
    const subtask = subtasks.find(s => s.id === id);
    if (!subtask) return false;
    
    return updateSubtask(id, { is_completed: !subtask.is_completed });
  };

  const completedCount = subtasks.filter(s => s.is_completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return {
    subtasks,
    loading,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtask,
    completedCount,
    totalCount,
    progress,
    refetch: fetchSubtasks,
  };
}
