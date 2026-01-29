import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NeedsBasedWizard } from '@/components/construction/NeedsBasedWizard';
import { ConstructionWizard } from '@/components/construction/ConstructionWizard';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { useNeedsProfile } from '@/hooks/useNeedsProfile';
import { Activity, Brain, Layers, Target, ArrowLeft, Sparkles, Crosshair } from 'lucide-react';

type ViewMode = 'selection' | 'needs' | 'target';

export default function Construction() {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const { activeTarget, isLoading } = useTargetAllocation();
  const { profile } = useNeedsProfile();

  const handleBack = () => setViewMode('selection');

  // Selection Landing Page
  if (viewMode === 'selection') {
    return (
      <div className="p-4 md:p-5 space-y-4">
        {/* Header */}
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
                Portfolio Construction
                <Activity size={14} className="text-primary animate-pulse" />
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                STRATEGIC ALLOCATION PIPELINE v3.0
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

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Needs Profiling Card */}
          <Card 
            className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
            onClick={() => setViewMode('needs')}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                    <Brain className="text-primary" size={28} />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Needs Profiling</h2>
                    <Sparkles size={14} className="text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    השתמש בשאלון אפיון הצרכים כדי לקבל המלצת מערכת מותאמת אישית לבניית תיק יעד.
                  </p>
                  
                  <div className="flex items-center gap-2 pt-2">
                    {profile ? (
                      <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-500">
                        פרופיל קיים: {profile.profile_type}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-muted-foreground/40">
                        לא הוגדר פרופיל
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">BEHAVIORAL FINANCE LAYER</span>
                  <Button size="sm" variant="ghost" className="text-xs text-primary hover:text-primary">
                    התחל אפיון →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Target Builder Card */}
          <Card 
            className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
            onClick={() => setViewMode('target')}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                    <Crosshair className="text-primary" size={28} />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Target Allocation</h2>
                    <Target size={14} className="text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    בנה תיק יעד ישירות עם הגדרות גיאוגרפיה, סוגי נכסים ו-buckets לפי בחירתך.
                  </p>
                  
                  <div className="flex items-center gap-2 pt-2">
                    {activeTarget ? (
                      <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-500">
                        תיק פעיל: {activeTarget.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-muted-foreground/40">
                        אין תיק יעד פעיל
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">DIRECT ALLOCATION BUILDER</span>
                  <Button size="sm" variant="ghost" className="text-xs text-primary hover:text-primary">
                    בנה תיק יעד →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Needs Profiling View
  if (viewMode === 'needs') {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft size={16} />
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-md animate-pulse" />
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Brain className="text-primary" size={20} />
              </div>
            </div>
            
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Needs-Based Portfolio Design
                <Activity size={14} className="text-primary animate-pulse" />
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                BEHAVIORAL FINANCE LAYER — INVESTMENT NEEDS ASSESSMENT
              </p>
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="absolute top-0 left-0 w-6 h-6">
            <div className="absolute top-0 left-0 w-full h-px bg-primary/50" />
            <div className="absolute top-0 left-0 h-full w-px bg-primary/50" />
          </div>
          <div className="absolute top-0 right-0 w-6 h-6">
            <div className="absolute top-0 right-0 w-full h-px bg-primary/50" />
            <div className="absolute top-0 right-0 h-full w-px bg-primary/50" />
          </div>

          <div className="p-4 md:p-5">
            <NeedsBasedWizard />
          </div>
        </Card>
      </div>
    );
  }

  // Direct Target Builder View
  return (
    <div className="p-4 md:p-5 space-y-4">
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft size={16} />
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-md animate-pulse" />
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
              <Crosshair className="text-primary" size={20} />
            </div>
          </div>
          
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              Target Allocation Builder
              <Activity size={14} className="text-primary animate-pulse" />
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              DIRECT ALLOCATION BUILDER — STRATEGIC PIPELINE
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

      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-full h-px bg-primary/50" />
          <div className="absolute top-0 left-0 h-full w-px bg-primary/50" />
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-full h-px bg-primary/50" />
          <div className="absolute top-0 right-0 h-full w-px bg-primary/50" />
        </div>

        <div className="p-4 md:p-5">
          <ConstructionWizard />
        </div>
      </Card>
    </div>
  );
}
