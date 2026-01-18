// Pipeline Validation Engine
// Validates block configurations and connections

import { 
  AnalyticsBlock, 
  DataSourceConfig, 
  ComputeConfig,
  ComputeFunction,
  OutputType,
  DataSourceType,
} from '@/types/analyticsLab';

export interface ValidationError {
  blockId: string;
  blockType: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ComputeFunctionRequirement {
  minAssets: number;
  maxAssets: number | null;
  requiresSpecificAssets?: boolean; // For functions that need asset1/asset2 selection
  recommendedOutput?: OutputType;
  compatibleOutputs: OutputType[];  // All compatible output types
  compatibleSources: DataSourceType[]; // Which data sources this function works with
  description: string;
}

// Define all output types for easy reference
const TABLE_OUTPUTS: OutputType[] = ['table', 'kpi_cards', 'summary_card'];
const CHART_OUTPUTS: OutputType[] = ['line_chart', 'area_chart', 'bar_chart', 'stacked_bar'];
const DISTRIBUTION_OUTPUTS: OutputType[] = ['pie_chart', 'donut_chart', 'treemap'];
const COMPARISON_OUTPUTS: OutputType[] = ['bar_chart', 'radar_chart', 'waterfall'];
const TIME_SERIES_OUTPUTS: OutputType[] = ['line_chart', 'area_chart', 'sparkline_grid'];
const MATRIX_OUTPUTS: OutputType[] = ['heatmap', 'table'];
const SINGLE_VALUE_OUTPUTS: OutputType[] = ['gauge', 'kpi_cards', 'summary_card', 'table'];

// Define requirements for each compute function
export const COMPUTE_FUNCTION_REQUIREMENTS: Record<ComputeFunction, ComputeFunctionRequirement> = {
  // === Exactly 2 assets required ===
  correlation_pair: {
    minAssets: 2,
    maxAssets: 2,
    requiresSpecificAssets: true,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'gauge', 'kpi_cards', 'summary_card'],
    compatibleSources: ['prices', 'returns'],
    description: 'Correlation between exactly 2 assets',
  },
  rolling_correlation: {
    minAssets: 2,
    maxAssets: 2,
    requiresSpecificAssets: true,
    recommendedOutput: 'line_chart',
    compatibleOutputs: ['line_chart', 'area_chart', 'sparkline_grid', 'table'],
    compatibleSources: ['prices', 'returns'],
    description: 'Rolling correlation requires exactly 2 assets',
  },
  beta: {
    minAssets: 2,
    maxAssets: 2,
    requiresSpecificAssets: true,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'gauge', 'kpi_cards', 'summary_card'],
    compatibleSources: ['prices', 'returns'],
    description: 'Beta calculation requires exactly 2 assets (asset + benchmark)',
  },
  alpha: {
    minAssets: 2,
    maxAssets: 2,
    requiresSpecificAssets: true,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'gauge', 'kpi_cards', 'summary_card'],
    compatibleSources: ['prices', 'returns'],
    description: 'Alpha (excess return vs benchmark)',
  },
  information_ratio: {
    minAssets: 2,
    maxAssets: 2,
    requiresSpecificAssets: true,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'gauge', 'kpi_cards', 'summary_card'],
    compatibleSources: ['prices', 'returns'],
    description: 'Information ratio vs benchmark',
  },
  
  // === At least 2 assets required ===
  correlation_matrix: {
    minAssets: 2,
    maxAssets: null,
    recommendedOutput: 'heatmap',
    compatibleOutputs: ['heatmap', 'table'],
    compatibleSources: ['prices', 'returns'],
    description: 'Correlation matrix requires at least 2 assets',
  },
  
  // === At least 1 asset required ===
  price_at_month_end: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'kpi_cards', 'sparkline_grid'],
    compatibleSources: ['prices'],
    description: 'Get month-end prices for selected assets',
  },
  return_over_period: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'line_chart', 'area_chart', 'waterfall', 'kpi_cards', 'pie_chart', 'donut_chart'],
    compatibleSources: ['prices', 'returns'],
    description: 'Calculate returns over the selected period',
  },
  total_return_with_cost_basis: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'waterfall', 'kpi_cards', 'pie_chart', 'donut_chart', 'treemap'],
    compatibleSources: ['prices', 'transactions'],
    description: 'Total return including cost basis',
  },
  volatility: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'radar_chart', 'kpi_cards'],
    compatibleSources: ['prices', 'returns'],
    description: 'Annualized volatility for each asset',
  },
  rolling_volatility: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'line_chart',
    compatibleOutputs: ['line_chart', 'area_chart', 'sparkline_grid', 'table'],
    compatibleSources: ['prices', 'returns'],
    description: 'Rolling volatility over time',
  },
  sharpe_ratio: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'radar_chart', 'gauge', 'kpi_cards'],
    compatibleSources: ['prices', 'returns'],
    description: 'Risk-adjusted return metric',
  },
  sortino_ratio: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'radar_chart', 'gauge', 'kpi_cards'],
    compatibleSources: ['prices', 'returns'],
    description: 'Downside risk-adjusted return',
  },
  calmar_ratio: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'radar_chart', 'gauge', 'kpi_cards'],
    compatibleSources: ['prices', 'returns'],
    description: 'Return / Max Drawdown ratio',
  },
  drawdown_analysis: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'line_chart', 'area_chart', 'waterfall', 'kpi_cards'],
    compatibleSources: ['prices'],
    description: 'Maximum drawdown and recovery analysis',
  },
  max_drawdown: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'gauge', 'kpi_cards'],
    compatibleSources: ['prices'],
    description: 'Maximum drawdown percentage',
  },
  cagr: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'gauge', 'kpi_cards'],
    compatibleSources: ['prices'],
    description: 'Compound annual growth rate',
  },
  price_statistics: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'kpi_cards'],
    compatibleSources: ['prices'],
    description: 'Price statistics (min, max, avg, etc.)',
  },
  var_analysis: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'gauge', 'kpi_cards', 'summary_card'],
    compatibleSources: ['returns'],
    description: 'Value at Risk analysis',
  },
  cvar_analysis: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'gauge', 'kpi_cards', 'summary_card'],
    compatibleSources: ['returns'],
    description: 'Conditional Value at Risk (Expected Shortfall)',
  },
  skewness: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'gauge', 'kpi_cards'],
    compatibleSources: ['returns'],
    description: 'Return distribution skewness',
  },
  kurtosis: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'gauge', 'kpi_cards'],
    compatibleSources: ['returns'],
    description: 'Return distribution kurtosis',
  },
  histogram: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'histogram',
    compatibleOutputs: ['histogram', 'bar_chart', 'table'],
    compatibleSources: ['returns'],
    description: 'Return distribution histogram',
  },
  contribution_to_return: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'table',
    compatibleOutputs: ['table', 'bar_chart', 'waterfall', 'pie_chart', 'donut_chart', 'treemap'],
    compatibleSources: ['transactions', 'holdings'],
    description: 'Asset contribution to portfolio return',
  },
  sector_attribution: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'bar_chart',
    compatibleOutputs: ['bar_chart', 'pie_chart', 'donut_chart', 'treemap', 'table', 'waterfall'],
    compatibleSources: ['holdings'],
    description: 'Return attribution by sector',
  },
  currency_attribution: {
    minAssets: 1,
    maxAssets: null,
    recommendedOutput: 'bar_chart',
    compatibleOutputs: ['bar_chart', 'pie_chart', 'donut_chart', 'treemap', 'table', 'waterfall'],
    compatibleSources: ['holdings'],
    description: 'Return attribution by currency',
  },
};

