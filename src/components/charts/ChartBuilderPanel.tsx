import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Grid3x3, 
  Percent,
  RefreshCw,
  LineChart,
  PieChartIcon,
  Info,
  Layers,
  ScatterChart,
  Filter,
  ArrowDownUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ChartBuilderState, 
  ChartMetric,
  ChartType,
  DateRangePreset,
  Frequency,
  Benchmark,
  METRIC_CONFIGS,
  getMetricConfig,
  CHART_PRESETS,
} from '@/types/chartBuilder';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

interface ChartBuilderPanelProps {
  state: ChartBuilderState;
  onChange: (updates: Partial<ChartBuilderState>) => void;
  availableAssets: { ticker: string; name: string }[];
  onReset: () => void;
}

const CHART_TYPE_ICONS: Record<ChartType, React.ReactNode> = {
  line: <LineChart className="h-3.5 w-3.5" />,
  area: <TrendingUp className="h-3.5 w-3.5" />,
  bar: <BarChart3 className="h-3.5 w-3.5" />,
  pie: <PieChartIcon className="h-3.5 w-3.5" />,
  treemap: <Grid3x3 className="h-3.5 w-3.5" />,
  heatmap: <Grid3x3 className="h-3.5 w-3.5" />,
  waterfall: <ArrowDownUp className="h-3.5 w-3.5" />,
  scatter: <ScatterChart className="h-3.5 w-3.5" />,
  funnel: <Filter className="h-3.5 w-3.5" />,
};

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: '1Y', label: '1 Year' },
  { value: '3Y', label: '3 Years' },
  { value: 'ALL', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const BENCHMARK_OPTIONS: { value: Benchmark; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'SPY', label: 'S&P 500 (SPY)' },
  { value: '60_40', label: '60/40 Portfolio' },
  { value: 'TA125', label: 'TA-125' },
];

