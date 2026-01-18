// Analytics Lab Block Types - Deterministic block-based analytics builder

export type AnalyticsBlockType =
  | 'data_source'
  | 'date_range'
  | 'filter'
  | 'transform'
  | 'compute'
  | 'aggregate'
  | 'compare'
  | 'output';

export type DataSourceType = 'prices' | 'returns' | 'transactions' | 'holdings';
export type ResamplePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type ReturnType = 'simple' | 'log';
export type FxMode = 'real' | 'nominal';

export type ComputeFunction = 
  // Price & Return metrics
  | 'price_at_month_end'
  | 'return_over_period'
  | 'total_return_with_cost_basis'
  | 'cagr'
  | 'price_statistics'
  // Correlation metrics
  | 'correlation_pair'
  | 'correlation_matrix'
  | 'rolling_correlation'
  // Risk metrics
  | 'volatility'
  | 'rolling_volatility'
  | 'sharpe_ratio'
  | 'sortino_ratio'
  | 'calmar_ratio'
  | 'drawdown_analysis'
  | 'max_drawdown'
  | 'beta'
  | 'alpha'
  | 'information_ratio'
  | 'var_analysis'
  | 'cvar_analysis'
  // Distribution metrics
  | 'skewness'
  | 'kurtosis'
  | 'histogram'
  // Performance attribution
  | 'contribution_to_return'
  | 'sector_attribution'
  | 'currency_attribution';

export type AggregateFunction = 
  | 'sum'
  | 'mean'
  | 'median'
  | 'min'
  | 'max'
  | 'std'
  | 'count'
  | 'weighted_avg';

export type CompareMode = 
  | 'vs_benchmark'
  | 'vs_period'
  | 'rank';

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in_list'
  | 'contains';

export type OutputType = 'table' | 'line_chart' | 'bar_chart' | 'heatmap' | 'scatter' | 'histogram' | 'summary_card';

export interface DataSourceConfig {
  sourceType: DataSourceType;
  assets: string[];
}

export interface DateRangeConfig {
  preset?: '1M' | '3M' | '6M' | '12M' | 'YTD' | '2Y' | '3Y' | '5Y' | 'ALL';
  customStart?: string;
  customEnd?: string;
}

export interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: string | number | string[];
  value2?: number; // For 'between' operator
}

export interface TransformConfig {
  resample?: ResamplePeriod;
  returnType?: ReturnType;
  fxMode?: FxMode;
  normalize?: boolean;
  fillMethod?: 'forward' | 'backward' | 'interpolate' | 'zero';
}

export interface ComputeConfig {
  function: ComputeFunction;
  // For correlation pair
  asset1?: string;
  asset2?: string;
  // For rolling metrics
  rollingWindow?: number;
  // For price at month end
  targetMonth?: string;
  // For Sharpe/Sortino/Calmar ratio
  riskFreeRate?: number;
  // For Beta/Alpha/IR calculation
  benchmarkAsset?: string;
  // For VaR/CVaR
  confidenceLevel?: number;
  // For histogram
  bins?: number;
}

export interface AggregateConfig {
  function: AggregateFunction;
  groupBy?: 'asset' | 'sector' | 'geography' | 'asset_type' | 'month' | 'quarter' | 'year';
  weightField?: string;
}

export interface CompareConfig {
  mode: CompareMode;
  benchmark?: string;
  comparePeriod?: string;
  rankOrder?: 'asc' | 'desc';
}

export interface OutputConfig {
  outputType: OutputType;
  title?: string;
  showLegend?: boolean;
  colorScheme?: 'default' | 'green_red' | 'blue_orange' | 'monochrome';
  precision?: number;
}

export type AnalyticsBlockConfig = 
  | DataSourceConfig
  | DateRangeConfig
  | FilterConfig
  | TransformConfig
  | ComputeConfig
  | AggregateConfig
  | CompareConfig
  | OutputConfig;

export interface AnalyticsBlock {
  id: string;
  type: AnalyticsBlockType;
  config: AnalyticsBlockConfig;
  // Position in the pipeline (0-indexed)
  position: number;
}