// Get compatible output types for a compute function
export function getCompatibleOutputTypes(fn: ComputeFunction): OutputType[] {
  return COMPUTE_FUNCTION_REQUIREMENTS[fn]?.compatibleOutputs || ['table'];
}

// Get compatible compute functions for a data source type
export function getCompatibleComputeFunctions(sourceType: DataSourceType): ComputeFunction[] {
  return (Object.keys(COMPUTE_FUNCTION_REQUIREMENTS) as ComputeFunction[]).filter(fn => 
    COMPUTE_FUNCTION_REQUIREMENTS[fn].compatibleSources.includes(sourceType)
  );
}

// Check if output type is compatible with compute function
export function isOutputCompatible(fn: ComputeFunction, outputType: OutputType): boolean {
  return COMPUTE_FUNCTION_REQUIREMENTS[fn]?.compatibleOutputs.includes(outputType) ?? false;
}

// Get selected assets from the pipeline
export function getSelectedAssets(blocks: AnalyticsBlock[]): string[] {
  const dataSourceBlock = blocks.find(b => b.type === 'data_source');
  if (!dataSourceBlock) return [];
  
  const config = dataSourceBlock.config as DataSourceConfig;
  return config.assets || [];
}

// Get available compute functions based on selected assets
export function getAvailableComputeFunctions(assetCount: number): ComputeFunction[] {
  return (Object.keys(COMPUTE_FUNCTION_REQUIREMENTS) as ComputeFunction[]).filter(fn => {
    const req = COMPUTE_FUNCTION_REQUIREMENTS[fn];
    const meetsMin = assetCount >= req.minAssets;
    const meetsMax = req.maxAssets === null || assetCount <= req.maxAssets;
    return meetsMin && meetsMax;
  });
}

