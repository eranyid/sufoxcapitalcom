import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  ArrowRight, 
  Sparkles,
  Layers,
  Gem,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConstructionWizard } from '@/components/construction/ConstructionWizard';

type ActiveWizard = 'selection' | 'target';

export default function Construction() {
  const navigate = useNavigate();
  const [activeWizard, setActiveWizard] = useState<ActiveWizard>('selection');

  if (activeWizard === 'target') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveWizard('selection')} className="gap-2">
          ← Back to Selection
        </Button>
        <ConstructionWizard />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 blur-3xl -z-10" />
        
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            <div className="relative p-3 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl">
              <Layers className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio Construction</h1>
            <p className="text-muted-foreground mt-1">
              Design your strategic allocation framework
            </p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-6 mt-6 py-4 px-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Quick Actions:</span>
          </div>
          <button
            onClick={() => navigate('/construction/allocation')}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <Gem className="w-3 h-3" />
            Allocation Builder
            <ArrowRight className="w-3 h-3" />
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => navigate('/policy')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View Investment Policy
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Single Target Allocation Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <button
          onClick={() => setActiveWizard('target')}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm",
            "p-8 text-left transition-all duration-500",
            "hover:border-border hover:bg-card hover:shadow-2xl",
            "hover:-translate-y-2 hover:scale-[1.02]",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            "group-hover:shadow-emerald-500/20"
          )}
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700",
            "from-emerald-500/30 via-emerald-500/10 to-transparent"
          )} />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-emerald-400" />
              <div className="relative transition-all duration-300 transform group-hover:scale-110 text-emerald-400">
                <Target className="w-10 h-10" />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-2xl font-bold mb-1 transition-colors group-hover:text-foreground">
                Target Allocation
              </h3>
              <p className="text-sm font-medium text-emerald-400">
                Direct Builder
              </p>
            </div>

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Manually configure your target allocation by asset class, geography, and sector with full control.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {['Asset Weights', 'Geography Mix', 'Sector Tilt', 'Rebalance Rules'].map((feature) => (
                <div
                  key={feature}
                  className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground border border-border/30 group-hover:border-border/50 transition-colors"
                >
                  {feature}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Start Configuration
              </span>
              <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors text-emerald-400">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
            <div className="w-48 h-48">
              <Target className="w-10 h-10" />
            </div>
          </div>
        </button>
      </div>

      {/* Footer CTA */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => navigate('/construction/allocation')}
          className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border border-primary/30 rounded-xl transition-all duration-300"
        >
          <Layers className="w-5 h-5 text-primary" />
          <span className="font-medium">Open Allocation Builder</span>
          <ArrowRight className="w-4 h-4 text-primary transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
