 import { useState } from 'react';
 import { Plus, ArrowRight, Loader2, MoreHorizontal, Trash2, Power, PowerOff } from 'lucide-react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
 import { useClients, Client } from '@/hooks/useClients';
 import { CreateClientDialog } from './CreateClientDialog';
 import { formatDistanceToNow } from 'date-fns';
 import PeopleIcon from '@/assets/people-icon.svg';
 
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
         <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col bg-[#0d0d10] border-[rgba(60,100,160,0.2)]">
           <DialogHeader>
             <div className="flex items-center justify-between pb-4 border-b border-border/30">
               <div className="flex items-center gap-4">
                 <div className="p-3 rounded-full bg-gradient-to-br from-[rgba(60,120,180,0.2)] to-[rgba(60,120,180,0.05)] border border-[rgba(60,120,180,0.3)]">
                   <img 
                     src={PeopleIcon} 
                     alt="" 
                     className="h-6 w-6" 
                     style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(400%) hue-rotate(175deg) brightness(95%)' }} 
                   />
                 </div>
                 <div>
                   <DialogTitle className="text-lg font-medium text-white/90">Clients</DialogTitle>
                   <DialogDescription className="text-xs text-white/40 mt-0.5">
                     Manage and select client contexts
                   </DialogDescription>
                 </div>
               </div>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => setShowCreateDialog(true)}
                 className="gap-1.5 text-[#5a9bd4] hover:text-[#5a9bd4] hover:bg-[rgba(60,120,180,0.1)] border border-[rgba(60,120,180,0.3)]"
               >
                 <Plus className="h-4 w-4" />
                 New Client
               </Button>
             </div>
           </DialogHeader>
           
           <div className="flex-1 overflow-hidden mt-2">
             {isLoading ? (
               <div className="flex items-center justify-center h-48">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               </div>
             ) : clients.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                 <div className="p-4 rounded-full bg-[rgba(60,120,180,0.1)] border border-[rgba(60,120,180,0.2)] mb-4">
                   <img 
                     src={PeopleIcon} 
                     alt="" 
                     className="h-8 w-8 opacity-50" 
                     style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(400%) hue-rotate(175deg) brightness(95%)' }} 
                   />
                 </div>
                 <p className="text-white/40 mb-4 text-sm">No clients yet</p>
                 <Button 
                   variant="ghost" 
                   onClick={() => setShowCreateDialog(true)}
                   className="gap-1.5 text-[#5a9bd4] hover:text-[#5a9bd4] hover:bg-[rgba(60,120,180,0.1)] border border-[rgba(60,120,180,0.3)]"
                 >
                   <Plus className="h-4 w-4" />
                   Create First Client
                 </Button>
               </div>
             ) : (
               <ScrollArea className="h-[350px] pr-2">
                 <div className="space-y-5">
                   {activeClients.length > 0 && (
                     <div className="space-y-2.5">
                       <p className="text-[10px] text-[#5a9bd4]/70 uppercase tracking-[0.15em] font-medium px-1">Active</p>
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
                     <div className="space-y-2.5">
                       <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium px-1">Inactive</p>
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
     <div className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
       isActive 
         ? 'border-[rgba(60,120,180,0.2)] bg-[rgba(60,120,180,0.05)] hover:bg-[rgba(60,120,180,0.1)] hover:border-[rgba(60,120,180,0.35)]' 
         : 'border-border/30 bg-background/30 hover:bg-muted/30 hover:border-border/50'
     }`}>
       <button
         onClick={onSelect}
         className="flex-1 min-w-0 text-left"
       >
         <div className="flex items-center gap-2">
           <span className={`font-medium truncate ${!isActive ? 'text-white/40' : 'text-white/90'}`}>
             {client.name}
           </span>
           {isActive && (
             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(60,120,180,0.2)] text-[#5a9bd4] border border-[rgba(60,120,180,0.3)]">
               Active
             </span>
           )}
         </div>
         {client.description && (
           <p className="text-xs text-white/40 mt-1 truncate">{client.description}</p>
         )}
         <p className="text-[10px] text-white/25 mt-1.5">
           Updated {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
         </p>
       </button>
       
       <div className="flex items-center gap-1 ml-3">
         <Button
           variant="ghost"
           size="icon"
           className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[#5a9bd4] hover:text-[#5a9bd4] hover:bg-[rgba(60,120,180,0.15)]"
           onClick={onSelect}
         >
           <ArrowRight className="h-4 w-4" />
         </Button>
         
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/5"
             >
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="bg-[#15151a] border-border/50">
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