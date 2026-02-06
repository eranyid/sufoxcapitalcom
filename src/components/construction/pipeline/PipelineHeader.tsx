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
  { id: 1 as PipelinePhase, title: 'Target Allocation', icon: Target, subtitle: 'Define Structure' },
  { id: 2 as PipelinePhase, title: 'Expected Return', icon: FlaskConical, subtitle: 'Scenario Analysis' },
  { id: 3 as PipelinePhase, title: 'Allocation Builder', icon: Layers, subtitle: 'Position Weights' },
  { id: 4 as PipelinePhase, title: 'Summary & Export', icon: FileCheck, subtitle: 'Final Review' },
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

  const progress = (
    (phase1Complete ? 25 : 0) +
    (phase2Complete ? 25 : 0) +
    (phase3Complete ? 25 : 0) +
    (currentPhase === 4 ? 25 : 0)
  );

  return (
    <div className="space-y-4">
      {/* Phase Steps */}
      <div className="flex items-center justify-between">
        {PHASES.map((phase, index) => {
          const Icon = phase.icon;
          const isActive = currentPhase === phase.id;
          const isComplete = completionMap[phase.id];
          const isClickable = canNavigate(phase.id);

          return (
            <div key={phase.id} className="flex items-center flex-1">
              <button
                onClick={() => isClickable && onPhaseClick(phase.id)}
                disabled={!isClickable}
                className={cn(
                  "group flex items-center gap-3 transition-all duration-300",
                  isActive && "scale-105",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/40 blur-lg animate-pulse rounded-xl" />
                  )}
                  <div className={cn(
                    "relative w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                    isActive && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30",
                    isComplete && !isActive && "bg-primary/20 text-primary border-primary/40",
                    !isActive && !isComplete && "bg-muted/30 border-border/50 text-muted-foreground/50"
                  )}>
                    {isComplete && !isActive ? (
                      <Check size={16} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className={cn(
                    "text-xs font-semibold transition-colors",
                    isActive ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground/50"
                  )}>
                    {phase.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 font-mono">
                    {phase.subtitle}
                  </div>
                </div>
              </button>

              {/* Connector */}
              {index < PHASES.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-3 transition-colors hidden sm:block",
                  completionMap[phase.id] ? "bg-primary/50" : "bg-border/30"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative h-1 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
          style={{ left: `${Math.max(0, progress - 5)}%` }}
        />
      </div>
    </div>
  );
}
