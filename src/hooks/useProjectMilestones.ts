import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ProjectMilestone, MilestoneStatus } from '@/types/projects';
import type { MilestoneTemplate } from '@/lib/milestoneTemplates';
import { addDays, format } from 'date-fns';

export function useProjectMilestones(projectId: string | undefined) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to load milestones:', error);
    } else {
      setMilestones((data || []) as ProjectMilestone[]);
    }
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const addMilestone = async (
    title: string,
    description?: string,
    dueDate?: string,
    templateKey?: string,
  ): Promise<boolean> => {
    if (!user || !projectId) return false;

    const nextOrder = milestones.length > 0
      ? Math.max(...milestones.map(m => m.sort_order)) + 1
      : 0;

    const { data, error } = await supabase
      .from('project_milestones')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title,
        description: description || null,
        due_date: dueDate || null,
        sort_order: nextOrder,
        template_key: templateKey || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add milestone');
      console.error(error);
      return false;
    }

    setMilestones(prev => [...prev, data as ProjectMilestone]);
    return true;
  };

  const updateMilestone = async (
    milestoneId: string,
    updates: Partial<Pick<ProjectMilestone, 'title' | 'description' | 'status' | 'due_date' | 'sort_order'>>,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', milestoneId);

    if (error) {
      toast.error('Failed to update milestone');
      console.error(error);
      return false;
    }

    setMilestones(prev =>
      prev.map(m => (m.id === milestoneId ? { ...m, ...updates } : m)),
    );
    return true;
  };

  const deleteMilestone = async (milestoneId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      toast.error('Failed to delete milestone');
      console.error(error);
      return false;
    }

    setMilestones(prev => prev.filter(m => m.id !== milestoneId));
    return true;
  };

  const generateFromTemplate = async (
    template: MilestoneTemplate,
    startDate?: string,
  ): Promise<boolean> => {
    if (!user || !projectId) return false;

    const baseDate = startDate ? new Date(startDate) : new Date();
    const currentMaxOrder = milestones.length > 0
      ? Math.max(...milestones.map(m => m.sort_order))
      : -1;

    const rows = template.milestones.map((m, i) => ({
      project_id: projectId,
      user_id: user.id,
      title: m.title,
      description: m.description,
      due_date: m.dayOffset !== null
        ? format(addDays(baseDate, m.dayOffset), 'yyyy-MM-dd')
        : null,
      sort_order: currentMaxOrder + 1 + i,
      template_key: template.key,
    }));

    if (rows.length === 0) return true;

    const { data, error } = await supabase
      .from('project_milestones')
      .insert(rows)
      .select();

    if (error) {
      toast.error('Failed to generate milestones');
      console.error(error);
      return false;
    }

    setMilestones(prev => [...prev, ...(data as ProjectMilestone[])]);
    toast.success(`Generated ${rows.length} milestones`);
    return true;
  };

  const clearAllMilestones = async (): Promise<boolean> => {
    if (!projectId) return false;

    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      toast.error('Failed to clear milestones');
      console.error(error);
      return false;
    }

    setMilestones([]);
    return true;
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const totalCount = milestones.filter(m => m.status !== 'skipped').length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    milestones,
    loading,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    generateFromTemplate,
    clearAllMilestones,
    completedCount,
    totalCount,
    percentComplete,
    refetch: fetchMilestones,
  };
}
