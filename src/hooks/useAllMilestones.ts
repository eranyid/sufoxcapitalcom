import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ProjectMilestone } from '@/types/projects';

export interface MilestoneWithProject extends ProjectMilestone {
  project_name: string;
  project_start_date: string | null;
  project_target_date: string | null;
}

/**
 * Loads every milestone across all of the user's (non-deleted) projects,
 * joined with light project metadata, for the cross-project Gantt view.
 */
export function useAllMilestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<MilestoneWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .select('*, projects!inner(name, start_date, target_date, deleted_at)')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to load milestones:', error);
      toast.error('Failed to load milestones');
      setLoading(false);
      return;
    }

    const rows = (data || []) as (ProjectMilestone & {
      projects: {
        name: string;
        start_date: string | null;
        target_date: string | null;
        deleted_at: string | null;
      };
    })[];

    const mapped: MilestoneWithProject[] = rows
      .filter(r => r.projects && !r.projects.deleted_at)
      .map(({ projects, ...m }) => ({
        ...m,
        project_name: projects.name,
        project_start_date: projects.start_date,
        project_target_date: projects.target_date,
      }));

    setMilestones(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { milestones, loading, refetch: fetchAll };
}
