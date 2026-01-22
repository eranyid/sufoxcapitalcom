import { useFxMode } from '@/context/FxModeContext';
import { cn } from '@/lib/utils';

interface FxModeToggleProps {
  className?: string;
}

export function FxModeToggle({ className }: FxModeToggleProps) {
  const { fxMode, setFxMode } = useFxMode();

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted/50 border border-border rounded-full", className)}>
      <button
        onClick={() => setFxMode('real')}
        className={cn(
          "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-full transition-colors",
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
          "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-full transition-colors",
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
