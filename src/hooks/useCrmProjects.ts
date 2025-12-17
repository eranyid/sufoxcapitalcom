import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmProject, ProjectStatus } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useCrmProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('crm_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } else {
      setProjects((data as CrmProject[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (project: Partial<CrmProject>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('crm_projects')
      .insert({
        user_id: user.id,
        name: project.name,
        status: project.status || 'active',
        start_date: project.start_date || null,
        description: project.description || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create project');
      console.error(error);
      return null;
    }

    setProjects(prev => [data as CrmProject, ...prev]);
    toast.success('Project created');
    return data as CrmProject;
  };

  const updateProject = async (id: string, updates: Partial<CrmProject>) => {
    const { error } = await supabase
      .from('crm_projects')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update project');
      console.error(error);
      return false;
    }

    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return true;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('crm_projects')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete project');
      console.error(error);
      return false;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Project deleted');
    return true;
  };

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
