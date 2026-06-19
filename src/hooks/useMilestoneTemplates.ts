import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { MilestoneTemplate, MilestoneTemplateDef } from '@/lib/milestoneTemplates';
import type { Json } from '@/integrations/supabase/types';

interface MilestoneTemplateRow {
  id: string;
  user_id: string;
  label: string;
  description: string | null;
  icon: string;
  milestones: unknown;
  created_at: string;
  updated_at: string;
}

function rowToTemplate(row: MilestoneTemplateRow): MilestoneTemplate {
  return {
    key: `custom:${row.id}`,
    id: row.id,
    label: row.label,
    description: row.description || '',
    icon: row.icon || 'LayoutList',
    milestones: Array.isArray(row.milestones) ? (row.milestones as MilestoneTemplateDef[]) : [],
    custom: true,
  };
}

export interface CustomTemplateInput {
  label: string;
  description?: string;
  icon?: string;
  milestones: MilestoneTemplateDef[];
}

/**
 * CRUD for user-defined milestone templates (milestone_templates table).
 * Built-in templates live in code; these are the user's reusable custom ones.
 */
export function useMilestoneTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('milestone_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load milestone templates:', error);
      toast.error('Failed to load custom templates');
    } else {
      setTemplates(((data || []) as MilestoneTemplateRow[]).map(rowToTemplate));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (input: CustomTemplateInput): Promise<MilestoneTemplate | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('milestone_templates')
      .insert({
        user_id: user.id,
        label: input.label,
        description: input.description || null,
        icon: input.icon || 'LayoutList',
        milestones: input.milestones as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to save template');
      console.error(error);
      return null;
    }

    const template = rowToTemplate(data as MilestoneTemplateRow);
    setTemplates(prev => [...prev, template]);
    toast.success('Template saved');
    return template;
  };

  const updateTemplate = async (id: string, input: CustomTemplateInput): Promise<boolean> => {
    const { error } = await supabase
      .from('milestone_templates')
      .update({
        label: input.label,
        description: input.description || null,
        icon: input.icon || 'LayoutList',
        milestones: input.milestones as unknown as Json,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update template');
      console.error(error);
      return false;
    }

    setTemplates(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, label: input.label, description: input.description || '', icon: input.icon || 'LayoutList', milestones: input.milestones }
          : t,
      ),
    );
    toast.success('Template updated');
    return true;
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('milestone_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete template');
      console.error(error);
      return false;
    }

    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
    return true;
  };

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}
