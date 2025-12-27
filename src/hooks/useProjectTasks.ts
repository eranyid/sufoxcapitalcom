import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CrmTask } from '@/types/crm';

interface ProjectTaskStats {
  total: number;
  started: number;
  completed: number;
  percentComplete: number;
}

export function useProjectTasks(projectId: string | undefined) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [stats, setStats] = useState<ProjectTaskStats>({
    total: 0,
    started: 0,
    completed: 0,
    percentComplete: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('crm_tasks')
      .select('*')
      .eq('linked_project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      const taskList = (data || []) as CrmTask[];
      setTasks(taskList);

      // Calculate stats
      const total = taskList.length;
      const completed = taskList.filter(t => t.status === 'completed' || t.status === 'canceled').length;
      const started = taskList.filter(t => 
        t.status !== 'backlog' && t.status !== 'planned'
      ).length;
      const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({ total, started, completed, percentComplete });
    }
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const linkTask = async (taskId: string): Promise<boolean> => {
    if (!projectId) return false;

    const { error } = await supabase
      .from('crm_tasks')
      .update({ linked_project_id: projectId })
      .eq('id', taskId);

    if (error) {
      console.error(error);
      return false;
    }

    fetchTasks();
    return true;
  };

  const unlinkTask = async (taskId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('crm_tasks')
      .update({ linked_project_id: null })
      .eq('id', taskId);

    if (error) {
      console.error(error);
      return false;
    }

    fetchTasks();
    return true;
  };

  return {
    tasks,
    stats,
    loading,
    linkTask,
    unlinkTask,
    refetch: fetchTasks,
  };
}
