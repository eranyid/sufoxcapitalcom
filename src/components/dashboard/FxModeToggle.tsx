import { useFxMode } from '@/context/FxModeContext';
import { cn } from '@/lib/utils';

interface FxModeToggleProps {
  className?: string;
}

export function FxModeToggle({ className }: FxModeToggleProps) {
  const { fxMode, setFxMode } = useFxMode();

  return (
    <div className={cn("flex items-center gap-1 p-0.5 bg-muted/50 border border-border rounded", className)}>
      <button
        onClick={() => setFxMode('real')}
        className={cn(
          "px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-colors",
          fxMode === 'real' 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Real
      </button>
      <button
        onClick={() => setFxMode('nominal')}
        className={cn(
          "px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-colors",
          fxMode === 'nominal' 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Nominal
      </button>
    </div>
  );
}
