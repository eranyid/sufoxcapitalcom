import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, LineChart, Shield, Layers, Grid3X3, Clock, GitBranch } from "lucide-react";

const categories = [
  {
    path: "overview",
    label: "Overview",
    icon: BarChart3,
    description: "Market snapshot — sector heatmap, top/bottom performers, and breadth indicators.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    path: "stock",
    label: "Stock Analysis",
    icon: LineChart,
    description: "Single-symbol deep dive — cumulative returns, rolling metrics, and EWMA volatility.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    path: "risk",
    label: "Risk & Performance",
    icon: Shield,
    description: "Multi-symbol risk metrics — correlation matrix, drawdown analysis, VaR and CVaR.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    path: "factor",
    label: "Factor Analysis",
    icon: Layers,
    description: "Systematic factor decomposition — OLS regressions, factor loadings, and rolling betas.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    path: "cross-sectional",
    label: "Cross-Sectional",
    icon: Grid3X3,
    description: "Relative ranking — momentum scores, quintile analysis, and sector rotation.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    path: "intraday",
    label: "Intraday Patterns",
    icon: Clock,
    description: "Trading window behavior — volatility profile, closing momentum, and MOC pressure.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    path: "pairs",
    label: "Pairs & Spreads",
    icon: GitBranch,
    description: "Statistical arbitrage — cointegration screening, spread z-scores, and signal logs.",
    accent: "from-primary/20 to-primary/5",
  },
];

export default function QuantAnalyticsLanding() {
  const navigate = useNavigate();

  const navigateToCategory = (path: string) => {
    navigate(`/quant/analytics/${path}`);
  };

  return (
    <div className="space-y-8">
      {/* Grid of futuristic cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.path}
              onClick={() => navigateToCategory(cat.path)}
              className="group relative text-left rounded-xl border border-border/40 hover:border-primary/60 
                         bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm
                         transition-all duration-300 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.3)]
                         hover:scale-[1.02] p-5 overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Glow line at top */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 
                                group-hover:bg-primary/20 group-hover:border-primary/40 
                                group-hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]
                                transition-all duration-300">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2
                                       group-hover:opacity-100 group-hover:translate-x-0 
                                       transition-all duration-300" />
              </div>

              {/* Label */}
              <h3 className="font-semibold text-sm tracking-wide uppercase text-primary mb-2
                             font-mono">
                {cat.label}
              </h3>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {cat.description}
              </p>

              {/* Bottom glow accent */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary/[0.03] to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center font-mono tracking-wider uppercase">
        Research purposes only · Not investment advice
      </p>
    </div>
  );
}
