 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 import type { ClientWorkspace, WorkspaceStatus } from '@/types/workspaces';
 
 export function useClientWorkspaces() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const workspacesQuery = useQuery({
     queryKey: ['client-workspaces', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
       
       const { data, error } = await supabase
         .from('client_workspaces')
         .select('*')
         .order('updated_at', { ascending: false });
       
       if (error) throw error;
       return data as ClientWorkspace[];
     },
     enabled: !!user?.id,
   });
 
   const createWorkspace = useMutation({
     mutationFn: async (workspace: { name: string; client_name?: string; description?: string }) => {
       if (!user?.id) throw new Error('Not authenticated');
       
       const { data, error } = await supabase
         .from('client_workspaces')
         .insert({
           user_id: user.id,
           name: workspace.name,
           client_name: workspace.client_name,
           description: workspace.description,
           status: 'draft' as WorkspaceStatus,
         })
         .select()
         .single();
       
       if (error) throw error;
       return data as ClientWorkspace;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['client-workspaces'] });
       toast.success('Workspace created');
     },
     onError: (error) => {
       toast.error('Failed to create workspace: ' + error.message);
     },
   });
 
   const updateWorkspace = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<ClientWorkspace> & { id: string }) => {
       const { data, error } = await supabase
         .from('client_workspaces')
         .update(updates)
         .eq('id', id)
         .select()
         .single();
       
       if (error) throw error;
       return data as ClientWorkspace;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['client-workspaces'] });
     },
     onError: (error) => {
       toast.error('Failed to update workspace: ' + error.message);
     },
   });
 
   const deleteWorkspace = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('client_workspaces')
         .delete()
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['client-workspaces'] });
       toast.success('Workspace deleted');
     },
     onError: (error) => {
       toast.error('Failed to delete workspace: ' + error.message);
     },
   });
 
   return {
     workspaces: workspacesQuery.data ?? [],
     isLoading: workspacesQuery.isLoading,
     error: workspacesQuery.error,
     createWorkspace,
     updateWorkspace,
     deleteWorkspace,
   };
 }
 
 export function useWorkspaceById(workspaceId: string | undefined) {
   const { user } = useAuth();
 
   return useQuery({
     queryKey: ['client-workspace', workspaceId],
     queryFn: async () => {
       if (!workspaceId || !user?.id) return null;
       
       const { data, error } = await supabase
         .from('client_workspaces')
         .select('*')
         .eq('id', workspaceId)
         .single();
       
       if (error) throw error;
       return data as ClientWorkspace;
     },
     enabled: !!workspaceId && !!user?.id,
   });
 }