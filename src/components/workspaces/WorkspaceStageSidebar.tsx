 import { cn } from '@/lib/utils';
 import { Check, ChevronRight } from 'lucide-react';
 import { WORKSPACE_STAGES, WorkspaceStage } from '@/types/workspaces';
 
 interface WorkspaceStageSidebarProps {
   currentStage: WorkspaceStage;
   completedStages: WorkspaceStage[];
   onStageSelect: (stage: WorkspaceStage) => void;
 }
 
 export function WorkspaceStageSidebar({ 
   currentStage, 
   completedStages, 
   onStageSelect 
 }: WorkspaceStageSidebarProps) {
   return (
     <div className="w-64 border-r border-border bg-sidebar p-4 space-y-1">
       <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
         Pipeline Stages
       </h3>
       {WORKSPACE_STAGES.map((stage) => {
         const isCompleted = completedStages.includes(stage.id);
         const isCurrent = currentStage === stage.id;
         
         return (
           <button
             key={stage.id}
             onClick={() => onStageSelect(stage.id)}
             className={cn(
               "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
               isCurrent 
                 ? "bg-primary/15 text-primary border border-primary/30" 
                 : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
               isCompleted && !isCurrent && "text-foreground"
             )}
           >
             <div className={cn(
               "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
               isCompleted && !isCurrent 
                 ? "bg-green-500/20 text-green-400" 
                 : isCurrent 
                   ? "bg-primary text-primary-foreground" 
                   : "bg-muted text-muted-foreground"
             )}>
               {isCompleted && !isCurrent ? (
                 <Check className="h-3.5 w-3.5" />
               ) : (
                 WORKSPACE_STAGES.findIndex(s => s.id === stage.id) + 1
               )}
             </div>
             <div className="flex-1 min-w-0">
               <div className="font-medium text-sm truncate">{stage.label}</div>
               <div className="text-xs text-muted-foreground truncate">{stage.description}</div>
             </div>
             {isCurrent && (
               <ChevronRight className="h-4 w-4 text-primary shrink-0" />
             )}
           </button>
         );
       })}
     </div>
   );
 }