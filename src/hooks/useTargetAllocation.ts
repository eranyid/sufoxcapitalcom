import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
 import { useSession } from '@/context/SessionContext';
import { toast } from 'sonner';
import type { 
  TargetAllocation, 
  TargetAllocationLine, 
  WizardData,
  DimensionType,
  TargetConstraints,
  GeographyAllocation,
  AssetClassAllocation,
  AlternativesAllocation,
  AlternativeConfig,
  DEFAULT_ALTERNATIVES,
} from '@/types/construction';
import { DEFAULT_WIZARD_DATA } from '@/types/construction';
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
   const { session, isContextSet } = useSession();
  const [activeTarget, setActiveTargetState] = useState<TargetAllocation | null>(null);
  const [allTargets, setAllTargets] = useState<TargetAllocation[]>([]);
  const [targetLines, setTargetLines] = useState<TargetAllocationLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

   // Get client_id for queries
   const activeClientId = session.scope === 'client' ? session.clientId : null;
 
  const fetchTargets = useCallback(async () => {
     if (!user?.id || !isContextSet) return;
    
    try {
       let query = supabase
        .from('target_allocations')
        .select('*')
         .eq('user_id', user.id);
 
       // Filter by client context
       if (activeClientId) {
         query = query.eq('client_id', activeClientId);
       } else {
         query = query.is('client_id', null);
       }
 
       const { data: targets, error } = await query.order('created_at', { ascending: false });

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
   }, [user?.id, isContextSet, activeClientId]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const saveTarget = async (data: WizardData, name = 'Primary Target'): Promise<string | null> => {
     if (!user?.id || !isContextSet) {
      toast.error('Please login to save');
      return null;
    }

    try {
      // Deactivate existing active targets
       let deactivateQuery = supabase
        .from('target_allocations')
        .update({ is_active: false })
        .eq('user_id', user.id)
         .eq('is_active', true);
 
       if (activeClientId) {
         deactivateQuery = deactivateQuery.eq('client_id', activeClientId);
       } else {
         deactivateQuery = deactivateQuery.is('client_id', null);
       }
 
       await deactivateQuery;

      // Create new target allocation
      const { data: newTarget, error: targetError } = await supabase
        .from('target_allocations')
        .insert({
          user_id: user.id,
           client_id: activeClientId,
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
        dimension_type: 'geography' | 'asset_class' | 'alternatives' | 'bucket';
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

      // Alternatives lines
      data.alternativeConfigs.forEach((alt) => {
        lines.push({
          target_id: newTarget.id,
          dimension_type: 'alternatives',
          key: alt.key,
          parent_key: null,
          target_weight: alt.targetWeight,
          metadata_json: {
            label: alt.label,
            strategy: alt.strategy,
            geography: alt.geography,
            vintage: alt.vintage || null,
            lockupYears: alt.lockupYears || null,
          } as Json,
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
      const alternatives: AlternativesAllocation = { privateEquity: 0, ventureCapital: 0, realEstate: 0, infrastructure: 0, privateCredit: 0, hedgeFunds: 0 };
      const alternativeConfigs: AlternativeConfig[] = [];
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
        } else if (line.dimension_type === 'alternatives') {
          const meta = (line.metadata_json || {}) as Record<string, unknown>;
          if (line.key in alternatives) {
            alternatives[line.key as keyof AlternativesAllocation] = Number(line.target_weight);
          }
          alternativeConfigs.push({
            key: line.key as keyof AlternativesAllocation,
            label: (meta.label as string) || line.key,
            targetWeight: Number(line.target_weight),
            strategy: (meta.strategy as AlternativeConfig['strategy']) || 'buyout',
            geography: (meta.geography as AlternativeConfig['geography']) || 'global',
            vintage: meta.vintage as string | undefined,
            lockupYears: meta.lockupYears as number | undefined,
          });
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
        alternatives: Object.values(alternatives).some(v => v > 0) ? alternatives : DEFAULT_WIZARD_DATA.alternatives,
        alternativeConfigs: alternativeConfigs.length > 0 ? alternativeConfigs : DEFAULT_WIZARD_DATA.alternativeConfigs,
        buckets,
      };
    } catch (error) {
      console.error('Error loading target:', error);
      return null;
    }
  };

  const setActiveTarget = async (targetId: string): Promise<void> => {
     if (!user?.id || !isContextSet) return;

    try {
      // Deactivate all
       let deactivateQuery = supabase
        .from('target_allocations')
        .update({ is_active: false })
         .eq('user_id', user.id);
 
       if (activeClientId) {
         deactivateQuery = deactivateQuery.eq('client_id', activeClientId);
       } else {
         deactivateQuery = deactivateQuery.is('client_id', null);
       }
 
       await deactivateQuery;

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
