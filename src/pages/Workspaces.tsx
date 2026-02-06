import { useState } from 'react';
import { useClientWorkspaces } from '@/hooks/useClientWorkspaces';
import { WorkspaceCard } from '@/components/workspaces/WorkspaceCard';
import { CreateWorkspaceDialog } from '@/components/workspaces/CreateWorkspaceDialog';
import { DashboardLoadingSkeleton } from '@/components/LoadingSkeleton';
import { Briefcase, Brain, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NeedsBasedWizard } from '@/components/construction/NeedsBasedWizard';
import { FamilyOfficeWizard } from '@/components/construction/FamilyOfficeWizard';
import { cn } from '@/lib/utils';

type ActiveView = 'main' | 'needs' | 'family';

interface ProfilingCard {
  id: ActiveView;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  borderGlow: string;
  accentColor: string;
}

const PROFILING_CARDS: ProfilingCard[] = [
  {
    id: 'needs',
    title: 'Needs Profiling',
    subtitle: 'Behavioral Assessment',
    description: 'Define your investment profile through guided questions about goals, risk tolerance, and constraints.',
    features: ['Risk Assessment', 'Goal Setting', 'Time Horizon', 'Constraints'],
    icon: <Brain className="w-10 h-10" />,
    gradient: 'from-blue-500/30 via-blue-500/10 to-transparent',
    borderGlow: 'group-hover:shadow-blue-500/20',
    accentColor: 'text-blue-400',
  },
  {
    id: 'family',
    title: 'Family Office',
    subtitle: 'Ultra HNW Deep Profiling',
    description: 'Comprehensive wealth structuring for ₪1B+ portfolios with governance, succession, and multi-generational planning.',
    features: ['Governance', 'Succession', 'Tax Optimization', 'Illiquidity Budget'],
    icon: <Building2 className="w-10 h-10" />,
    gradient: 'from-amber-500/30 via-amber-500/10 to-transparent',
    borderGlow: 'group-hover:shadow-amber-500/20',
    accentColor: 'text-amber-400',
  },
];

export default function Workspaces() {
  const { workspaces, isLoading, createWorkspace, deleteWorkspace } = useClientWorkspaces();
  const [activeView, setActiveView] = useState<ActiveView>('main');

  if (activeView === 'needs') {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveView('main')} className="gap-2">
          ← Back to Workspaces
        </Button>
        <NeedsBasedWizard />
      </div>
    );
  }

  if (activeView === 'family') {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveView('main')} className="gap-2">
          ← Back to Workspaces
        </Button>
        <FamilyOfficeWizard />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Workspaces</h1>
          <p className="text-muted-foreground mt-1">
            Portfolio Manufacturing Platform — 8-stage pipeline for institutional portfolio construction
          </p>
        </div>
        <CreateWorkspaceDialog 
          onSubmit={(data) => createWorkspace.mutate(data)}
          isLoading={createWorkspace.isPending}
        />
      </div>

      {/* Profiling Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROFILING_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveView(card.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm",
              "p-8 text-left transition-all duration-500",
              "hover:border-border hover:bg-card hover:shadow-2xl",
              "hover:-translate-y-2 hover:scale-[1.02]",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              card.borderGlow
            )}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700",
              card.gradient
            )} />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="relative mb-6">
                <div className={cn(
                  "absolute inset-0 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500",
                  card.accentColor.replace('text-', 'bg-')
                )} />
                <div className={cn(
                  "relative transition-all duration-300 transform group-hover:scale-110",
                  card.accentColor
                )}>
                  {card.icon}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-1 transition-colors group-hover:text-foreground">
                  {card.title}
                </h3>
                <p className={cn("text-sm font-medium", card.accentColor)}>
                  {card.subtitle}
                </p>
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {card.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {card.features.map((feature) => (
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
                <div className={cn(
                  "p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors",
                  card.accentColor
                )}>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
              <div className="w-48 h-48">
                {card.icon}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Workspaces List */}
      {isLoading ? (
        <DashboardLoadingSkeleton />
      ) : workspaces.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No workspaces yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first client workspace to begin building portfolios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onDelete={(id) => deleteWorkspace.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
