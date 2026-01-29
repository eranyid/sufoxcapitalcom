import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NeedsBasedWizard } from '@/components/construction/NeedsBasedWizard';
import { ConstructionWizard } from '@/components/construction/ConstructionWizard';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { useNeedsProfile } from '@/hooks/useNeedsProfile';
import { Activity, Brain, Layers, Target, ArrowLeft, Sparkles, Crosshair, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

type ViewMode = 'selection' | 'needs' | 'target';

export default function Construction() {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const { activeTarget, isLoading } = useTargetAllocation();
  const { profile } = useNeedsProfile();

  const handleBack = () => setViewMode('selection');

  // Selection Landing Page
  if (viewMode === 'selection') {
    return (
      <div className="p-4 md:p-6 space-y-6 min-h-[calc(100vh-4rem)]">
        {/* Hero Header */}
        <div className="relative text-center py-8 md:py-12">
          {/* Background glow effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative space-y-4">
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/40 blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center">
                  <Layers className="text-primary" size={32} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Portfolio Construction
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Choose your path to build a personalized investment portfolio
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
              <span className="text-[10px] font-mono text-muted-foreground/60">STRATEGIC ALLOCATION PIPELINE</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          {/* Needs Profiling Card */}
          <Card 
            className="relative overflow-hidden bg-card border-border hover:border-primary/60 transition-all duration-300 cursor-pointer group"
            onClick={() => setViewMode('needs')}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
            
            <CardContent className="p-6 md:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Brain className="text-primary" size={40} />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-lg font-semibold">Needs Profiling</h2>
                  <Sparkles size={16} className="text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A comprehensive needs assessment questionnaire that analyzes your profile and provides smart system recommendations for building a personalized target portfolio.
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary" />
                  <span>Behavioral finance profiling</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary" />
                  <span>Automatic risk profile recommendation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary" />
                  <span>Suggested allocation bands</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center mb-4">
                {profile ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30">
                    <CheckCircle2 size={12} className="mr-1" />
                    Profile: {profile.profile_type}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">
                    <Circle size={12} className="mr-1" />
                    No profile defined
                  </Badge>
                )}
              </div>
              
              {/* CTA */}
              <Button className="w-full group-hover:bg-primary/90" size="lg">
                Start Needs Profiling
                <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Direct Target Builder Card */}
          <Card 
            className="relative overflow-hidden bg-card border-border hover:border-primary/60 transition-all duration-300 cursor-pointer group"
            onClick={() => setViewMode('target')}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
            
            <CardContent className="p-6 md:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Crosshair className="text-primary" size={40} />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-lg font-semibold">Target Allocation</h2>
                  <Target size={16} className="text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Build a target portfolio directly with custom settings for geography, asset classes and buckets based on your preferences.
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary" />
                  <span>Geographic allocation setup</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary" />
                  <span>Asset class breakdown</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary" />
                  <span>Drift tracking vs target</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center mb-4">
                {activeTarget ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30">
                    <CheckCircle2 size={12} className="mr-1" />
                    Active: {activeTarget.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">
                    <Circle size={12} className="mr-1" />
                    No active target
                  </Badge>
                )}
              </div>
              
              {/* CTA */}
              <Button className="w-full group-hover:bg-primary/90" size="lg">
                Build Target Portfolio
                <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center pt-4">
          <p className="text-[10px] font-mono text-muted-foreground/50">
            SUFOX CAPITAL • STRATEGIC ALLOCATION PIPELINE v3.0
          </p>
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
