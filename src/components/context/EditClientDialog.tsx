 import { useState, useEffect } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { useClients, Client } from '@/hooks/useClients';
 import { Loader2 } from 'lucide-react';
 
 interface EditClientDialogProps {
   client: Client | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const { updateClient } = useClients();
 
   useEffect(() => {
     if (client) {
       setName(client.name);
       setDescription(client.description || '');
     }
   }, [client]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!client || !name.trim()) return;
 
     await updateClient.mutateAsync({ 
       id: client.id,
       name: name.trim(), 
       description: description.trim() || undefined 
     });
     
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md bg-[#0d0d10] border-[rgba(60,100,160,0.2)]">
         <DialogHeader>
           <DialogTitle className="text-white/90">Edit Client</DialogTitle>
           <DialogDescription className="text-white/40">
             Update client name and details.
           </DialogDescription>
         </DialogHeader>
         
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="edit-name" className="text-white/70">Client Name</Label>
             <Input
               id="edit-name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Enter client name"
               className="bg-[#15151a] border-border/50 text-white/90"
               autoFocus
             />
           </div>
           
           <div className="space-y-2">
             <Label htmlFor="edit-description" className="text-white/70">Description (optional)</Label>
             <Textarea
               id="edit-description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Brief description of this client"
               className="bg-[#15151a] border-border/50 text-white/90"
               rows={3}
             />
           </div>
           
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
               Cancel
             </Button>
             <Button 
               type="submit" 
               disabled={!name.trim() || updateClient.isPending}
               className="bg-[#5a9bd4] hover:bg-[#4a8bc4] text-white"
             >
               {updateClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Save Changes
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }