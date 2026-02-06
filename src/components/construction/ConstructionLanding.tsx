import { Layers, BarChart3, Shield, FlaskConical, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConstructionMode = 'analysis' | 'system';

interface ConstructionLandingProps {
  onSelect: (mode: ConstructionMode) => void;
}

export function ConstructionLanding({ onSelect }: ConstructionLandingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full animate-pulse" />
          <div className="relative p-4 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl backdrop-blur-sm">
            <Layers className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Construction</h1>
        <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto tracking-wider">
          TARGET ALLOCATION → EXPECTED RETURN → ALLOCATION BUILDER
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Analysis Mode */}
        <button
          onClick={() => onSelect('analysis')}
          className={cn(
            "group relative p-6 rounded-xl border border-primary/20 bg-card/60 backdrop-blur-md",
            "hover:border-primary/50 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] transition-all duration-500",
            "text-left flex flex-col gap-4 cursor-pointer overflow-hidden"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center mb-3 group-hover:bg-primary/25 group-hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)] transition-all duration-300">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1.5">Sandbox Mode</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Experiment freely — build and test allocations without saving. Nothing persists.
            </p>
          </div>
          <div className="relative mt-auto pt-3 border-t border-border/30">
            <span className="text-[10px] font-mono text-primary/50 uppercase tracking-[0.2em]">
              Explore · Test · Compare
            </span>
          </div>
        </button>

        {/* System Mode */}
        <button
          onClick={() => onSelect('system')}
          className={cn(
            "group relative p-6 rounded-xl border border-accent/20 bg-card/60 backdrop-blur-md",
            "hover:border-accent/50 hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)] transition-all duration-500",
            "text-left flex flex-col gap-4 cursor-pointer overflow-hidden"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center mb-3 group-hover:bg-accent/25 group-hover:shadow-[0_0_15px_-3px_hsl(var(--accent)/0.4)] transition-all duration-300">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-1.5">Build for Policy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Build a target allocation and save it directly to your investment policy as the official benchmark.
            </p>
          </div>
          <div className="relative mt-auto pt-3 border-t border-border/30">
            <span className="text-[10px] font-mono text-accent/50 uppercase tracking-[0.2em]">
              Define · Lock · Deploy
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}