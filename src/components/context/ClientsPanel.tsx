 import { useState } from 'react';
 import { Building2, Plus, ArrowRight, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { useClients, Client } from '@/hooks/useClients';
 import { CreateClientDialog } from './CreateClientDialog';
 import { formatDistanceToNow } from 'date-fns';
 
 interface ClientsPanelProps {
   onSelectClient: (client: Client) => void;
 }
 
 export function ClientsPanel({ onSelectClient }: ClientsPanelProps) {
   const { clients, isLoading } = useClients();
   const [showCreateDialog, setShowCreateDialog] = useState(false);
 
   const activeClients = clients.filter(c => c.status === 'active');
   const draftClients = clients.filter(c => c.status === 'draft');
 
   return (
     <>
       <Card className="h-full flex flex-col border-border/50 bg-card/80 backdrop-blur-sm">
         <CardHeader className="flex-shrink-0 space-y-4 pb-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                 <Building2 className="h-6 w-6 text-accent" />
               </div>
               <CardTitle className="text-2xl font-semibold">Clients</CardTitle>
             </div>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setShowCreateDialog(true)}
               className="gap-1.5"
             >
               <Plus className="h-4 w-4" />
               Add Client
             </Button>
           </div>
           <CardDescription className="text-base text-muted-foreground leading-relaxed">
             Manage portfolios and strategies within client contexts.
             Select a client to enter their operating environment.
           </CardDescription>
         </CardHeader>
         
         <CardContent className="flex-1 overflow-hidden">
           {isLoading ? (
             <div className="flex items-center justify-center h-full">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
             </div>
           ) : clients.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-6">
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
             <ScrollArea className="h-full pr-4">
               <div className="space-y-2">
                 {activeClients.length > 0 && (
                   <div className="space-y-2">
                     {activeClients.map((client) => (
                       <ClientRow 
                         key={client.id} 
                         client={client} 
                         onSelect={() => onSelectClient(client)} 
                       />
                     ))}
                   </div>
                 )}
                 
                 {draftClients.length > 0 && (
                   <div className="space-y-2 mt-4">
                     <p className="text-xs text-muted-foreground uppercase tracking-wide px-1">Drafts</p>
                     {draftClients.map((client) => (
                       <ClientRow 
                         key={client.id} 
                         client={client} 
                         onSelect={() => onSelectClient(client)} 
                       />
                     ))}
                   </div>
                 )}
               </div>
             </ScrollArea>
           )}
         </CardContent>
       </Card>
 
       <CreateClientDialog 
         open={showCreateDialog} 
         onOpenChange={setShowCreateDialog} 
       />
     </>
   );
 }
 
 function ClientRow({ client, onSelect }: { client: Client; onSelect: () => void }) {
   return (
     <button
       onClick={onSelect}
       className="w-full group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-border transition-colors text-left"
     >
       <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2">
           <span className="font-medium text-foreground truncate">{client.name}</span>
           <Badge 
             variant={client.status === 'active' ? 'default' : 'secondary'}
             className="text-xs capitalize"
           >
             {client.status}
           </Badge>
         </div>
         <p className="text-xs text-muted-foreground mt-0.5">
           Updated {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
         </p>
       </div>
       <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-2" />
     </button>
   );
 }