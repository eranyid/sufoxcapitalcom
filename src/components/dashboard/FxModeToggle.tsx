import { useFxMode } from '@/context/FxModeContext';
import { cn } from '@/lib/utils';

interface FxModeToggleProps {
  className?: string;
}

export function FxModeToggle({ className }: FxModeToggleProps) {
  const { fxMode, setFxMode } = useFxMode();

  const handleRealClick = () => {
    setFxMode('real');
  };

  const handleNominalClick = () => {
    setFxMode('nominal');
  };

  return (
    <div className={cn("flex items-center gap-0.5 p-1 bg-muted/50 border border-border rounded-full", className)}>
      <button
        type="button"
        onClick={handleRealClick}
        className={cn(
          // Mobile-first: larger touch targets (min 44px height)
          "min-h-[44px] px-4 sm:min-h-0 sm:px-3 sm:py-1.5",
          "text-xs sm:text-[10px] font-mono uppercase tracking-wider rounded-full transition-colors",
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
        onClick={handleNominalClick}
        className={cn(
          // Mobile-first: larger touch targets (min 44px height)
          "min-h-[44px] px-4 sm:min-h-0 sm:px-3 sm:py-1.5",
          "text-xs sm:text-[10px] font-mono uppercase tracking-wider rounded-full transition-colors",
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
