import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { QuantIcon } from "@/components/icons/QuantIcon";
import { Database } from "lucide-react";
import { lazy, Suspense } from "react";
import { DashboardLoadingSkeleton } from "@/components/LoadingSkeleton";

const QuantAnalyticsLanding = lazy(() => import("./QuantAnalyticsLanding"));

const analyticsSubLabels: Record<string, string> = {
  'overview': 'Overview',
  'stock': 'Stock Analysis',
  'risk': 'Risk & Performance',
  'factor': 'Factor Analysis',
  'cross-sectional': 'Cross-Sectional',
  'intraday': 'Intraday Patterns',
  'pairs': 'Pairs & Spreads',
};

export default function Quant() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/quant';
  const isData = location.pathname === '/quant/data';
  const analyticsChild = location.pathname.match(/\/quant\/analytics\/(.+)/)?.[1]?.split('?')[0];
  const isAnalyticsLanding = location.pathname === '/quant/analytics';

  const renderHeader = () => (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Logo + title */}
      <button
        onClick={() => navigate('/quant')}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
      >
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 
                        group-hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all">
          <QuantIcon className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight font-mono">QUANT</h1>
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-border/60" />

      {/* Data nav button */}
      <button
        onClick={() => navigate('/quant/data')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono tracking-wide
                     transition-all duration-200 border
                     ${isData
                       ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_10px_-4px_hsl(var(--primary)/0.3)]'
                       : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30'
                     }`}
      >
        <Database className="h-3.5 w-3.5" />
        DATA
      </button>

      {/* Breadcrumb segments */}
      {isData && (
        <>
          <span className="text-muted-foreground/40 text-lg font-light">/</span>
          <span className="text-sm font-mono text-muted-foreground tracking-wide">DATA MODULE</span>
        </>
      )}
      {analyticsChild && (
        <>
          <span className="text-muted-foreground/40 text-lg font-light">/</span>
          <button
            onClick={() => navigate('/quant')}
            className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            ANALYTICS
          </button>
          <span className="text-muted-foreground/40 text-lg font-light">/</span>
          <span className="text-sm font-mono text-primary/80 tracking-wide">
            {(analyticsSubLabels[analyticsChild] || analyticsChild).toUpperCase()}
          </span>
        </>
      )}
    </div>
  );

  const content = isLanding || isAnalyticsLanding ? (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <QuantAnalyticsLanding />
    </Suspense>
  ) : (
    <Outlet />
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {renderHeader()}
      {content}
    </div>
  );
}
