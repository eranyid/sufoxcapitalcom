 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 import type { WorkspaceConstraints, ConstraintRule } from '@/types/workspaces';
 import type { Json } from '@/integrations/supabase/types';
 
 const DEFAULT_CONSTRAINTS: Omit<WorkspaceConstraints, 'id' | 'workspace_id' | 'user_id' | 'created_at' | 'updated_at'> = {
   version: 1,
   target_return_nominal: 7,
   target_return_real: 5,
   max_drawdown: 20,
   investment_horizon_years: 10,
   max_single_asset_pct: 20,
   max_single_geography_pct: 40,
   max_single_strategy_pct: 30,
   liquidity_t0_min_pct: 5,
   liquidity_t30_min_pct: 15,
   liquidity_t90_min_pct: 30,
   base_currency: 'USD',
   allowed_currencies: ['USD', 'EUR', 'GBP', 'ILS'],
   max_fx_exposure_pct: 30,
   regulatory_constraints: [],
   esg_exclusions: [],
   special_constraints: '',
   hard_constraints: [],
   soft_constraints: [],
 };
 
 export function useWorkspaceConstraints(workspaceId: string | undefined) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const constraintsQuery = useQuery({
     queryKey: ['workspace-constraints', workspaceId],
     queryFn: async () => {
       if (!workspaceId || !user?.id) return null;
       
       const { data, error } = await supabase
         .from('workspace_constraints')
         .select('*')
         .eq('workspace_id', workspaceId)
         .order('version', { ascending: false })
         .limit(1)
         .maybeSingle();
       
       if (error) throw error;
       
       if (!data) {
         // Return defaults with proper typing
         return {
           ...DEFAULT_CONSTRAINTS,
           id: '',
           workspace_id: workspaceId,
           user_id: user.id,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
         } as WorkspaceConstraints;
       }
       
       // Parse JSONB fields
       return {
         ...data,
         regulatory_constraints: (data.regulatory_constraints as unknown as ConstraintRule[]) || [],
         hard_constraints: (data.hard_constraints as unknown as ConstraintRule[]) || [],
         soft_constraints: (data.soft_constraints as unknown as ConstraintRule[]) || [],
       } as WorkspaceConstraints;
     },
     enabled: !!workspaceId && !!user?.id,
   });
 
   const saveConstraints = useMutation({
     mutationFn: async (constraints: Partial<WorkspaceConstraints>) => {
       if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');
       
       const payload = {
         workspace_id: workspaceId,
         user_id: user.id,
         version: (constraintsQuery.data?.version ?? 0) + 1,
         target_return_nominal: constraints.target_return_nominal,
         target_return_real: constraints.target_return_real,
         max_drawdown: constraints.max_drawdown,
         investment_horizon_years: constraints.investment_horizon_years,
         max_single_asset_pct: constraints.max_single_asset_pct,
         max_single_geography_pct: constraints.max_single_geography_pct,
         max_single_strategy_pct: constraints.max_single_strategy_pct,
         liquidity_t0_min_pct: constraints.liquidity_t0_min_pct,
         liquidity_t30_min_pct: constraints.liquidity_t30_min_pct,
         liquidity_t90_min_pct: constraints.liquidity_t90_min_pct,
         base_currency: constraints.base_currency,
         allowed_currencies: constraints.allowed_currencies,
         max_fx_exposure_pct: constraints.max_fx_exposure_pct,
         regulatory_constraints: (constraints.regulatory_constraints ?? []) as unknown as Json,
         esg_exclusions: constraints.esg_exclusions,
         special_constraints: constraints.special_constraints,
         hard_constraints: (constraints.hard_constraints ?? []) as unknown as Json,
         soft_constraints: (constraints.soft_constraints ?? []) as unknown as Json,
       };
       
       // Upsert - if exists update, else insert
       if (constraintsQuery.data?.id) {
         const { data, error } = await supabase
           .from('workspace_constraints')
           .update(payload)
           .eq('id', constraintsQuery.data.id)
           .select()
           .single();
         
         if (error) throw error;
         return data;
       } else {
         const { data, error } = await supabase
           .from('workspace_constraints')
           .insert(payload)
           .select()
           .single();
         
         if (error) throw error;
         return data;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['workspace-constraints', workspaceId] });
       toast.success('Constraints saved');
     },
     onError: (error) => {
       toast.error('Failed to save constraints: ' + error.message);
     },
   });
 
   return {
     constraints: constraintsQuery.data,
     isLoading: constraintsQuery.isLoading,
     error: constraintsQuery.error,
     saveConstraints,
   };
 }