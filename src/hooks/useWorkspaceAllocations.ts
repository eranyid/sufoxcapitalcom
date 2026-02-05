 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 import type { WorkspaceAllocation, AllocationLevel, LiquidityBucket } from '@/types/workspaces';
 import type { Json } from '@/integrations/supabase/types';
 
 export function useWorkspaceAllocations(workspaceId: string | undefined) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const allocationsQuery = useQuery({
     queryKey: ['workspace-allocations', workspaceId],
     queryFn: async () => {
       if (!workspaceId || !user?.id) return [];
       
       const { data, error } = await supabase
         .from('workspace_allocations')
         .select('*')
         .eq('workspace_id', workspaceId)
         .order('level', { ascending: true })
         .order('name', { ascending: true });
       
       if (error) throw error;
       
       // Build tree structure
       return buildAllocationTree(data as WorkspaceAllocation[]);
     },
     enabled: !!workspaceId && !!user?.id,
   });
 
   const flatAllocationsQuery = useQuery({
     queryKey: ['workspace-allocations-flat', workspaceId],
     queryFn: async () => {
       if (!workspaceId || !user?.id) return [];
       
       const { data, error } = await supabase
         .from('workspace_allocations')
         .select('*')
         .eq('workspace_id', workspaceId)
         .order('level', { ascending: true });
       
       if (error) throw error;
       return data as WorkspaceAllocation[];
     },
     enabled: !!workspaceId && !!user?.id,
   });
 
   const upsertAllocation = useMutation({
     mutationFn: async (allocation: Partial<WorkspaceAllocation> & { name: string; level_type: AllocationLevel }) => {
       if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');
       
       if (allocation.id) {
         // Update existing
         const { data, error } = await supabase
           .from('workspace_allocations')
           .update({
             name: allocation.name,
             weight: allocation.weight,
             parent_id: allocation.parent_id,
             ticker: allocation.ticker,
             liquidity_bucket: allocation.liquidity_bucket,
             expected_yield: allocation.expected_yield,
             metadata_json: (allocation.metadata_json ?? {}) as Json,
           })
           .eq('id', allocation.id)
           .select()
           .single();
         
         if (error) throw error;
         return data;
       } else {
         // Insert new
         const level = getLevelNumber(allocation.level_type);
         
         const { data, error } = await supabase
           .from('workspace_allocations')
           .insert({
             workspace_id: workspaceId,
             user_id: user.id,
             name: allocation.name,
             level: level,
             level_type: allocation.level_type,
             weight: allocation.weight ?? 0,
             parent_id: allocation.parent_id,
             ticker: allocation.ticker,
             liquidity_bucket: allocation.liquidity_bucket ?? 't30',
             metadata_json: (allocation.metadata_json ?? {}) as Json,
             version: 1,
           })
           .select()
           .single();
         
         if (error) throw error;
         return data;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['workspace-allocations', workspaceId] });
       queryClient.invalidateQueries({ queryKey: ['workspace-allocations-flat', workspaceId] });
     },
     onError: (error) => {
       toast.error('Failed to save allocation: ' + error.message);
     },
   });
 
   const deleteAllocation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('workspace_allocations')
         .delete()
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['workspace-allocations', workspaceId] });
       queryClient.invalidateQueries({ queryKey: ['workspace-allocations-flat', workspaceId] });
       toast.success('Allocation removed');
     },
     onError: (error) => {
       toast.error('Failed to delete: ' + error.message);
     },
   });
 
   const initializeFromAssumptions = useMutation({
     mutationFn: async (assumptions: { asset_class: string; weight: number; liquidity_bucket: LiquidityBucket }[]) => {
       if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');
       
       // Delete existing allocations first
       await supabase
         .from('workspace_allocations')
         .delete()
         .eq('workspace_id', workspaceId);
       
       // Insert new from assumptions
       const insertData = assumptions.map(a => ({
         workspace_id: workspaceId,
         user_id: user.id,
         name: a.asset_class,
         level: 0,
         level_type: 'asset_class' as AllocationLevel,
         weight: a.weight,
         liquidity_bucket: a.liquidity_bucket,
         version: 1,
         metadata_json: {},
       }));
       
       const { data, error } = await supabase
         .from('workspace_allocations')
         .insert(insertData)
         .select();
       
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['workspace-allocations', workspaceId] });
       queryClient.invalidateQueries({ queryKey: ['workspace-allocations-flat', workspaceId] });
       toast.success('Allocations initialized from assumptions');
     },
     onError: (error) => {
       toast.error('Failed to initialize: ' + error.message);
     },
   });
 
   return {
     allocations: allocationsQuery.data ?? [],
     flatAllocations: flatAllocationsQuery.data ?? [],
     isLoading: allocationsQuery.isLoading,
     error: allocationsQuery.error,
     upsertAllocation,
     deleteAllocation,
     initializeFromAssumptions,
   };
 }
 
 function getLevelNumber(levelType: AllocationLevel): number {
   const levels: Record<AllocationLevel, number> = {
     asset_class: 0,
     strategy: 1,
     geography: 2,
     vehicle: 3,
     instrument: 4,
   };
   return levels[levelType];
 }
 
 function buildAllocationTree(allocations: WorkspaceAllocation[]): WorkspaceAllocation[] {
   const map = new Map<string, WorkspaceAllocation>();
   const roots: WorkspaceAllocation[] = [];
   
   // First pass: create map
   allocations.forEach(a => {
     map.set(a.id, { ...a, children: [] });
   });
   
   // Second pass: build tree
   allocations.forEach(a => {
     const node = map.get(a.id)!;
     if (a.parent_id && map.has(a.parent_id)) {
       const parent = map.get(a.parent_id)!;
       parent.children = parent.children || [];
       parent.children.push(node);
     } else {
       roots.push(node);
     }
   });
   
   return roots;
 }