import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmTask, TaskStatus, TaskUrgency } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { notifyTaskStatusChange, notifyTaskUrgencyChange } from '@/lib/notificationService';

// Debounce timeout for calendar sync
const SYNC_DEBOUNCE_MS = 1500;

async function syncTaskToCalendar(taskId: string, action: 'update' | 'cancel') {
  try {
    // Check if task has a calendar link
    const { data: link } = await supabase
      .from('task_calendar_links')
      .select('*')
      .eq('task_id', taskId)
      .eq('status', 'linked')
      .single();

    if (!link) return; // No linked calendar event

    console.log(`[auto-sync] Syncing task ${taskId} with action: ${action}`);

    const { error } = await supabase.functions.invoke('gcal-sync', {
      body: { taskId, action }
    });

    if (error) {
      console.error('[auto-sync] Failed:', error);
    }
  } catch (err) {
    console.error('[auto-sync] Error:', err);
  }
}

export function useCrmTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const syncTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(syncTimeouts.current).forEach(clearTimeout);
    };
  }, []);

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

    // Generate notifications for status/urgency changes
    if (currentTask && user) {
      if (updates.status && updates.status !== currentTask.status) {
        notifyTaskStatusChange(
          user.id,
          currentTask.task_name,
          id,
          currentTask.status,
          updates.status,
          user.id
        );
      }
      if (updates.urgency && updates.urgency !== currentTask.urgency) {
        notifyTaskUrgencyChange(
          user.id,
          currentTask.task_name,
          id,
          currentTask.urgency,
          updates.urgency,
          user.id
        );
      }
    }

    // Auto-sync to Google Calendar (debounced)
    if (currentTask) {
      const shouldSync = updates.due_date !== undefined || updates.status !== undefined || updates.task_name !== undefined;
      
      if (shouldSync) {
        // Clear previous timeout for this task
        if (syncTimeouts.current[id]) {
          clearTimeout(syncTimeouts.current[id]);
        }

        // Determine sync action
        const newStatus = updates.status || currentTask.status;
        const isCancelled = newStatus === 'completed' || newStatus === 'canceled';
        const action = isCancelled ? 'cancel' : 'update';

        // Debounce the sync
        syncTimeouts.current[id] = setTimeout(() => {
          syncTaskToCalendar(id, action);
          delete syncTimeouts.current[id];
        }, SYNC_DEBOUNCE_MS);
      }
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return true;
  };

  const deleteTask = async (id: string) => {
    // Cancel calendar event before deleting
    syncTaskToCalendar(id, 'cancel');

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
