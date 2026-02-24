import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimePeriodSelector } from "@/components/quant-analytics/TimePeriodSelector";
import { OverviewTab } from "@/components/quant-analytics/OverviewTab";
import { StockAnalysisTab } from "@/components/quant-analytics/StockAnalysisTab";
import { RiskPerformanceTab } from "@/components/quant-analytics/RiskPerformanceTab";
import { FactorAnalysisTab } from "@/components/quant-analytics/FactorAnalysisTab";
import { CrossSectionalTab } from "@/components/quant-analytics/CrossSectionalTab";
import { IntradayPatternsTab } from "@/components/quant-analytics/IntradayPatternsTab";
import { PairsSpreadsTab } from "@/components/quant-analytics/PairsSpreadsTab";
import { format, subMonths, subDays } from "date-fns";

export default function QuantAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params or default to 1M
  const defaultTo = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const defaultFrom = format(subMonths(new Date(), 1), "yyyy-MM-dd");

  const [from, setFrom] = useState(searchParams.get("from") || defaultFrom);
  const [to, setTo] = useState(searchParams.get("to") || defaultTo);
  const [activePreset, setActivePreset] = useState(searchParams.get("preset") || "1M");

  const handlePeriodChange = useCallback(
    (newFrom: string, newTo: string) => {
      setFrom(newFrom);
      setTo(newTo);
      setSearchParams({ from: newFrom, to: newTo, preset: activePreset });
    },
    [activePreset, setSearchParams]
  );

  const handlePresetChange = useCallback(
    (preset: string) => {
      setActivePreset(preset);
    },
    []
  );

  // Sync URL params on preset change
  useEffect(() => {
    setSearchParams({ from, to, preset: activePreset });
  }, [from, to, activePreset, setSearchParams]);

  return (
    <div className="space-y-4">
      {/* Sticky Time Period Selector */}
      <TimePeriodSelector
        from={from}
        to={to}
        onPeriodChange={handlePeriodChange}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock">Stock Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk & Performance</TabsTrigger>
          <TabsTrigger value="factor">Factor Analysis</TabsTrigger>
          <TabsTrigger value="cross">Cross-Sectional</TabsTrigger>
          <TabsTrigger value="intraday">Intraday Patterns</TabsTrigger>
          <TabsTrigger value="pairs">Pairs & Spreads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab from={from} to={to} />
        </TabsContent>
        <TabsContent value="stock">
          <StockAnalysisTab from={from} to={to} />
        </TabsContent>
        <TabsContent value="risk">
          <RiskPerformanceTab from={from} to={to} />
        </TabsContent>
        <TabsContent value="factor">
          <FactorAnalysisTab from={from} to={to} />
        </TabsContent>
        <TabsContent value="cross">
          <CrossSectionalTab from={from} to={to} />
        </TabsContent>
        <TabsContent value="intraday">
          <IntradayPatternsTab from={from} to={to} />
        </TabsContent>
        <TabsContent value="pairs">
          <PairsSpreadsTab from={from} to={to} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
