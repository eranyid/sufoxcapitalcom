import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { MilestoneTemplate } from '@/lib/milestoneTemplates';
import { addDays, format } from 'date-fns';

export interface BatchTarget {
  projectId: string;
  /** Per-project start date (yyyy-MM-dd); milestone due dates are offset from it. */
  startDate?: string;
}

/**
 * Applies a milestone template to multiple projects at once, with a start date
 * chosen per project. Optionally clears each project's existing milestones first.
 */
export function useBatchMilestones() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);

  const batchGenerate = async (
    template: MilestoneTemplate,
    targets: BatchTarget[],
    replaceExisting: boolean,
  ): Promise<boolean> => {
    if (!user || targets.length === 0 || template.milestones.length === 0) return false;

    setGenerating(true);
    try {
      if (replaceExisting) {
        const projectIds = targets.map(t => t.projectId);
        const { error: delError } = await supabase
          .from('project_milestones')
          .delete()
          .in('project_id', projectIds);
        if (delError) {
          console.error(delError);
          toast.error('Failed to clear existing milestones');
          return false;
        }
      }

      const rows = targets.flatMap(target => {
        const base = target.startDate ? new Date(target.startDate) : new Date();
        return template.milestones.map((m, i) => ({
          project_id: target.projectId,
          user_id: user.id,
          title: m.title,
          description: m.description,
          due_date: m.dayOffset !== null ? format(addDays(base, m.dayOffset), 'yyyy-MM-dd') : null,
          sort_order: i,
          template_key: template.key,
        }));
      });

      const { error } = await supabase.from('project_milestones').insert(rows);
      if (error) {
        console.error(error);
        toast.error('Failed to generate milestones');
        return false;
      }

      toast.success(`Generated milestones for ${targets.length} project${targets.length > 1 ? 's' : ''}`);
      return true;
    } finally {
      setGenerating(false);
    }
  };

  return { batchGenerate, generating };
}
