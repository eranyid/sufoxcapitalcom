import { useFxMode } from '@/context/FxModeContext';
import { cn } from '@/lib/utils';

interface FxModeToggleProps {
  className?: string;
}

export function FxModeToggle({ className }: FxModeToggleProps) {
  const { fxMode, setFxMode } = useFxMode();

  return (
    <div className={cn("flex items-center gap-0.5 p-0.5 bg-muted/50 border border-border rounded-full", className)}>
      <button
        type="button"
        onClick={() => setFxMode('real')}
        className={cn(
          "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-full transition-colors",
          "touch-manipulation select-none",
          fxMode === 'real' 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground active:bg-muted/80"
        )}
      >
        Real
      </button>
      <button
        type="button"
        onClick={() => setFxMode('nominal')}
        className={cn(
          "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-full transition-colors",
          "touch-manipulation select-none",
          fxMode === 'nominal' 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground active:bg-muted/80"
        )}
      >
        Nominal
      </button>
    </div>
  );
}
