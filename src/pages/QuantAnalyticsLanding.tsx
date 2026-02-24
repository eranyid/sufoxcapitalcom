import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, LineChart, Shield, Layers, Grid3X3, Clock, GitBranch } from "lucide-react";
import { TimePeriodSelector } from "@/components/quant-analytics/TimePeriodSelector";
import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format, subMonths, subDays } from "date-fns";

const categories = [
  {
    path: "overview",
    label: "Overview",
    icon: BarChart3,
    description: "Market snapshot — sector heatmap, top/bottom performers, and breadth indicators for the selected period.",
  },
  {
    path: "stock",
    label: "Stock Analysis",
    icon: LineChart,
    description: "Single-symbol deep dive — cumulative returns, rolling metrics, return distribution, and EWMA volatility.",
  },
  {
    path: "risk",
    label: "Risk & Performance",
    icon: Shield,
    description: "Multi-symbol risk metrics — scatter plots, correlation matrix, drawdown analysis, VaR and CVaR.",
  },
  {
    path: "factor",
    label: "Factor Analysis",
    icon: Layers,
    description: "Systematic factor decomposition — OLS regressions, factor loadings, and rolling factor betas.",
  },
  {
    path: "cross-sectional",
    label: "Cross-Sectional",
    icon: Grid3X3,
    description: "Relative ranking — momentum scores, quintile analysis, sector rotation, and relative strength.",
  },
  {
    path: "intraday",
    label: "Intraday Patterns",
    icon: Clock,
    description: "Trading window behavior — volatility profile, closing momentum, MOC pressure, and time windows.",
  },
  {
    path: "pairs",
    label: "Pairs & Spreads",
    icon: GitBranch,
    description: "Statistical arbitrage research — cointegration screening, spread z-scores, and signal logs.",
  },
];

export default function QuantAnalyticsLanding() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultTo = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const defaultFrom = format(subMonths(new Date(), 1), "yyyy-MM-dd");

  const [from, setFrom] = useState(searchParams.get("from") || defaultFrom);
  const [to, setTo] = useState(searchParams.get("to") || defaultTo);
  const [activePreset, setActivePreset] = useState(searchParams.get("preset") || "1M");

  const handlePeriodChange = useCallback(
    (newFrom: string, newTo: string) => {
      setFrom(newFrom);
      setTo(newTo);
    },
    []
  );

  const handlePresetChange = useCallback(
    (preset: string) => {
      setActivePreset(preset);
    },
    []
  );

  const navigateToCategory = (path: string) => {
    navigate(`/quant/analytics/${path}?from=${from}&to=${to}&preset=${activePreset}`);
  };

  return (
    <div className="space-y-6">
      <TimePeriodSelector
        from={from}
        to={to}
        onPeriodChange={handlePeriodChange}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.path}
              className="group cursor-pointer border-border/50 hover:border-primary/50 transition-colors bg-card/80"
              onClick={() => navigateToCategory(cat.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg mt-3">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {cat.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center italic">
        This analysis is for research purposes only. Not investment advice.
      </p>
    </div>
  );
}
