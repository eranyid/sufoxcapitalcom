 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 
 export interface Client {
   id: string;
   user_id: string;
   name: string;
   status: 'active' | 'draft' | 'archived';
   description: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export function useClients() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const { data: clients = [], isLoading, error } = useQuery({
     queryKey: ['clients', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
       
       const { data, error } = await supabase
         .from('clients')
         .select('*')
         .order('updated_at', { ascending: false });
 
       if (error) throw error;
       return data as Client[];
     },
     enabled: !!user?.id,
   });
 
   const createClient = useMutation({
     mutationFn: async (input: { name: string; description?: string }) => {
       if (!user?.id) throw new Error('Not authenticated');
 
       const { data, error } = await supabase
         .from('clients')
         .insert({
           user_id: user.id,
           name: input.name,
           description: input.description || null,
           status: 'active',
         })
         .select()
         .single();
 
       if (error) throw error;
       return data as Client;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['clients'] });
       toast.success('Client created');
     },
     onError: (error) => {
       toast.error('Failed to create client: ' + error.message);
     },
   });
 
   const updateClient = useMutation({
     mutationFn: async (input: { id: string; name?: string; status?: string; description?: string }) => {
       const { data, error } = await supabase
         .from('clients')
         .update({
           ...(input.name !== undefined && { name: input.name }),
           ...(input.status !== undefined && { status: input.status }),
           ...(input.description !== undefined && { description: input.description }),
           updated_at: new Date().toISOString(),
         })
         .eq('id', input.id)
         .select()
         .single();
 
       if (error) throw error;
       return data as Client;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['clients'] });
       toast.success('Client updated');
     },
     onError: (error) => {
       toast.error('Failed to update client: ' + error.message);
     },
   });
 
   const deleteClient = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('clients')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['clients'] });
       toast.success('Client deleted');
     },
     onError: (error) => {
       toast.error('Failed to delete client: ' + error.message);
     },
   });
 
   return {
     clients,
     isLoading,
     error,
     createClient,
     updateClient,
     deleteClient,
   };
 }