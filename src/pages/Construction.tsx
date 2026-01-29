import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConstructionWizard } from '@/components/construction/ConstructionWizard';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { Target, Clock, Cpu, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function Construction() {
  const { activeTarget, isLoading } = useTargetAllocation();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Futuristic Header */}
      <div className="relative">
        {/* Glow effect background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 blur-xl opacity-50" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Animated icon container */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-md animate-pulse" />
              <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Cpu className="text-primary" size={24} />
              </div>
            </div>
            
            <div>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                Portfolio Construction
                <Activity size={16} className="text-primary animate-pulse" />
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                STRATEGIC ALLOCATION PIPELINE v2.0
              </p>
            </div>
          </div>

          {activeTarget && !isLoading && (
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Active:</span>
                  <span className="text-sm font-mono font-medium">{activeTarget.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  {activeTarget.objective.toUpperCase().replace('_', ' ')}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <Clock size={10} />
                  {format(new Date(activeTarget.updated_at), 'yyyy-MM-dd HH:mm')}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Wizard Container */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8">
          <div className="absolute top-0 left-0 w-full h-px bg-primary/50" />
          <div className="absolute top-0 left-0 h-full w-px bg-primary/50" />
        </div>
        <div className="absolute top-0 right-0 w-8 h-8">
          <div className="absolute top-0 right-0 w-full h-px bg-primary/50" />
          <div className="absolute top-0 right-0 h-full w-px bg-primary/50" />
        </div>
        <div className="absolute bottom-0 left-0 w-8 h-8">
          <div className="absolute bottom-0 left-0 w-full h-px bg-primary/50" />
          <div className="absolute bottom-0 left-0 h-full w-px bg-primary/50" />
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8">
          <div className="absolute bottom-0 right-0 w-full h-px bg-primary/50" />
          <div className="absolute bottom-0 right-0 h-full w-px bg-primary/50" />
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target size={16} className="text-primary" />
            <h2 className="text-sm font-medium tracking-wide">TARGET ALLOCATION WIZARD</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-4" />
          </div>
          
          <ConstructionWizard />
        </div>
      </Card>
    </div>
  );
}