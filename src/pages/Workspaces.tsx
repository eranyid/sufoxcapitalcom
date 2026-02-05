 import { useClientWorkspaces } from '@/hooks/useClientWorkspaces';
 import { WorkspaceCard } from '@/components/workspaces/WorkspaceCard';
 import { CreateWorkspaceDialog } from '@/components/workspaces/CreateWorkspaceDialog';
 import { DashboardLoadingSkeleton } from '@/components/LoadingSkeleton';
 import { Briefcase } from 'lucide-react';
 
 export default function Workspaces() {
   const { workspaces, isLoading, createWorkspace, deleteWorkspace } = useClientWorkspaces();
 
   return (
     <div className="p-6 space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold">Client Workspaces</h1>
             <p className="text-muted-foreground mt-1">
               Portfolio Manufacturing Platform — 8-stage pipeline for institutional portfolio construction
             </p>
           </div>
           <CreateWorkspaceDialog 
             onSubmit={(data) => createWorkspace.mutate(data)}
             isLoading={createWorkspace.isPending}
           />
         </div>
 
         {isLoading ? (
           <DashboardLoadingSkeleton />
         ) : workspaces.length === 0 ? (
           <div className="text-center py-16 border border-dashed border-border rounded-lg">
             <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
             <h3 className="text-lg font-medium">No workspaces yet</h3>
             <p className="text-muted-foreground mt-1">
               Create your first client workspace to begin building portfolios.
             </p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {workspaces.map((workspace) => (
               <WorkspaceCard
                 key={workspace.id}
                 workspace={workspace}
                 onDelete={(id) => deleteWorkspace.mutate(id)}
               />
             ))}
           </div>
         )}
       </div>
   );
 }