export function ChartBuilderPanel({ 
  state, 
  onChange, 
  availableAssets,
  onReset,
}: ChartBuilderPanelProps) {
  const metricConfig = getMetricConfig(state.metric);
  
  // Validation messages
  const validationMessage = useMemo(() => {
    if (!metricConfig) return null;
    
    const assetCount = state.assets.length || availableAssets.length;
    
    if (metricConfig.minAssets > assetCount) {
      return {
        type: 'warning',
        message: `Select ${metricConfig.minAssets === 2 ? 'at least 2 assets' : `${metricConfig.minAssets} assets`} to enable ${metricConfig.label}`,
      };
    }
    
    if (metricConfig.maxAssets && assetCount > metricConfig.maxAssets) {
      return {
        type: 'info',
        message: `This metric works best with ${metricConfig.maxAssets} asset${metricConfig.maxAssets > 1 ? 's' : ''}`,
      };
    }
    
    if (state.metric === 'rolling_correlation' && state.assets.length !== 2) {
      return {
        type: 'warning',
        message: 'Select exactly 2 assets for rolling correlation',
      };
    }
    
    if (state.metric === 'beta_vs_benchmark' && state.benchmark === 'none') {
      return {
        type: 'warning',
        message: 'Select a benchmark to calculate beta',
      };
    }
    
    return null;
  }, [metricConfig, state.assets.length, state.metric, state.benchmark, availableAssets.length]);
  
  // Handle asset selection
  const handleAssetToggle = (ticker: string) => {
    const currentAssets = state.assets;
    const newAssets = currentAssets.includes(ticker)
      ? currentAssets.filter(a => a !== ticker)
      : [...currentAssets, ticker];
    
    onChange({ assets: newAssets });
  };
  
  const handleSelectAllAssets = () => {
    if (state.assets.length === availableAssets.length) {
      onChange({ assets: [] });
    } else {
      onChange({ assets: availableAssets.map(a => a.ticker) });
    }
  };
  
  // Auto-select compatible chart type when metric changes
  const handleMetricChange = (metric: ChartMetric) => {
    const config = getMetricConfig(metric);
    if (config) {
      const updates: Partial<ChartBuilderState> = { metric };
      
      // Auto-select first compatible chart type if current is incompatible
      if (!config.compatibleChartTypes.includes(state.chartType)) {
        updates.chartType = config.compatibleChartTypes[0];
      }
      
      onChange(updates);
    }
  };
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Metric Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Metric
          </Label>
          <Select value={state.metric} onValueChange={handleMetricChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_CONFIGS.map(config => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex items-center gap-2">
                    <span>{config.label}</span>
                    {config.requiresMultipleAssets && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        {config.minAssets}+ assets
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {metricConfig && (
            <p className="text-[10px] text-muted-foreground">{metricConfig.description}</p>
          )}
        </div>
        
        {/* Validation Message */}
        {validationMessage && (
          <div className={cn(
            "flex items-start gap-2 p-2 rounded text-xs",
            validationMessage.type === 'warning' && "bg-amber-500/10 text-amber-400",
            validationMessage.type === 'info' && "bg-blue-500/10 text-blue-400",
          )}>
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{validationMessage.message}</span>
          </div>
        )}
        
        {/* Asset Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Assets
              {state.assets.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[9px]">
                  {state.assets.length}
                </Badge>
              )}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={handleSelectAllAssets}
            >
              {state.assets.length === availableAssets.length ? 'Clear' : 'All'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {availableAssets.map(asset => (
              <Tooltip key={asset.ticker}>
                <TooltipTrigger asChild>
                  <Button
                    variant={state.assets.includes(asset.ticker) ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 text-[10px] justify-start px-2 font-mono",
                      state.assets.includes(asset.ticker) && "bg-primary/90"
                    )}
                    onClick={() => handleAssetToggle(asset.ticker)}
                  >
                    {asset.ticker}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {asset.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          
          {availableAssets.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              No assets found. Add transactions to get started.
            </p>
          )}
        </div>
        
        {/* Date Range */}
        {metricConfig?.showsDateRange && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date Range
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {DATE_RANGE_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={state.dateRange === opt.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => onChange({ dateRange: opt.value })}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              
              {state.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={state.customDateStart || ''}
                      onChange={e => onChange({ customDateStart: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={state.customDateEnd || ''}
                      onChange={e => onChange({ customDateEnd: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        
        {/* Benchmark (for Beta) */}
        {metricConfig?.showsBenchmark && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Benchmark</Label>
            <Select 
              value={state.benchmark} 
              onValueChange={(v: Benchmark) => onChange({ benchmark: v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BENCHMARK_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Rolling Window */}
        {metricConfig?.showsRollingWindow && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Rolling Window
              </Label>
              <span className="text-xs font-mono text-foreground">{state.rollingWindow} mo</span>
            </div>
            <Slider
              value={[state.rollingWindow]}
              onValueChange={([v]) => onChange({ rollingWindow: v })}
              min={3}
              max={24}
              step={1}
              className="py-2"
            />
          </div>
        )}
        
        <Separator />
        
        {/* Chart Type */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Chart Type</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {metricConfig?.compatibleChartTypes.map(type => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button
                    variant={state.chartType === type ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => onChange({ chartType: type })}
                  >
                    {CHART_TYPE_ICONS[type]}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* Display Options */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
              Display Options
              <Percent className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Normalize toggle - for price comparison */}
            {state.metric === 'price' && (
              <div className="flex items-center justify-between">
                <Label className="text-xs">Normalize to 100</Label>
                <Switch
                  checked={state.normalize}
                  onCheckedChange={v => onChange({ normalize: v })}
                />
              </div>
            )}
            
            {/* Show percentage toggle */}
            {['return_pct', 'cumulative_return'].includes(state.metric) && (
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show as %</Label>
                <Switch
                  checked={state.showPercentage}
                  onCheckedChange={v => onChange({ showPercentage: v })}
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
        
        <Separator />
        
        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={onReset}
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Reset to Defaults
        </Button>
      </div>
    </ScrollArea>
  );
}
