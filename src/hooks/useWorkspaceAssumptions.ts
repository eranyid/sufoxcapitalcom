 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 import type { WorkspaceAssumption, AssumptionSource } from '@/types/workspaces';
 
 const DEFAULT_ASSET_CLASSES = [
   { asset_class: 'US Equities', expected_return: 7.5, expected_volatility: 16, confidence_level: 60 },
   { asset_class: 'International Equities', expected_return: 7.0, expected_volatility: 18, confidence_level: 50 },
   { asset_class: 'Emerging Markets', expected_return: 8.5, expected_volatility: 24, confidence_level: 40 },
   { asset_class: 'US Bonds', expected_return: 4.0, expected_volatility: 5, confidence_level: 70 },
   { asset_class: 'International Bonds', expected_return: 3.5, expected_volatility: 6, confidence_level: 60 },
   { asset_class: 'Real Estate', expected_return: 6.0, expected_volatility: 14, confidence_level: 50 },
   { asset_class: 'Commodities', expected_return: 4.5, expected_volatility: 18, confidence_level: 40 },
   { asset_class: 'Private Equity', expected_return: 10.0, expected_volatility: 22, confidence_level: 35 },
   { asset_class: 'Hedge Funds', expected_return: 6.5, expected_volatility: 10, confidence_level: 45 },
   { asset_class: 'Cash', expected_return: 4.0, expected_volatility: 0.5, confidence_level: 95 },
 ];
 
 export function useWorkspaceAssumptions(workspaceId: string | undefined) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const assumptionsQuery = useQuery({
     queryKey: ['workspace-assumptions', workspaceId],
     queryFn: async () => {
       if (!workspaceId || !user?.id) return [];
       
       const { data, error } = await supabase
         .from('workspace_assumptions')
         .select('*')
         .eq('workspace_id', workspaceId)
         .order('asset_class', { ascending: true });
       
       if (error) throw error;
       return data as WorkspaceAssumption[];
     },
     enabled: !!workspaceId && !!user?.id,
   });
 
   const initializeDefaults = useMutation({
     mutationFn: async () => {
       if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');
       
       const insertData = DEFAULT_ASSET_CLASSES.map(ac => ({
         workspace_id: workspaceId,
         user_id: user.id,
         asset_class: ac.asset_class,
         expected_return: ac.expected_return,
         expected_volatility: ac.expected_volatility,
         confidence_level: ac.confidence_level,
         source_tag: 'analyst_view' as AssumptionSource,
         version: 1,
       }));
       
       const { data, error } = await supabase
         .from('workspace_assumptions')
         .insert(insertData)
         .select();
       
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['workspace-assumptions', workspaceId] });
       toast.success('Default assumptions initialized');
     },
     onError: (error) => {
       toast.error('Failed to initialize: ' + error.message);
     },
   });
 
   const upsertAssumption = useMutation({
     mutationFn: async (assumption: Partial<WorkspaceAssumption> & { asset_class: string }) => {
       if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');
       
       // Check if exists
       const existing = assumptionsQuery.data?.find(a => a.asset_class === assumption.asset_class);
       
       if (existing) {
         const { data, error } = await supabase
           .from('workspace_assumptions')
           .update({
             expected_return: assumption.expected_return,
             expected_volatility: assumption.expected_volatility,
             confidence_level: assumption.confidence_level,
             source_tag: assumption.source_tag,
             source_notes: assumption.source_notes,
             strategy: assumption.strategy,
             sub_strategy: assumption.sub_strategy,
           })
           .eq('id', existing.id)
           .select()
           .single();
         
         if (error) throw error;
         return data;
       } else {
         const { data, error } = await supabase
           .from('workspace_assumptions')
           .insert({
             workspace_id: workspaceId,
             user_id: user.id,
             asset_class: assumption.asset_class,
             expected_return: assumption.expected_return ?? 5,
             expected_volatility: assumption.expected_volatility ?? 10,
             confidence_level: assumption.confidence_level ?? 50,
             source_tag: assumption.source_tag ?? 'analyst_view',
             version: 1,
           })
           .select()
           .single();
         
         if (error) throw error;
         return data;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['workspace-assumptions', workspaceId] });
     },
     onError: (error) => {
       toast.error('Failed to save assumption: ' + error.message);
     },
   });
 
   const deleteAssumption = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('workspace_assumptions')
         .delete()
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['workspace-assumptions', workspaceId] });
       toast.success('Assumption removed');
     },
     onError: (error) => {
       toast.error('Failed to delete: ' + error.message);
     },
   });
 
   return {
     assumptions: assumptionsQuery.data ?? [],
     isLoading: assumptionsQuery.isLoading,
     error: assumptionsQuery.error,
     initializeDefaults,
     upsertAssumption,
     deleteAssumption,
   };
 }