export interface AnalyticsPipeline {
  id: string;
  name: string;
  blocks: AnalyticsBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineResult {
  success: boolean;
  data?: any;
  chartData?: any;
  outputType?: OutputType;
  error?: string;
  executedAt: string;
}

// Block library metadata
export interface AnalyticsBlockLibraryItem {
  type: AnalyticsBlockType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: 'input' | 'transform' | 'analysis' | 'output';
  defaultConfig: AnalyticsBlockConfig;
}

export const ANALYTICS_BLOCK_LIBRARY: AnalyticsBlockLibraryItem[] = [
  // === INPUT BLOCKS ===
  {
    type: 'data_source',
    label: 'Data Source',
    description: 'Select prices, returns, or transactions',
    icon: 'Database',
    color: 'hsl(var(--primary))',
    category: 'input',
    defaultConfig: { sourceType: 'prices', assets: [] } as DataSourceConfig,
  },
  {
    type: 'date_range',
    label: 'Date Range',
    description: 'Define time period for analysis',
    icon: 'Calendar',
    color: 'hsl(200, 60%, 50%)',
    category: 'input',
    defaultConfig: { preset: '6M' } as DateRangeConfig,
  },
  
  // === TRANSFORM BLOCKS ===
  {
    type: 'filter',
    label: 'Filter',
    description: 'Filter data by conditions',
    icon: 'Filter',
    color: 'hsl(320, 60%, 50%)',
    category: 'transform',
    defaultConfig: { field: 'ticker', operator: 'in_list', value: [] } as FilterConfig,
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Resample, convert, or normalize',
    icon: 'Shuffle',
    color: 'hsl(280, 60%, 50%)',
    category: 'transform',
    defaultConfig: { resample: 'monthly' } as TransformConfig,
  },
  {
    type: 'aggregate',
    label: 'Aggregate',
    description: 'Group and summarize data',
    icon: 'Layers',
    color: 'hsl(180, 60%, 45%)',
    category: 'transform',
    defaultConfig: { function: 'mean', groupBy: 'asset' } as AggregateConfig,
  },
  
  // === ANALYSIS BLOCKS ===
  {
    type: 'compute',
    label: 'Compute',
    description: 'Run calculations and metrics',
    icon: 'Calculator',
    color: 'hsl(140, 60%, 40%)',
    category: 'analysis',
    defaultConfig: { function: 'price_at_month_end' } as ComputeConfig,
  },
  {
    type: 'compare',
    label: 'Compare',
    description: 'Compare vs benchmark or period',
    icon: 'GitCompare',
    color: 'hsl(45, 70%, 50%)',
    category: 'analysis',
    defaultConfig: { mode: 'vs_benchmark', benchmark: 'SPY' } as CompareConfig,
  },
  
  // === OUTPUT BLOCKS ===
  {
    type: 'output',
    label: 'Output',
    description: 'Display results as chart or table',
    icon: 'BarChart3',
    color: 'hsl(30, 70%, 50%)',
    category: 'output',
    defaultConfig: { outputType: 'table', showLegend: true, precision: 2 } as OutputConfig,
  },
];

// Quick presets for common pipelines
export interface QuickPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  blocks: Omit<AnalyticsBlock, 'id'>[];
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'price_in_month',
    name: 'Price in Month',
    description: 'Get month-end price for selected assets',
    icon: 'DollarSign',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'prices', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '1M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'price_at_month_end' } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Month-End Prices' } as OutputConfig },
    ],
  },
  {
    id: 'correlation_6m',
    name: 'Correlation (6M)',
    description: 'Correlation between two assets over 6 months',
    icon: 'GitMerge',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'returns', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '6M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'correlation_pair' } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Correlation Analysis' } as OutputConfig },
    ],
  },
  {
    id: 'rolling_corr_90d',
    name: 'Rolling Corr (90D)',
    description: 'Rolling 90-day correlation chart',
    icon: 'TrendingUp',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'returns', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'rolling_correlation', rollingWindow: 90 } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'line_chart', title: 'Rolling Correlation' } as OutputConfig },
    ],
  },
  {
    id: 'monthly_returns',
    name: 'Monthly Returns Table',
    description: 'Monthly returns for selected assets',
    icon: 'Table',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'prices', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'transform', position: 2, config: { resample: 'monthly', returnType: 'simple' } as TransformConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Monthly Returns' } as OutputConfig },
    ],
  },
  {
    id: 'correlation_matrix',
    name: 'Correlation Matrix',
    description: 'Full correlation heatmap for multiple assets',
    icon: 'Grid3x3',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'returns', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '6M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'correlation_matrix' } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'heatmap', title: 'Correlation Matrix' } as OutputConfig },
    ],
  },
  {
    id: 'total_return_cost_basis',
    name: 'Total Return (Cost Basis)',
    description: 'Calculate total return including cost basis from transactions',
    icon: 'TrendingUp',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'prices', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'total_return_with_cost_basis' } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Total Return Analysis' } as OutputConfig },
    ],
  },
  {
    id: 'volatility_analysis',
    name: 'Volatility Analysis',
    description: 'Annualized volatility for selected assets',
    icon: 'Activity',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'prices', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'volatility' } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Volatility Analysis' } as OutputConfig },
    ],
  },
  {
    id: 'drawdown_analysis',
    name: 'Drawdown Analysis',
    description: 'Maximum drawdown and recovery periods',
    icon: 'TrendingDown',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'prices', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'drawdown_analysis' } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Drawdown Analysis' } as OutputConfig },
    ],
  },
  {
    id: 'risk_adjusted_returns',
    name: 'Risk-Adjusted Returns',
    description: 'Sharpe, Sortino, and Calmar ratios',
    icon: 'Shield',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'prices', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'sharpe_ratio', riskFreeRate: 0.05 } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Risk-Adjusted Returns' } as OutputConfig },
    ],
  },
  {
    id: 'var_analysis',
    name: 'VaR Analysis',
    description: 'Value at Risk at 95% and 99% confidence',
    icon: 'AlertTriangle',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'returns', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'var_analysis', confidenceLevel: 0.95 } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'table', title: 'Value at Risk' } as OutputConfig },
    ],
  },
  {
    id: 'benchmark_comparison',
    name: 'Benchmark Comparison',
    description: 'Compare portfolio vs S&P 500',
    icon: 'GitCompare',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'prices', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compare', position: 2, config: { mode: 'vs_benchmark', benchmark: 'SPY' } as CompareConfig },
      { type: 'output', position: 3, config: { outputType: 'line_chart', title: 'Benchmark Comparison' } as OutputConfig },
    ],
  },
  {
    id: 'return_distribution',
    name: 'Return Distribution',
    description: 'Histogram of returns with skew/kurtosis',
    icon: 'BarChart2',
    blocks: [
      { type: 'data_source', position: 0, config: { sourceType: 'returns', assets: [] } as DataSourceConfig },
      { type: 'date_range', position: 1, config: { preset: '12M' } as DateRangeConfig },
      { type: 'compute', position: 2, config: { function: 'histogram', bins: 20 } as ComputeConfig },
      { type: 'output', position: 3, config: { outputType: 'histogram', title: 'Return Distribution' } as OutputConfig },
    ],
  },
];
