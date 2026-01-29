import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  TargetAllocation, 
  TargetAllocationLine, 
  WizardData,
  DimensionType,
  TargetConstraints,
  GeographyAllocation,
  AssetClassAllocation,
} from '@/types/construction';
import type { Json } from '@/integrations/supabase/types';

interface UseTargetAllocationReturn {
  activeTarget: TargetAllocation | null;
  allTargets: TargetAllocation[];
  targetLines: TargetAllocationLine[];
  isLoading: boolean;
  saveTarget: (data: WizardData, name?: string) => Promise<string | null>;
  loadTarget: (targetId: string) => Promise<WizardData | null>;
  setActiveTarget: (targetId: string) => Promise<void>;
  deleteTarget: (targetId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useTargetAllocation(): UseTargetAllocationReturn {
  const { user } = useAuth();
  const [activeTarget, setActiveTargetState] = useState<TargetAllocation | null>(null);
  const [allTargets, setAllTargets] = useState<TargetAllocation[]>([]);
  const [targetLines, setTargetLines] = useState<TargetAllocationLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTargets = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data: targets, error } = await supabase
        .from('target_allocations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cast constraints_json properly
      const typedTargets = (targets || []).map(t => ({
        ...t,
        constraints_json: t.constraints_json as unknown as TargetConstraints,
        status: t.status as 'draft' | 'active',
      }));

      setAllTargets(typedTargets);
      
      const active = typedTargets.find(t => t.is_active);
      setActiveTargetState(active || null);

      // Fetch lines for active target
      if (active) {
        const { data: lines, error: linesError } = await supabase
          .from('target_allocation_lines')
          .select('*')
          .eq('target_id', active.id);

        if (linesError) throw linesError;
        
        setTargetLines((lines || []).map(l => ({
          ...l,
          dimension_type: l.dimension_type as DimensionType,
          metadata_json: (l.metadata_json || {}) as Record<string, unknown>,
        })));
      }
    } catch (error) {
      console.error('Error fetching target allocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const saveTarget = async (data: WizardData, name = 'Primary Target'): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Please login to save');
      return null;
    }

    try {
      // Deactivate existing active targets
      await supabase
        .from('target_allocations')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Create new target allocation
      const { data: newTarget, error: targetError } = await supabase
        .from('target_allocations')
        .insert({
          user_id: user.id,
          name,
          is_active: true,
          objective: data.objective,
          horizon: data.horizon,
          risk_level: data.riskLevel,
          constraints_json: data.constraints as unknown as Json,
          status: 'active',
        })
        .select()
        .single();

      if (targetError) throw targetError;

      // Create allocation lines
      const lines: Array<{
        target_id: string;
        dimension_type: 'geography' | 'asset_class' | 'bucket';
        key: string;
        parent_key: string | null;
        target_weight: number;
        metadata_json: Json;
      }> = [];

      // Geography lines
      Object.entries(data.geography).forEach(([key, weight]) => {
        lines.push({
          target_id: newTarget.id,
          dimension_type: 'geography',
          key,
          parent_key: null,
          target_weight: weight,
          metadata_json: {} as Json,
        });
      });

      // Asset class lines
      Object.entries(data.assetClasses).forEach(([key, weight]) => {
        lines.push({
          target_id: newTarget.id,
          dimension_type: 'asset_class',
          key,
          parent_key: null,
          target_weight: weight,
          metadata_json: {} as Json,
        });
      });

      // Bucket lines
      data.buckets.forEach((bucket) => {
        lines.push({
          target_id: newTarget.id,
          dimension_type: 'bucket',
          key: bucket.key,
          parent_key: null,
          target_weight: bucket.targetWeight,
          metadata_json: {
            label: bucket.label,
            implementation: bucket.implementation,
            benchmark: bucket.benchmark || null,
          } as Json,
        });
      });

      const { error: linesError } = await supabase
        .from('target_allocation_lines')
        .insert(lines);

      if (linesError) throw linesError;

      toast.success('Target Allocation saved successfully');
      await fetchTargets();
      return newTarget.id;
    } catch (error) {
      console.error('Error saving target allocation:', error);
      toast.error('Failed to save target allocation');
      return null;
    }
  };

  const loadTarget = async (targetId: string): Promise<WizardData | null> => {
    try {
      const { data: target, error: targetError } = await supabase
        .from('target_allocations')
        .select('*')
        .eq('id', targetId)
        .single();

      if (targetError) throw targetError;

      const { data: lines, error: linesError } = await supabase
        .from('target_allocation_lines')
        .select('*')
        .eq('target_id', targetId);

      if (linesError) throw linesError;

      const geography: GeographyAllocation = { israel: 0, usa: 0, europe: 0, other: 0 };
      const assetClasses: AssetClassAllocation = { equities: 0, bonds: 0, hedging: 0, alternatives: 0, cash: 0 };
      const buckets: WizardData['buckets'] = [];

      lines?.forEach(line => {
        if (line.dimension_type === 'geography') {
          if (line.key in geography) {
            geography[line.key as keyof GeographyAllocation] = Number(line.target_weight);
          }
        } else if (line.dimension_type === 'asset_class') {
          if (line.key in assetClasses) {
            assetClasses[line.key as keyof AssetClassAllocation] = Number(line.target_weight);
          }
        } else if (line.dimension_type === 'bucket') {
          const meta = (line.metadata_json || {}) as Record<string, unknown>;
          buckets.push({
            key: line.key,
            label: (meta.label as string) || line.key,
            targetWeight: Number(line.target_weight),
            implementation: (meta.implementation as WizardData['buckets'][0]['implementation']) || 'stocks',
            benchmark: meta.benchmark as string | undefined,
          });
        }
      });

      const constraints = target.constraints_json as unknown as TargetConstraints;

      return {
        objective: target.objective as WizardData['objective'],
        horizon: target.horizon as WizardData['horizon'],
        riskLevel: target.risk_level as WizardData['riskLevel'],
        constraints: constraints || {
          minEquities: 70,
          minCash: 5,
          minHedge: 5,
          liquidityRequirement: 'medium',
        },
        geography,
        assetClasses,
        buckets,
      };
    } catch (error) {
      console.error('Error loading target:', error);
      return null;
    }
  };

  const setActiveTarget = async (targetId: string): Promise<void> => {
    if (!user?.id) return;

    try {
      // Deactivate all
      await supabase
        .from('target_allocations')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected
      await supabase
        .from('target_allocations')
        .update({ is_active: true })
        .eq('id', targetId);

      toast.success('Active target updated');
      await fetchTargets();
    } catch (error) {
      console.error('Error setting active target:', error);
      toast.error('Failed to update active target');
    }
  };

  const deleteTarget = async (targetId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('target_allocations')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      toast.success('Target allocation deleted');
      await fetchTargets();
    } catch (error) {
      console.error('Error deleting target:', error);
      toast.error('Failed to delete target');
    }
  };

  return {
    activeTarget,
    allTargets,
    targetLines,
    isLoading,
    saveTarget,
    loadTarget,
    setActiveTarget,
    deleteTarget,
    refetch: fetchTargets,
  };
}
