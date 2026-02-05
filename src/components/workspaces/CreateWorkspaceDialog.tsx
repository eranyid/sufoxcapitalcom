 import { useState } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Plus } from 'lucide-react';
 
 interface CreateWorkspaceDialogProps {
   onSubmit: (data: { name: string; client_name?: string; description?: string }) => void;
   isLoading?: boolean;
 }
 
 export function CreateWorkspaceDialog({ onSubmit, isLoading }: CreateWorkspaceDialogProps) {
   const [open, setOpen] = useState(false);
   const [name, setName] = useState('');
   const [clientName, setClientName] = useState('');
   const [description, setDescription] = useState('');
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!name.trim()) return;
     
     onSubmit({
       name: name.trim(),
       client_name: clientName.trim() || undefined,
       description: description.trim() || undefined,
     });
     
     setName('');
     setClientName('');
     setDescription('');
     setOpen(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button>
           <Plus className="h-4 w-4 mr-2" />
           New Workspace
         </Button>
       </DialogTrigger>
       <DialogContent className="sm:max-w-[425px]">
         <DialogHeader>
           <DialogTitle>Create Client Workspace</DialogTitle>
           <DialogDescription>
             Initialize a new portfolio manufacturing workspace for a client.
           </DialogDescription>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4 pt-4">
           <div className="space-y-2">
             <Label htmlFor="name">Workspace Name *</Label>
             <Input
               id="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="e.g., Smith Family Office Q1 2026"
               required
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="client">Client Name</Label>
             <Input
               id="client"
               value={clientName}
               onChange={(e) => setClientName(e.target.value)}
               placeholder="e.g., Smith Family Trust"
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="description">Description</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Brief description of the mandate..."
               rows={3}
             />
           </div>
           <div className="flex justify-end gap-2 pt-4">
             <Button type="button" variant="outline" onClick={() => setOpen(false)}>
               Cancel
             </Button>
             <Button type="submit" disabled={!name.trim() || isLoading}>
               Create Workspace
             </Button>
           </div>
         </form>
       </DialogContent>
     </Dialog>
   );
 }