import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { AllocationIcon } from '@/components/icons/AllocationIcon';
import { RebalanceIcon } from '@/components/icons/RebalanceIcon';
import { LabIcon } from '@/components/icons/LabIcon';
import { ChartsIcon } from '@/components/icons/ChartsIcon';
import { ResearchIcon } from '@/components/icons/ResearchIcon';
import { ScenariosIcon } from '@/components/icons/ScenariosIcon';
import { cn } from '@/lib/utils';

interface LabModule {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  glowColor: string;
  onClick: () => void;
}

interface LabLandingProps {
  onSelectMode: (mode: 'pipeline' | 'chart' | 'research' | 'rebalance') => void;
}

export function LabLanding({ onSelectMode }: LabLandingProps) {
  const navigate = useNavigate();

  const modules: LabModule[] = [
    {
      id: 'pipeline',
      label: 'Pipeline',
      description: 'Node-based analytics engine. Chain data sources, transforms, and outputs.',
      icon: LabIcon,
      accent: 'from-emerald-500/20 to-emerald-500/5',
      glowColor: 'group-hover:shadow-emerald-500/20',
      onClick: () => onSelectMode('pipeline'),
    },
    {
      id: 'chart',
      label: 'Chart Builder',
      description: 'Custom visualizations with full control over axes, series, and styling.',
      icon: ChartsIcon,
      accent: 'from-sky-500/20 to-sky-500/5',
      glowColor: 'group-hover:shadow-sky-500/20',
      onClick: () => onSelectMode('chart'),
    },
    {
      id: 'allocation',
      label: 'Allocation',
      description: 'Interactive weight builder with drift tracking and exposure analytics.',
      icon: AllocationIcon,
      accent: 'from-violet-500/20 to-violet-500/5',
      glowColor: 'group-hover:shadow-violet-500/20',
      onClick: () => navigate('/construction/allocation'),
    },
    {
      id: 'research',
      label: 'Deep Research',
      description: 'Monte Carlo, Efficient Frontier, and Black-Litterman optimization.',
      icon: ResearchIcon,
      accent: 'from-amber-500/20 to-amber-500/5',
      glowColor: 'group-hover:shadow-amber-500/20',
      onClick: () => onSelectMode('research'),
    },
    {
      id: 'rebalance',
      label: 'Rebalance',
      description: 'Tax-aware trade optimizer with lot-level tracking.',
      icon: RebalanceIcon,
      accent: 'from-rose-500/20 to-rose-500/5',
      glowColor: 'group-hover:shadow-rose-500/20',
      onClick: () => onSelectMode('rebalance'),
    },
    {
      id: 'scenarios',
      label: 'Scenarios',
      description: 'Stress testing, crash simulations, and custom scenario modeling.',
      icon: ScenariosIcon,
      accent: 'from-cyan-500/20 to-cyan-500/5',
      glowColor: 'group-hover:shadow-cyan-500/20',
      onClick: () => navigate('/scenarios'),
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center md:justify-center p-4 sm:p-8 overflow-auto pt-6">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Zap className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Quantitative Toolkit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Analytics Lab
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Advanced tools for portfolio construction, risk modeling, and quantitative research
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl w-full">
        {modules.map((mod, index) => (
          <button
            key={mod.id}
            onClick={mod.onClick}
            className={cn(
              "group relative flex flex-col text-left p-5 sm:p-6 rounded-xl",
              "border border-border/60 bg-card/80 backdrop-blur-sm",
              "hover:border-primary/40 transition-all duration-300",
              "hover:shadow-lg",
              mod.glowColor,
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
          >
            {/* Gradient accent top */}
            <div className={cn(
              "absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              mod.accent
            )} />

            {/* Icon */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-4",
              "bg-gradient-to-br",
              mod.accent,
              "border border-border/40"
            )}>
              <mod.icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-foreground tracking-tight">{mod.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300 opacity-0 group-hover:opacity-100" />
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {mod.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="mt-8 sm:mt-10 text-center animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
        <p className="text-[9px] text-muted-foreground/50 font-mono uppercase tracking-widest">
          Select a module to begin
        </p>
      </div>
    </div>
  );
}
