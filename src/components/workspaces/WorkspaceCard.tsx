 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { MoreHorizontal, Trash2, Edit, ExternalLink } from 'lucide-react';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { format } from 'date-fns';
 import type { ClientWorkspace } from '@/types/workspaces';
 import { useNavigate } from 'react-router-dom';
 
 interface WorkspaceCardProps {
   workspace: ClientWorkspace;
   onDelete: (id: string) => void;
 }
 
 const statusColors: Record<string, string> = {
   draft: 'bg-muted text-muted-foreground',
   active: 'bg-primary/20 text-primary',
   approved: 'bg-green-500/20 text-green-400',
   archived: 'bg-orange-500/20 text-orange-400',
 };
 
 export function WorkspaceCard({ workspace, onDelete }: WorkspaceCardProps) {
   const navigate = useNavigate();
   
   return (
     <Card 
       className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
       onClick={() => navigate(`/workspaces/${workspace.id}`)}
     >
       <CardHeader className="pb-2">
         <div className="flex items-start justify-between">
           <div className="space-y-1">
             <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
               {workspace.name}
             </CardTitle>
             {workspace.client_name && (
               <p className="text-sm text-muted-foreground">{workspace.client_name}</p>
             )}
           </div>
           <DropdownMenu>
             <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
               <Button variant="ghost" size="icon" className="h-8 w-8">
                 <MoreHorizontal className="h-4 w-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={(e) => {
                 e.stopPropagation();
                 navigate(`/workspaces/${workspace.id}`);
               }}>
                 <ExternalLink className="h-4 w-4 mr-2" />
                 Open
               </DropdownMenuItem>
               <DropdownMenuItem onClick={(e) => {
                 e.stopPropagation();
                 // Edit action
               }}>
                 <Edit className="h-4 w-4 mr-2" />
                 Rename
               </DropdownMenuItem>
               <DropdownMenuItem 
                 className="text-destructive"
                 onClick={(e) => {
                   e.stopPropagation();
                   onDelete(workspace.id);
                 }}
               >
                 <Trash2 className="h-4 w-4 mr-2" />
                 Delete
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </CardHeader>
       <CardContent className="pt-0">
         {workspace.description && (
           <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
             {workspace.description}
           </p>
         )}
         <div className="flex items-center justify-between">
           <Badge className={statusColors[workspace.status] || statusColors.draft}>
             {workspace.status}
           </Badge>
           <div className="text-xs text-muted-foreground">
             v{workspace.current_version} · {format(new Date(workspace.updated_at), 'MMM d, yyyy')}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }