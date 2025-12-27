import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ProjectUpdate, ProjectHealth } from '@/types/projects';

export function useProjectUpdates(projectId: string | undefined) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setUpdates((data || []) as ProjectUpdate[]);
    }
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const addUpdate = async (text: string, status: ProjectHealth): Promise<boolean> => {
    if (!user || !projectId) return false;

    const { data, error } = await supabase
      .from('project_updates')
      .insert({
        project_id: projectId,
        user_id: user.id,
        author_user_id: user.id,
        text,
        status,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add update');
      console.error(error);
      return false;
    }

    setUpdates(prev => [data as ProjectUpdate, ...prev]);
    toast.success('Update added');
    return true;
  };

  const deleteUpdate = async (updateId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('project_updates')
      .delete()
      .eq('id', updateId);

    if (error) {
      toast.error('Failed to delete update');
      console.error(error);
      return false;
    }

    setUpdates(prev => prev.filter(u => u.id !== updateId));
    return true;
  };

  return {
    updates,
    loading,
    addUpdate,
    deleteUpdate,
    refetch: fetchUpdates,
  };
}
