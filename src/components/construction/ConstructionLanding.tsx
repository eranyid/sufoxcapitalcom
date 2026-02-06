import { Layers, BarChart3, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConstructionMode = 'analysis' | 'system';

interface ConstructionLandingProps {
  onSelect: (mode: ConstructionMode) => void;
}

export function ConstructionLanding({ onSelect }: ConstructionLandingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
          <div className="relative p-4 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl">
            <Layers className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Construction</h1>
        <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto">
          TARGET ALLOCATION → EXPECTED RETURN → ALLOCATION BUILDER
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {/* Analysis Mode */}
        <button
          onClick={() => onSelect('analysis')}
          className={cn(
            "group relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
            "hover:border-primary/40 hover:bg-card/80 transition-all duration-300",
            "text-left flex flex-col gap-4 cursor-pointer"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Build for Analysis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Build and analyze a target allocation without saving to the investment policy. Ideal for scenario testing and research.
            </p>
          </div>
          <div className="relative mt-auto">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              Explore · Test · Compare
            </span>
          </div>
        </button>

        {/* System Mode */}
        <button
          onClick={() => onSelect('system')}
          className={cn(
            "group relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
            "hover:border-accent/40 hover:bg-card/80 transition-all duration-300",
            "text-left flex flex-col gap-4 cursor-pointer"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Build for Policy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Build a target allocation and save it directly to your investment policy as the official benchmark.
            </p>
          </div>
          <div className="relative mt-auto">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              Define · Lock · Deploy
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
