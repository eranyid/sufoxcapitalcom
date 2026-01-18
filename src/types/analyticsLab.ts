// Analytics Lab Block Types - Deterministic block-based analytics builder

export type AnalyticsBlockType =
  | 'data_source'
  | 'date_range'
  | 'transform'
  | 'compute'
  | 'output';

export type DataSourceType = 'prices' | 'returns';
export type ResamplePeriod = 'daily' | 'weekly' | 'monthly';
export type ReturnType = 'simple' | 'log';
export type FxMode = 'real' | 'nominal';
export type ComputeFunction = 
  | 'price_at_month_end'
  | 'return_over_period'
  | 'correlation_pair'
  | 'correlation_matrix'
  | 'rolling_correlation';
export type OutputType = 'table' | 'line_chart' | 'heatmap';

export interface DataSourceConfig {
  sourceType: DataSourceType;
  assets: string[];
}

export interface DateRangeConfig {
  preset?: '1M' | '3M' | '6M' | '12M' | 'YTD';
  customStart?: string;
  customEnd?: string;
}

export interface TransformConfig {
  resample?: ResamplePeriod;
  returnType?: ReturnType;
  fxMode?: FxMode;
}

export interface ComputeConfig {
  function: ComputeFunction;
  // For correlation pair
  asset1?: string;
  asset2?: string;
  // For rolling correlation
  rollingWindow?: number;
  // For price at month end
  targetMonth?: string;
}

export interface OutputConfig {
  outputType: OutputType;
  title?: string;
}

export type AnalyticsBlockConfig = 
  | DataSourceConfig
  | DateRangeConfig
  | TransformConfig
  | ComputeConfig
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
  defaultConfig: AnalyticsBlockConfig;
}

export const ANALYTICS_BLOCK_LIBRARY: AnalyticsBlockLibraryItem[] = [
  {
    type: 'data_source',
    label: 'Data Source',
    description: 'Select prices or returns data',
    icon: 'Database',
    color: 'hsl(var(--primary))',
    defaultConfig: { sourceType: 'prices', assets: [] } as DataSourceConfig,
  },
  {
    type: 'date_range',
    label: 'Date Range',
    description: 'Define time period',
    icon: 'Calendar',
    color: 'hsl(200, 60%, 50%)',
    defaultConfig: { preset: '6M' } as DateRangeConfig,
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Resample or convert data',
    icon: 'Shuffle',
    color: 'hsl(280, 60%, 50%)',
    defaultConfig: { resample: 'monthly' } as TransformConfig,
  },
  {
    type: 'compute',
    label: 'Compute',
    description: 'Run calculations',
    icon: 'Calculator',
    color: 'hsl(140, 60%, 40%)',
    defaultConfig: { function: 'price_at_month_end' } as ComputeConfig,
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Display results',
    icon: 'BarChart3',
    color: 'hsl(30, 70%, 50%)',
    defaultConfig: { outputType: 'table' } as OutputConfig,
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
];
