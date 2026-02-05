 import { useState } from 'react';
 import { Building2, Plus, ArrowRight, Loader2, MoreHorizontal, Trash2, Power, PowerOff, Edit2 } from 'lucide-react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
 import { useClients, Client } from '@/hooks/useClients';
 import { CreateClientDialog } from './CreateClientDialog';
 import { formatDistanceToNow } from 'date-fns';
 
 interface ClientsManagementModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSelectClient: (client: Client) => void;
 }
 
 export function ClientsManagementModal({ open, onOpenChange, onSelectClient }: ClientsManagementModalProps) {
   const { clients, isLoading, updateClient, deleteClient } = useClients();
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
 
   const activeClients = clients.filter(c => c.status === 'active');
   const inactiveClients = clients.filter(c => c.status !== 'active');
 
   const handleToggleStatus = async (client: Client) => {
     const newStatus = client.status === 'active' ? 'inactive' : 'active';
     await updateClient.mutateAsync({ id: client.id, status: newStatus });
   };
 
   const handleDelete = async () => {
     if (!clientToDelete) return;
     await deleteClient.mutateAsync(clientToDelete.id);
     setClientToDelete(null);
   };
 
   return (
     <>
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
           <DialogHeader>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                   <Building2 className="h-5 w-5 text-accent" />
                 </div>
                 <div>
                   <DialogTitle className="text-xl">Clients</DialogTitle>
                   <DialogDescription className="text-sm">
                     Manage and select client contexts
                   </DialogDescription>
                 </div>
               </div>
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={() => setShowCreateDialog(true)}
                 className="gap-1.5"
               >
                 <Plus className="h-4 w-4" />
                 Add
               </Button>
             </div>
           </DialogHeader>
           
           <div className="flex-1 overflow-hidden mt-4">
             {isLoading ? (
               <div className="flex items-center justify-center h-40">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               </div>
             ) : clients.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                 <div className="p-4 rounded-full bg-muted/50 mb-4">
                   <Building2 className="h-8 w-8 text-muted-foreground" />
                 </div>
                 <p className="text-muted-foreground mb-4">No clients yet</p>
                 <Button 
                   variant="outline" 
                   onClick={() => setShowCreateDialog(true)}
                   className="gap-1.5"
                 >
                   <Plus className="h-4 w-4" />
                   Create First Client
                 </Button>
               </div>
             ) : (
               <ScrollArea className="h-[400px] pr-2">
                 <div className="space-y-4">
                   {activeClients.length > 0 && (
                     <div className="space-y-2">
                       <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium px-1">Active</p>
                       {activeClients.map((client) => (
                         <ClientRow 
                           key={client.id} 
                           client={client} 
                           onSelect={() => {
                             onSelectClient(client);
                             onOpenChange(false);
                           }}
                           onToggleStatus={() => handleToggleStatus(client)}
                           onDelete={() => setClientToDelete(client)}
                         />
                       ))}
                     </div>
                   )}
                   
                   {inactiveClients.length > 0 && (
                     <div className="space-y-2 mt-6">
                       <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium px-1">Inactive</p>
                       {inactiveClients.map((client) => (
                         <ClientRow 
                           key={client.id} 
                           client={client} 
                           onSelect={() => {
                             onSelectClient(client);
                             onOpenChange(false);
                           }}
                           onToggleStatus={() => handleToggleStatus(client)}
                           onDelete={() => setClientToDelete(client)}
                         />
                       ))}
                     </div>
                   )}
                 </div>
               </ScrollArea>
             )}
           </div>
         </DialogContent>
       </Dialog>
 
       <CreateClientDialog 
         open={showCreateDialog} 
         onOpenChange={setShowCreateDialog} 
       />
 
       <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Client</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{clientToDelete?.name}"? This will remove all associated data and cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction 
               onClick={handleDelete}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 }
 
 interface ClientRowProps {
   client: Client;
   onSelect: () => void;
   onToggleStatus: () => void;
   onDelete: () => void;
 }
 
 function ClientRow({ client, onSelect, onToggleStatus, onDelete }: ClientRowProps) {
   const isActive = client.status === 'active';
   
   return (
     <div className="group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-border transition-colors">
       <button
         onClick={onSelect}
         className="flex-1 min-w-0 text-left"
       >
         <div className="flex items-center gap-2">
           <span className={`font-medium truncate ${!isActive ? 'text-muted-foreground' : 'text-foreground'}`}>
             {client.name}
           </span>
           <Badge 
             variant={isActive ? 'default' : 'secondary'}
             className="text-xs capitalize"
           >
             {client.status}
           </Badge>
         </div>
         {client.description && (
           <p className="text-xs text-muted-foreground mt-0.5 truncate">{client.description}</p>
         )}
         <p className="text-[10px] text-muted-foreground/60 mt-1">
           Updated {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
         </p>
       </button>
       
       <div className="flex items-center gap-1 ml-2">
         <Button
           variant="ghost"
           size="icon"
           className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
           onClick={onSelect}
         >
           <ArrowRight className="h-4 w-4" />
         </Button>
         
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8"
             >
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={onToggleStatus}>
               {isActive ? (
                 <>
                   <PowerOff className="h-4 w-4 mr-2" />
                   Deactivate
                 </>
               ) : (
                 <>
                   <Power className="h-4 w-4 mr-2" />
                   Activate
                 </>
               )}
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
               <Trash2 className="h-4 w-4 mr-2" />
               Delete
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
     </div>
   );
 }