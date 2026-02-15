import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Zap } from 'lucide-react';
import { Building2, Rocket, CreditCard, Home, Landmark, BarChart3 } from 'lucide-react';
import { AlternativeIcon } from '@/components/icons/AlternativeIcon';
import { cn } from '@/lib/utils';

const assetClasses = [
  {
    id: 'private-equity',
    label: 'Private Equity',
    description: 'Buyouts, growth equity, secondaries. Fund & deal analysis with IRR modeling.',
    icon: Building2,
    accent: 'from-emerald-500/20 to-emerald-500/5',
    glowColor: 'group-hover:shadow-emerald-500/20',
  },
  {
    id: 'venture-capital',
    label: 'Venture Capital',
    description: 'Early-to-late stage VC. Portfolio construction & follow-on strategy.',
    icon: Rocket,
    accent: 'from-sky-500/20 to-sky-500/5',
    glowColor: 'group-hover:shadow-sky-500/20',
  },
  {
    id: 'private-credit',
    label: 'Private Credit',
    description: 'Direct lending, mezzanine & distressed. Yield analysis & covenant monitoring.',
    icon: CreditCard,
    accent: 'from-violet-500/20 to-violet-500/5',
    glowColor: 'group-hover:shadow-violet-500/20',
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    description: 'Core, value-add & opportunistic. NOI tracking, cap rates & leverage.',
    icon: Home,
    accent: 'from-amber-500/20 to-amber-500/5',
    glowColor: 'group-hover:shadow-amber-500/20',
  },
  {
    id: 'real-assets',
    label: 'Infrastructure',
    description: 'Energy, transport & digital infra. Contract analysis & yield modeling.',
    icon: Landmark,
    accent: 'from-rose-500/20 to-rose-500/5',
    glowColor: 'group-hover:shadow-rose-500/20',
  },
  {
    id: 'hedge-funds-alts',
    label: 'Hedge Funds & Alts',
    description: 'Liquid alts, multi-strategy & macro. Risk-adjusted return analysis.',
    icon: BarChart3,
    accent: 'from-cyan-500/20 to-cyan-500/5',
    glowColor: 'group-hover:shadow-cyan-500/20',
  },
];

export default function AlternativeHub() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Alternative Investments | SUFOX Capital</title>
      </Helmet>

      <div className="flex-1 flex flex-col items-center md:justify-center p-4 sm:p-8 overflow-auto pt-6 pb-20 md:pb-0">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <AlternativeIcon size={13} className="text-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Private Markets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Alternative Investments
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Institutional-grade due diligence, structuring & analytics for private markets
          </p>
        </div>

        {/* Asset Class Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl w-full">
          {assetClasses.map((ac, index) => (
            <button
              key={ac.id}
              onClick={() => navigate(`/alternative/${ac.id}`)}
              className={cn(
                "group relative flex flex-col text-left p-5 sm:p-6 rounded-xl",
                "border border-border/60 bg-card/80 backdrop-blur-sm",
                "hover:border-primary/40 transition-all duration-300",
                "hover:shadow-lg",
                ac.glowColor,
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
            >
              {/* Gradient accent top */}
              <div className={cn(
                "absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                ac.accent
              )} />

              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-4",
                "bg-gradient-to-br",
                ac.accent,
                "border border-border/40"
              )}>
                <ac.icon size={20} className="text-foreground group-hover:text-primary transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground tracking-tight">{ac.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300 opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {ac.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-10 text-center animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <p className="text-[9px] text-muted-foreground/50 font-mono uppercase tracking-widest">
            Select an asset class to begin analysis
          </p>
        </div>
      </div>
    </>
  );
}
