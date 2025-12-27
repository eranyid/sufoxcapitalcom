import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Project, ProjectHealth, ProjectPriority, ProjectStatus } from '@/types/projects';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } else {
      setProjects((data || []) as Project[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, description?: string): Promise<Project | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create project');
      console.error(error);
      return null;
    }

    const newProject = data as Project;
    setProjects(prev => [newProject, ...prev]);
    toast.success('Project created');
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<boolean> => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update project');
      console.error(error);
      return false;
    }

    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
    return true;
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
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

export function useProject(projectId: string | undefined) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      toast.error('Failed to load project');
      console.error(error);
    } else {
      setProject(data as Project | null);
    }
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProject = async (updates: Partial<Project>): Promise<boolean> => {
    if (!projectId) return false;

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update project');
      console.error(error);
      return false;
    }

    setProject(prev => (prev ? { ...prev, ...updates } : null));
    toast.success('Project updated');
    return true;
  };

  return {
    project,
    loading,
    updateProject,
    refetch: fetchProject,
  };
}