// Check if a compute function is valid for the given asset count
export function isComputeFunctionValid(fn: ComputeFunction, assetCount: number): boolean {
  const req = COMPUTE_FUNCTION_REQUIREMENTS[fn];
  const meetsMin = assetCount >= req.minAssets;
  const meetsMax = req.maxAssets === null || assetCount <= req.maxAssets;
  return meetsMin && meetsMax;
}

// Get validation message for a compute function
export function getComputeFunctionValidationMessage(fn: ComputeFunction, assetCount: number): string | null {
  const req = COMPUTE_FUNCTION_REQUIREMENTS[fn];
  
  if (assetCount < req.minAssets) {
    if (req.minAssets === req.maxAssets) {
      return `Requires exactly ${req.minAssets} assets (currently ${assetCount})`;
    }
    return `Requires at least ${req.minAssets} assets (currently ${assetCount})`;
  }
  
  if (req.maxAssets !== null && assetCount > req.maxAssets) {
    if (req.minAssets === req.maxAssets) {
      return `Requires exactly ${req.maxAssets} assets (currently ${assetCount})`;
    }
    return `Maximum ${req.maxAssets} assets allowed (currently ${assetCount})`;
  }
  
  return null;
}

// Validate entire pipeline
export function validatePipeline(blocks: AnalyticsBlock[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const assets = getSelectedAssets(blocks);
  const assetCount = assets.length;
  
  // Check if we have a data source
  const hasDataSource = blocks.some(b => b.type === 'data_source');
  if (!hasDataSource) {
    errors.push({
      blockId: '',
      blockType: 'pipeline',
      message: 'Pipeline requires a Data Source block',
      severity: 'error',
    });
  }
  
  // Validate each block
  blocks.forEach(block => {
    switch (block.type) {
      case 'data_source': {
        const config = block.config as DataSourceConfig;
        if (!config.assets || config.assets.length === 0) {
          errors.push({
            blockId: block.id,
            blockType: 'data_source',
            field: 'assets',
            message: 'Select at least one asset',
            severity: 'error',
          });
        }
        break;
      }
      
      case 'compute': {
        const config = block.config as ComputeConfig;
        const fn = config.function;
        
        // Check asset count requirements
        const validationMessage = getComputeFunctionValidationMessage(fn, assetCount);
        if (validationMessage) {
          errors.push({
            blockId: block.id,
            blockType: 'compute',
            field: 'function',
            message: validationMessage,
            severity: 'error',
          });
        }
        
        // Check specific asset selection for pair functions
        const req = COMPUTE_FUNCTION_REQUIREMENTS[fn];
        if (req.requiresSpecificAssets) {
          if (!config.asset1 || !config.asset2) {
            errors.push({
              blockId: block.id,
              blockType: 'compute',
              field: 'assets',
              message: 'Select both assets for comparison',
              severity: 'warning',
            });
          } else if (config.asset1 === config.asset2) {
            errors.push({
              blockId: block.id,
              blockType: 'compute',
              field: 'assets',
              message: 'Assets must be different',
              severity: 'error',
            });
          }
        }
        
        // Check benchmark for beta
        if (fn === 'beta' && !config.benchmarkAsset) {
          errors.push({
            blockId: block.id,
            blockType: 'compute',
            field: 'benchmarkAsset',
            message: 'Select a benchmark asset',
            severity: 'warning',
          });
        }
        
        break;
      }
    }
  });
  
  return errors;
}

// Get recommended output type for a compute function
export function getRecommendedOutput(fn: ComputeFunction): OutputType {
  return COMPUTE_FUNCTION_REQUIREMENTS[fn].recommendedOutput || 'table';
}
