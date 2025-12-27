import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmTask, TaskStatus, TaskUrgency } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { notifyTaskStatusChange, notifyTaskUrgencyChange } from '@/lib/notificationService';

// Helper function to log task activity
async function logTaskActivity(
  taskId: string,
  userId: string,
  action: string,
  fieldName?: string,
  oldValue?: string | null,
  newValue?: string | null
) {
  const { error } = await supabase
    .from('task_activity_log')
    .insert({
      task_id: taskId,
      user_id: userId,
      action,
      field_name: fieldName || null,
      old_value: oldValue || null,
      new_value: newValue || null,
    });

  if (error) {
    console.error('Failed to log task activity:', error);
  }
}

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

    // Log task creation
    await logTaskActivity(data.id, user.id, 'created');

    setTasks(prev => [data as CrmTask, ...prev]);
    toast.success('Task created');
    return data as CrmTask;
  };

  const updateTask = async (id: string, updates: Partial<CrmTask>) => {
    if (!user) return false;
    
    // Get current task for comparison
    const currentTask = tasks.find(t => t.id === id);
    
    const { error } = await supabase
      .from('crm_tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update task');
      console.error(error);
      return false;
    }

    // Log activity and generate notifications for changes
    if (currentTask) {
      // Status change
      if (updates.status && updates.status !== currentTask.status) {
        await logTaskActivity(id, user.id, 'status_changed', 'status', currentTask.status, updates.status);
        notifyTaskStatusChange(
          user.id,
          currentTask.task_name,
          id,
          currentTask.status,
          updates.status,
          user.id
        );
      }
      // Urgency change
      if (updates.urgency && updates.urgency !== currentTask.urgency) {
        await logTaskActivity(id, user.id, 'urgency_changed', 'urgency', currentTask.urgency, updates.urgency);
        notifyTaskUrgencyChange(
          user.id,
          currentTask.task_name,
          id,
          currentTask.urgency,
          updates.urgency,
          user.id
        );
      }
      // Due date change
      if (updates.due_date !== undefined && updates.due_date !== currentTask.due_date) {
        await logTaskActivity(id, user.id, 'due_date_changed', 'due_date', currentTask.due_date, updates.due_date);
      }
      // Task name change
      if (updates.task_name && updates.task_name !== currentTask.task_name) {
        await logTaskActivity(id, user.id, 'name_changed', 'task_name', currentTask.task_name, updates.task_name);
      }
      // Description change
      if (updates.description !== undefined && updates.description !== currentTask.description) {
        await logTaskActivity(id, user.id, 'description_changed', 'description', currentTask.description, updates.description);
      }
      // Project link change
      if (updates.linked_project_id !== undefined && updates.linked_project_id !== currentTask.linked_project_id) {
        await logTaskActivity(id, user.id, 'project_linked', 'linked_project_id', currentTask.linked_project_id, updates.linked_project_id);
      }
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
