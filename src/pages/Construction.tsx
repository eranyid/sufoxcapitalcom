import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeedsBasedWizard } from '@/components/construction/NeedsBasedWizard';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { Target, Clock, Cpu, Activity, Brain, Layers } from 'lucide-react';
import { format } from 'date-fns';

export default function Construction() {
  const { activeTarget, isLoading } = useTargetAllocation();

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Compact Futuristic Header */}
      <div className="relative">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-md animate-pulse" />
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Layers className="text-primary" size={20} />
              </div>
            </div>
            
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Needs-Based Portfolio Design
                <Activity size={14} className="text-primary animate-pulse" />
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                STRATEGIC ALLOCATION PIPELINE v3.0 — BEHAVIORAL FINANCE LAYER
              </p>
            </div>
          </div>

          {activeTarget && !isLoading && (
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardContent className="py-2 px-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-mono font-medium">{activeTarget.name}</span>
                </div>
                <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">
                  {activeTarget.objective.toUpperCase().replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Wizard Container */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        {/* Simplified corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-full h-px bg-primary/50" />
          <div className="absolute top-0 left-0 h-full w-px bg-primary/50" />
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-full h-px bg-primary/50" />
          <div className="absolute top-0 right-0 h-full w-px bg-primary/50" />
        </div>

        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={14} className="text-primary" />
            <h2 className="text-xs font-medium font-mono tracking-wide">INVESTMENT NEEDS ASSESSMENT</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-3" />
          </div>
          
          <NeedsBasedWizard />
        </div>
      </Card>
    </div>
  );
}