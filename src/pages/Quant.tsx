import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { QuantIcon } from "@/components/icons/QuantIcon";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Header with breadcrumbs
  const renderHeader = () => (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => navigate('/quant')}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <QuantIcon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Quant</h1>
      </button>

      {/* Data button in header */}
      <Button
        variant={isData ? "secondary" : "ghost"}
        size="sm"
        className="ml-2 gap-1.5"
        onClick={() => navigate('/quant/data')}
      >
        <Database className="h-4 w-4" />
        Data
      </Button>

      {/* Breadcrumb segments for child routes */}
      {isData && (
        <>
          <span className="text-muted-foreground text-2xl font-light">/</span>
          <span className="text-2xl font-semibold text-muted-foreground">Data</span>
        </>
      )}
      {analyticsChild && (
        <>
          <span className="text-muted-foreground text-2xl font-light">/</span>
          <button
            onClick={() => navigate('/quant')}
            className="text-2xl font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Analytics
          </button>
          <span className="text-muted-foreground text-2xl font-light">/</span>
          <span className="text-2xl font-semibold text-muted-foreground">
            {analyticsSubLabels[analyticsChild] || analyticsChild}
          </span>
        </>
      )}
    </div>
  );

  // At /quant → render analytics landing directly
  if (isLanding) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {renderHeader()}
        <Suspense fallback={<DashboardLoadingSkeleton />}>
          <QuantAnalyticsLanding />
        </Suspense>
      </div>
    );
  }

  // At /quant/analytics → redirect to /quant (avoid duplicate)
  if (isAnalyticsLanding) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {renderHeader()}
        <Suspense fallback={<DashboardLoadingSkeleton />}>
          <QuantAnalyticsLanding />
        </Suspense>
      </div>
    );
  }

  // All other child routes (data, analytics/*)
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {renderHeader()}
      <Outlet />
    </div>
  );
}
