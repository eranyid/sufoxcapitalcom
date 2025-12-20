import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmTask, TaskStatus, TaskUrgency } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useCrmTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('crm_tasks')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } else {
      setTasks((data as CrmTask[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (task: Partial<CrmTask>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        user_id: user.id,
        task_name: task.task_name,
        description: task.description || null,
        owner: task.owner || 'Me',
        due_date: task.due_date || null,
        status: task.status || 'in_progress',
        urgency: task.urgency || 'none',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create task');
      console.error(error);
      return null;
    }

    setTasks(prev => [data as CrmTask, ...prev]);
    toast.success('Task created');
    return data as CrmTask;
  };

  const updateTask = async (id: string, updates: Partial<CrmTask>) => {
    const { error } = await supabase
      .from('crm_tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update task');
      console.error(error);
      return false;
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return true;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('crm_tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete task');
      console.error(error);
      return false;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Task moved to trash');
    return true;
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
