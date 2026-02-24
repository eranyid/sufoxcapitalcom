import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { TimePeriodSelector } from "@/components/quant-analytics/TimePeriodSelector";
import { FactorAnalysisTab } from "@/components/quant-analytics/FactorAnalysisTab";
import { format, subMonths, subDays } from "date-fns";

export default function QuantAnalyticsFactor() {
  const [searchParams] = useSearchParams();
  const defaultTo = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const defaultFrom = format(subMonths(new Date(), 1), "yyyy-MM-dd");

  const [from, setFrom] = useState(searchParams.get("from") || defaultFrom);
  const [to, setTo] = useState(searchParams.get("to") || defaultTo);
  const [activePreset, setActivePreset] = useState(searchParams.get("preset") || "1M");

  const handlePeriodChange = useCallback((newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  }, []);

  return (
    <div className="space-y-4">
      <TimePeriodSelector from={from} to={to} onPeriodChange={handlePeriodChange} activePreset={activePreset} onPresetChange={setActivePreset} />
      <FactorAnalysisTab from={from} to={to} />
      <p className="text-xs text-muted-foreground text-center italic">This analysis is for research purposes only. Not investment advice.</p>
    </div>
  );
}
