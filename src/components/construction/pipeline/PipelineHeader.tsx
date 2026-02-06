import { cn } from '@/lib/utils';
import { Check, Target, FlaskConical, Layers, FileCheck } from 'lucide-react';
import type { PipelinePhase } from '@/types/constructionPipeline';

interface PipelineHeaderProps {
  currentPhase: PipelinePhase;
  onPhaseClick: (phase: PipelinePhase) => void;
  phase1Complete: boolean;
  phase2Complete: boolean;
  phase3Complete: boolean;
}

const PHASES = [
  { id: 1 as PipelinePhase, title: 'Target Allocation', subtitle: 'Define Structure', icon: Target },
  { id: 2 as PipelinePhase, title: 'Expected Return', subtitle: 'Scenario Analysis', icon: FlaskConical },
  { id: 3 as PipelinePhase, title: 'Allocation Builder', subtitle: 'Position Weights', icon: Layers },
  { id: 4 as PipelinePhase, title: 'Summary & Export', subtitle: 'Final Review', icon: FileCheck },
];

export function PipelineHeader({ currentPhase, onPhaseClick, phase1Complete, phase2Complete, phase3Complete }: PipelineHeaderProps) {
  const completionMap: Record<number, boolean> = {
    1: phase1Complete,
    2: phase2Complete,
    3: phase3Complete,
    4: false,
  };

  const canNavigate = (phaseId: PipelinePhase): boolean => {
    if (phaseId === 1) return true;
    if (phaseId === 2) return phase1Complete;
    if (phaseId === 3) return phase1Complete && phase2Complete;
    if (phaseId === 4) return phase1Complete && phase2Complete && phase3Complete;
    return false;
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 p-1 rounded-xl bg-muted/15 border border-border/30 overflow-x-auto">
      {PHASES.map((phase, index) => {
        const Icon = phase.icon;
        const isActive = currentPhase === phase.id;
        const isComplete = completionMap[phase.id];
        const isClickable = canNavigate(phase.id);

        return (
          <button
            key={phase.id}
            onClick={() => isClickable && onPhaseClick(phase.id)}
            disabled={!isClickable}
            className={cn(
              "flex-1 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-200 min-w-0",
              isActive && "bg-card border border-primary/30 shadow-sm",
              !isActive && isClickable && "hover:bg-muted/20 cursor-pointer",
              !isClickable && "opacity-30 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
              isActive && "bg-primary/20 text-primary",
              isComplete && !isActive && "bg-primary/10 text-primary",
              !isActive && !isComplete && "bg-muted/30 text-muted-foreground/50"
            )}>
              {isComplete && !isActive ? <Check size={12} /> : <Icon size={12} />}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <div className={cn(
                "text-[11px] font-medium truncate",
                isActive ? "text-foreground" : "text-muted-foreground/70"
              )}>
                {phase.title}
              </div>
              <div className="text-[9px] text-muted-foreground/50 font-mono truncate">
                {phase.subtitle}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
