 import { useState } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { useClients } from '@/hooks/useClients';
 import { Loader2 } from 'lucide-react';
 
 interface CreateClientDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const { createClient } = useClients();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!name.trim()) return;
 
     await createClient.mutateAsync({ 
       name: name.trim(), 
       description: description.trim() || undefined 
     });
     
     setName('');
     setDescription('');
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Add New Client</DialogTitle>
           <DialogDescription>
             Create a new client context for portfolio management.
           </DialogDescription>
         </DialogHeader>
         
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="name">Client Name</Label>
             <Input
               id="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Enter client name"
               autoFocus
             />
           </div>
           
           <div className="space-y-2">
             <Label htmlFor="description">Description (optional)</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Brief description of this client"
               rows={3}
             />
           </div>
           
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button type="submit" disabled={!name.trim() || createClient.isPending}>
               {createClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Create Client
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }