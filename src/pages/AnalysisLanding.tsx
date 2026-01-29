import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Building2, 
  Landmark, 
  Gem, 
  Coins, 
  BarChart3,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetClassCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  path: string;
}

const ASSET_CLASSES: AssetClassCard[] = [
  {
    id: 'equities',
    title: 'Public Equities',
    description: 'Stocks, ETFs, and publicly traded securities',
    icon: <TrendingUp className="w-8 h-8" />,
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    accentColor: 'text-emerald-400 group-hover:text-emerald-300',
    path: '/analysis/equities',
  },
  {
    id: 'fixed_income',
    title: 'Fixed Income',
    description: 'Bonds, treasuries, and credit instruments',
    icon: <Landmark className="w-8 h-8" />,
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    accentColor: 'text-blue-400 group-hover:text-blue-300',
    path: '/analysis/fixed-income',
  },
  {
    id: 'private_equity',
    title: 'Private Equity',
    description: 'Venture capital, buyouts, and growth equity',
    icon: <Building2 className="w-8 h-8" />,
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    accentColor: 'text-purple-400 group-hover:text-purple-300',
    path: '/analysis/private-equity',
  },
  {
    id: 'real_estate',
    title: 'Real Estate',
    description: 'Commercial, residential, and REITs',
    icon: <Building2 className="w-8 h-8" />,
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    accentColor: 'text-amber-400 group-hover:text-amber-300',
    path: '/analysis/real-estate',
  },
  {
    id: 'alternatives',
    title: 'Alternatives',
    description: 'Hedge funds, commodities, and crypto',
    icon: <Gem className="w-8 h-8" />,
    gradient: 'from-pink-500/20 via-pink-500/5 to-transparent',
    accentColor: 'text-pink-400 group-hover:text-pink-300',
    path: '/analysis/alternatives',
  },
  {
    id: 'cash',
    title: 'Cash & Equivalents',
    description: 'Money markets, deposits, and short-term',
    icon: <Coins className="w-8 h-8" />,
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    accentColor: 'text-cyan-400 group-hover:text-cyan-300',
    path: '/analysis/cash',
  },
];

export default function AnalysisLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 blur-3xl -z-10" />
        
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            <div className="relative p-3 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analysis Hub</h1>
            <p className="text-muted-foreground mt-1">
              Track opportunities across all asset classes
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-6 mt-6 py-4 px-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Quick Actions:</span>
          </div>
          <button
            onClick={() => navigate('/analysis/all')}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View All Companies
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Asset Class Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {ASSET_CLASSES.map((assetClass) => (
          <button
            key={assetClass.id}
            onClick={() => navigate(assetClass.path)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm",
              "p-6 text-left transition-all duration-300",
              "hover:border-border hover:bg-card hover:shadow-2xl hover:shadow-black/20",
              "hover:-translate-y-1 hover:scale-[1.02]",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          >
            {/* Gradient Background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              assetClass.gradient
            )} />
            
            {/* Animated Border Glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className={cn(
                "mb-4 transition-all duration-300",
                assetClass.accentColor
              )}>
                {assetClass.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold mb-2 transition-colors group-hover:text-foreground">
                {assetClass.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                {assetClass.description}
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                <span>Explore</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Corner Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute top-4 right-4">
                {assetClass.icon}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => navigate('/analysis/all')}
          className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border border-primary/30 rounded-xl transition-all duration-300"
        >
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-medium">View Complete Analysis Board</span>
          <ArrowRight className="w-4 h-4 text-primary transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
