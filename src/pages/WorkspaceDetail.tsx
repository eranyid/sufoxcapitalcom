 import { useState } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { useWorkspaceById } from '@/hooks/useClientWorkspaces';
 import { WorkspaceStageSidebar } from '@/components/workspaces/WorkspaceStageSidebar';
 import { ConstraintsStage } from '@/components/workspaces/stages/ConstraintsStage';
 import { AssumptionsStage } from '@/components/workspaces/stages/AssumptionsStage';
 import { ConstructionStage } from '@/components/workspaces/stages/ConstructionStage';
 import { ExpectedReturnStage } from '@/components/workspaces/stages/ExpectedReturnStage';
 import { OptimizationStage } from '@/components/workspaces/stages/OptimizationStage';
 import { ScenariosStage } from '@/components/workspaces/stages/ScenariosStage';
 import { NarrativeStage } from '@/components/workspaces/stages/NarrativeStage';
 import { VersionsStage } from '@/components/workspaces/stages/VersionsStage';
 import { Button } from '@/components/ui/button';
 import { ArrowLeft } from 'lucide-react';
 import { WorkspaceStage, WORKSPACE_STAGES } from '@/types/workspaces';
 import { DashboardLoadingSkeleton } from '@/components/LoadingSkeleton';
 
 export default function WorkspaceDetail() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { data: workspace, isLoading } = useWorkspaceById(id);
   const [currentStage, setCurrentStage] = useState<WorkspaceStage>('constraints');
   const [completedStages, setCompletedStages] = useState<WorkspaceStage[]>([]);
 
   const handleStageComplete = () => {
     if (!completedStages.includes(currentStage)) {
       setCompletedStages([...completedStages, currentStage]);
     }
     const currentIndex = WORKSPACE_STAGES.findIndex(s => s.id === currentStage);
     if (currentIndex < WORKSPACE_STAGES.length - 1) {
       setCurrentStage(WORKSPACE_STAGES[currentIndex + 1].id);
     }
   };
 
   if (isLoading) {
     return (
       <div className="p-6">
         <DashboardLoadingSkeleton />
       </div>
     );
   }
 
   if (!workspace) {
     return (
       <div className="p-6 text-center">
         <p className="text-muted-foreground">Workspace not found</p>
         <Button onClick={() => navigate('/workspaces')} className="mt-4">
           Back to Workspaces
         </Button>
       </div>
     );
   }
 
   const renderStage = () => {
     switch (currentStage) {
       case 'constraints':
         return <ConstraintsStage workspaceId={workspace.id} onComplete={handleStageComplete} />;
       case 'assumptions':
         return <AssumptionsStage workspaceId={workspace.id} onComplete={handleStageComplete} />;
       case 'construction':
         return <ConstructionStage workspaceId={workspace.id} onComplete={handleStageComplete} />;
       case 'expected-return':
         return <ExpectedReturnStage workspaceId={workspace.id} onComplete={handleStageComplete} />;
       case 'optimization':
         return <OptimizationStage workspaceId={workspace.id} onComplete={handleStageComplete} />;
       case 'scenarios':
         return <ScenariosStage workspaceId={workspace.id} onComplete={handleStageComplete} />;
       case 'narrative':
         return <NarrativeStage workspaceId={workspace.id} onComplete={handleStageComplete} />;
       case 'versions':
         return <VersionsStage workspaceId={workspace.id} onComplete={() => navigate('/workspaces')} />;
       default:
         return null;
     }
   };
 
   return (
     <div className="flex h-[calc(100vh-4rem)]">
       {/* Header */}
       <div className="absolute top-4 left-4 z-10">
         <Button variant="ghost" size="sm" onClick={() => navigate('/workspaces')} className="gap-2">
           <ArrowLeft className="h-4 w-4" />
           Back
         </Button>
       </div>
       
       {/* Sidebar */}
       <WorkspaceStageSidebar
         currentStage={currentStage}
         completedStages={completedStages}
         onStageSelect={setCurrentStage}
       />
       
       {/* Main Content */}
       <div className="flex-1 overflow-auto">
         <div className="border-b border-border p-4 bg-card">
           <h1 className="text-xl font-bold">{workspace.name}</h1>
           {workspace.client_name && (
             <p className="text-sm text-muted-foreground">{workspace.client_name}</p>
           )}
         </div>
         {renderStage()}
       </div>
     </div>
   );
 }