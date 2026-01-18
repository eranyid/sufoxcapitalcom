// Chart Builder Types - Self-serve chart building without AI

export type ChartMetric = 
  | 'price'
  | 'return_pct'
  | 'cumulative_return'
  | 'drawdown'
  | 'rolling_volatility'
  | 'correlation_matrix'
  | 'rolling_correlation'
  | 'beta_vs_benchmark'
  | 'allocation'
  | 'contribution';

export type ChartType = 
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'treemap'
  | 'heatmap'
  | 'waterfall';

export type DateRangePreset = '3M' | '6M' | '1Y' | '3Y' | 'ALL' | 'custom';

export type Frequency = 'daily' | 'weekly' | 'monthly';

export type Benchmark = 'SPY' | '60_40' | 'TA125' | 'none';

export interface ChartBuilderState {
  metric: ChartMetric;
  assets: string[];
  dateRange: DateRangePreset;
  customDateStart?: string;
  customDateEnd?: string;
  frequency: Frequency;
  chartType: ChartType;
  benchmark: Benchmark;
  // For rolling correlation
  asset1?: string;
  asset2?: string;
  // Display options
  normalize: boolean;
  showPercentage: boolean;
  // Rolling window (for volatility, correlation)
  rollingWindow: number;
}

export interface MetricConfig {
  id: ChartMetric;
  label: string;
  description: string;
  compatibleChartTypes: ChartType[];
  requiresMultipleAssets: boolean;
  minAssets: number;
  maxAssets?: number;
  showsFrequency: boolean;
  showsDateRange: boolean;
  showsBenchmark: boolean;
  showsRollingWindow: boolean;
}

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: 'price',
    label: 'Price (Historical)',
    description: 'Historical price chart for selected assets',
    compatibleChartTypes: ['line', 'area'],
    requiresMultipleAssets: false,
    minAssets: 1,
    showsFrequency: true,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: false,
  },
  {
    id: 'return_pct',
    label: 'Return % (Periodic)',
    description: 'Periodic returns for selected assets',
    compatibleChartTypes: ['line', 'bar', 'area'],
    requiresMultipleAssets: false,
    minAssets: 1,
    showsFrequency: true,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: false,
  },
  {
    id: 'cumulative_return',
    label: 'Cumulative Return',
    description: 'Cumulative performance over time',
    compatibleChartTypes: ['line', 'area'],
    requiresMultipleAssets: false,
    minAssets: 1,
    showsFrequency: true,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: false,
  },
  {
    id: 'drawdown',
    label: 'Drawdown',
    description: 'Peak-to-trough drawdown analysis',
    compatibleChartTypes: ['area', 'line'],
    requiresMultipleAssets: false,
    minAssets: 1,
    showsFrequency: true,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: false,
  },
  {
    id: 'rolling_volatility',
    label: 'Rolling Volatility',
    description: 'Rolling annualized volatility',
    compatibleChartTypes: ['line', 'area'],
    requiresMultipleAssets: false,
    minAssets: 1,
    showsFrequency: true,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: true,
  },
  {
    id: 'correlation_matrix',
    label: 'Correlation Matrix',
    description: 'Correlation heatmap between assets',
    compatibleChartTypes: ['heatmap'],
    requiresMultipleAssets: true,
    minAssets: 2,
    showsFrequency: false,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: false,
  },
  {
    id: 'rolling_correlation',
    label: 'Rolling Correlation (Pair)',
    description: 'Rolling correlation between two assets',
    compatibleChartTypes: ['line', 'area'],
    requiresMultipleAssets: true,
    minAssets: 2,
    maxAssets: 2,
    showsFrequency: true,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: true,
  },
  {
    id: 'beta_vs_benchmark',
    label: 'Beta vs Benchmark',
    description: 'Rolling beta relative to benchmark',
    compatibleChartTypes: ['line', 'bar'],
    requiresMultipleAssets: false,
    minAssets: 1,
    maxAssets: 1,
    showsFrequency: true,
    showsDateRange: true,
    showsBenchmark: true,
    showsRollingWindow: true,
  },
  {
    id: 'allocation',
    label: 'Allocation (Pie/Treemap)',
    description: 'Current portfolio allocation',
    compatibleChartTypes: ['pie', 'treemap'],
    requiresMultipleAssets: false,
    minAssets: 1,
    showsFrequency: false,
    showsDateRange: false,
    showsBenchmark: false,
    showsRollingWindow: false,
  },
  {
    id: 'contribution',
    label: 'Contribution to Return',
    description: 'Asset contribution breakdown',
    compatibleChartTypes: ['bar', 'waterfall'],
    requiresMultipleAssets: false,
    minAssets: 1,
    showsFrequency: false,
    showsDateRange: true,
    showsBenchmark: false,
    showsRollingWindow: false,
  },
];

export interface ChartPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<ChartBuilderState>;
}

export const CHART_PRESETS: ChartPreset[] = [
  {
    id: 'price_comparison_1y',
    name: 'Price Comparison (1Y)',
    description: 'Compare price performance over 1 year',
    icon: 'TrendingUp',
    config: {
      metric: 'price',
      dateRange: '1Y',
      frequency: 'monthly',
      chartType: 'line',
      normalize: true,
      showPercentage: false,
    },
  },
  {
    id: 'cumulative_returns_1y',
    name: 'Cumulative Returns (1Y)',
    description: 'Cumulative returns over 1 year',
    icon: 'LineChart',
    config: {
      metric: 'cumulative_return',
      dateRange: '1Y',
      frequency: 'monthly',
      chartType: 'area',
      normalize: false,
      showPercentage: true,
    },
  },
  {
    id: 'correlation_6m',
    name: 'Correlation Matrix (6M)',
    description: 'Asset correlations over 6 months',
    icon: 'Grid3x3',
    config: {
      metric: 'correlation_matrix',
      dateRange: '6M',
      chartType: 'heatmap',
    },
  },
];

export const getMetricConfig = (metric: ChartMetric): MetricConfig | undefined => {
  return METRIC_CONFIGS.find(m => m.id === metric);
};

export const getDefaultChartState = (): ChartBuilderState => ({
  metric: 'price',
  assets: [],
  dateRange: '1Y',
  frequency: 'monthly',
  chartType: 'line',
  benchmark: 'none',
  normalize: false,
  showPercentage: false,
  rollingWindow: 12,
});
