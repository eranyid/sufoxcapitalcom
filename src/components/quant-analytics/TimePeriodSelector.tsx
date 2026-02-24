import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, subMonths, subYears, startOfYear } from "date-fns";

const PRESETS = [
  { label: "5D", days: 5 },
  { label: "10D", days: 10 },
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "YTD", ytd: true },
  { label: "1Y", years: 1 },
  { label: "2Y", years: 2 },
  { label: "MAX", max: true },
] as const;

interface TimePeriodSelectorProps {
  from: string;
  to: string;
  onPeriodChange: (from: string, to: string) => void;
  activePreset: string;
  onPresetChange: (preset: string) => void;
}

export function TimePeriodSelector({
  from,
  to,
  onPeriodChange,
  activePreset,
  onPresetChange,
}: TimePeriodSelectorProps) {
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      const today = new Date();
      const toDate = format(subDays(today, 1), "yyyy-MM-dd");
      let fromDate: string;

      if ("ytd" in preset) {
        fromDate = format(startOfYear(today), "yyyy-MM-dd");
      } else if ("max" in preset) {
        fromDate = "2020-01-01";
      } else if ("months" in preset) {
        fromDate = format(subMonths(today, preset.months), "yyyy-MM-dd");
      } else if ("years" in preset) {
        fromDate = format(subYears(today, preset.years), "yyyy-MM-dd");
      } else {
        fromDate = format(subDays(today, preset.days), "yyyy-MM-dd");
      }

      onPresetChange(preset.label);
      onPeriodChange(fromDate, toDate);
    },
    [onPeriodChange, onPresetChange]
  );

  const handleCustomApply = useCallback(() => {
    onPresetChange("custom");
    onPeriodChange(customFrom, customTo);
  }, [customFrom, customTo, onPeriodChange, onPresetChange]);

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pb-3 pt-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase mr-1">
          Period
        </span>

        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={activePreset === preset.label ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handlePreset(preset)}
          >
            {preset.label}
          </Button>
        ))}

        <div className="flex items-center gap-1.5 ml-2">
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-7 text-xs w-[130px]"
          />
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <Input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-7 text-xs w-[130px]"
          />
          <Button
            variant={activePreset === "custom" ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleCustomApply}
          >
            Apply
          </Button>
        </div>

        <Badge variant="outline" className="ml-auto text-xs font-mono">
          {from} → {to}
        </Badge>
      </div>
    </div>
  );
}
