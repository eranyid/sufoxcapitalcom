import { Progress } from '@/components/ui/progress';
import { Target, PlayCircle, CheckCircle2 } from 'lucide-react';

interface ProjectProgressPanelProps {
  total: number;
  started: number;
  completed: number;
  percentComplete: number;
}

export function ProjectProgressPanel({
  total,
  started,
  completed,
  percentComplete,
}: ProjectProgressPanelProps) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <h3 className="text-sm font-semibold mb-4 text-foreground">Progress</h3>
      
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-mono font-medium text-foreground">{percentComplete}%</span>
          </div>
          <Progress value={percentComplete} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Target className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-lg font-semibold font-mono">{total}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Scope</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <PlayCircle className="h-4 w-4 mx-auto text-blue-400 mb-1" />
            <div className="text-lg font-semibold font-mono">{started}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Started</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
            <div className="text-lg font-semibold font-mono">{completed}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</div>
          </div>
        </div>
      </div>
    </div>
  );
}
