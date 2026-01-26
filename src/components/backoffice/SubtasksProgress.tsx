import { Progress } from '@/components/ui/progress';

interface SubtasksProgressProps {
  completed: number;
  total: number;
}

export function SubtasksProgress({ completed, total }: SubtasksProgressProps) {
  if (total === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const percentage = Math.round((completed / total) * 100);
  
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <Progress 
        value={percentage} 
        className="h-1.5 flex-1 bg-muted"
      />
      <span className={`text-xs font-medium ${
        completed === total ? 'text-emerald-400' : 'text-muted-foreground'
      }`}>
        {completed}/{total}
      </span>
    </div>
  );
}
