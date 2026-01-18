// Analytics Lab Pipeline Execution Engine
// All computations are deterministic - NO LLM calls

import { 
  AnalyticsBlock, 
  AnalyticsPipeline, 
  PipelineResult,
  DataSourceConfig,
  DateRangeConfig,
  TransformConfig,
  ComputeConfig,
  OutputConfig,
} from '@/types/analyticsLab';
import { format, subMonths, subDays, startOfYear, parseISO, isAfter, isBefore, endOfMonth, startOfMonth } from 'date-fns';

interface PipelineContext {
  data: Record<string, number[]>;
  dates: string[];
  assets: string[];
  dateRange: { start: string; end: string };
  computeResult?: any;
}

// Mock price data generator (in production, this would fetch from Supabase)
function generateMockPrices(assets: string[], dates: string[]): Record<string, number[]> {
  const priceData: Record<string, number[]> = {};
  
  assets.forEach(asset => {
    const basePrice = 100 + Math.random() * 400;
    let currentPrice = basePrice;
    priceData[asset] = dates.map(() => {
      const change = (Math.random() - 0.5) * 0.04;
      currentPrice = currentPrice * (1 + change);
      return Number(currentPrice.toFixed(2));
    });
  });
  
  return priceData;
}

// Calculate returns from prices
function calculateReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  return prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
}

// Calculate log returns
function calculateLogReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  return prices.slice(1).map((price, i) => Math.log(price / prices[i]));
}

// Calculate correlation between two series
function calculateCorrelation(series1: number[], series2: number[]): number {
  if (series1.length !== series2.length || series1.length < 2) return 0;
  
  const n = series1.length;
  const mean1 = series1.reduce((a, b) => a + b, 0) / n;
  const mean2 = series2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(denom1) * Math.sqrt(denom2);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Calculate rolling correlation
function calculateRollingCorrelation(series1: number[], series2: number[], windowSize: number): number[] {
  const result: number[] = [];
  
  for (let i = windowSize - 1; i < series1.length; i++) {
    const window1 = series1.slice(i - windowSize + 1, i + 1);
    const window2 = series2.slice(i - windowSize + 1, i + 1);
    result.push(calculateCorrelation(window1, window2));
  }
  
  return result;
}

// Calculate correlation matrix
function calculateCorrelationMatrix(data: Record<string, number[]>, assets: string[]): number[][] {
  const matrix: number[][] = [];
  
  assets.forEach((asset1, i) => {
    matrix[i] = [];
    assets.forEach((asset2, j) => {
      if (i === j) {
        matrix[i][j] = 1;
      } else if (j < i) {
        matrix[i][j] = matrix[j][i];
      } else {
        const returns1 = calculateReturns(data[asset1] || []);
        const returns2 = calculateReturns(data[asset2] || []);
        matrix[i][j] = calculateCorrelation(returns1, returns2);
      }
    });
  });
  
  return matrix;
}

// Generate date range
function generateDateRange(config: DateRangeConfig): { start: string; end: string; dates: string[] } {
  const today = new Date();
  let startDate: Date;
  const endDate = today;
  
  if (config.customStart && config.customEnd) {
    startDate = parseISO(config.customStart);
  } else {
    switch (config.preset) {
      case '1M':
        startDate = subMonths(today, 1);
        break;
      case '3M':
        startDate = subMonths(today, 3);
        break;
      case '6M':
        startDate = subMonths(today, 6);
        break;
      case '12M':
        startDate = subMonths(today, 12);
        break;
      case 'YTD':
        startDate = startOfYear(today);
        break;
      default:
        startDate = subMonths(today, 6);
    }
  }
  
  // Generate daily dates
  const dates: string[] = [];
  let current = startDate;
  while (isBefore(current, endDate) || format(current, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
    dates,
  };
}

// Resample data to different frequency
function resampleData(
  data: Record<string, number[]>, 
  dates: string[], 
  period: 'daily' | 'weekly' | 'monthly'
): { data: Record<string, number[]>; dates: string[] } {
  if (period === 'daily') {
    return { data, dates };
  }
  
  const resampledData: Record<string, number[]> = {};
  const resampledDates: string[] = [];
  
  Object.keys(data).forEach(asset => {
    resampledData[asset] = [];
  });
  
  let currentBucket: { dates: string[]; values: Record<string, number[]> } = { dates: [], values: {} };
  Object.keys(data).forEach(asset => {
    currentBucket.values[asset] = [];
  });
  
  let lastBucketKey = '';
  
  dates.forEach((date, i) => {
    const dateObj = parseISO(date);
    let bucketKey: string;
    
    if (period === 'weekly') {
      // Week number
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay());
      bucketKey = format(weekStart, 'yyyy-MM-dd');
    } else {
      // Month
      bucketKey = format(dateObj, 'yyyy-MM');
    }
    
    if (bucketKey !== lastBucketKey && lastBucketKey !== '') {
      // End of bucket - use last value
      resampledDates.push(currentBucket.dates[currentBucket.dates.length - 1]);
      Object.keys(data).forEach(asset => {
        const values = currentBucket.values[asset];
        resampledData[asset].push(values[values.length - 1]);
      });
      
      // Reset bucket
      currentBucket = { dates: [], values: {} };
      Object.keys(data).forEach(asset => {
        currentBucket.values[asset] = [];
      });
    }
    
    currentBucket.dates.push(date);
    Object.keys(data).forEach(asset => {
      currentBucket.values[asset].push(data[asset][i]);
    });
    
    lastBucketKey = bucketKey;
  });
  
  // Handle last bucket
  if (currentBucket.dates.length > 0) {
    resampledDates.push(currentBucket.dates[currentBucket.dates.length - 1]);
    Object.keys(data).forEach(asset => {
      const values = currentBucket.values[asset];
      resampledData[asset].push(values[values.length - 1]);
    });
  }
  
  return { data: resampledData, dates: resampledDates };
}

// Process a single block
function processBlock(block: AnalyticsBlock, context: PipelineContext): PipelineContext {
  switch (block.type) {
    case 'data_source': {
      const config = block.config as DataSourceConfig;
      if (config.assets.length === 0) {
        return context;
      }
      
      // Generate mock data (in production, fetch from Supabase)
      const prices = generateMockPrices(config.assets, context.dates);
      
      if (config.sourceType === 'returns') {
        const returns: Record<string, number[]> = {};
        Object.keys(prices).forEach(asset => {
          returns[asset] = calculateReturns(prices[asset]);
        });
        return { ...context, data: returns, assets: config.assets };
      }
      
      return { ...context, data: prices, assets: config.assets };
    }
    
    case 'date_range': {
      const config = block.config as DateRangeConfig;
      const { start, end, dates } = generateDateRange(config);
      return { ...context, dateRange: { start, end }, dates };
    }
    
    case 'transform': {
      const config = block.config as TransformConfig;
      let newContext = { ...context };
      
      if (config.resample) {
        const resampled = resampleData(context.data, context.dates, config.resample);
        newContext = { ...newContext, data: resampled.data, dates: resampled.dates };
      }
      
      if (config.returnType && Object.keys(context.data).length > 0) {
        const returns: Record<string, number[]> = {};
        Object.keys(context.data).forEach(asset => {
          returns[asset] = config.returnType === 'log' 
            ? calculateLogReturns(context.data[asset])
            : calculateReturns(context.data[asset]);
        });
        newContext = { ...newContext, data: returns };
      }
      
      return newContext;
    }
    
    case 'compute': {
      const config = block.config as ComputeConfig;
      
      switch (config.function) {
        case 'price_at_month_end': {
          // Get last value for each asset
          const result: Record<string, { date: string; price: number }> = {};
          context.assets.forEach(asset => {
            const prices = context.data[asset];
            if (prices && prices.length > 0) {
              result[asset] = {
                date: context.dates[context.dates.length - 1],
                price: prices[prices.length - 1],
              };
            }
          });
          return { ...context, computeResult: result };
        }
        
        case 'return_over_period': {
          const result: Record<string, { startPrice: number; endPrice: number; return: number }> = {};
          context.assets.forEach(asset => {
            const prices = context.data[asset];
            if (prices && prices.length > 1) {
              const startPrice = prices[0];
              const endPrice = prices[prices.length - 1];
              result[asset] = {
                startPrice,
                endPrice,
                return: (endPrice - startPrice) / startPrice,
              };
            }
          });
          return { ...context, computeResult: result };
        }
        
        case 'correlation_pair': {
          if (context.assets.length < 2) {
            return { ...context, computeResult: { error: 'Need at least 2 assets' } };
          }
          const asset1 = config.asset1 || context.assets[0];
          const asset2 = config.asset2 || context.assets[1];
          const returns1 = calculateReturns(context.data[asset1] || []);
          const returns2 = calculateReturns(context.data[asset2] || []);
          const corr = calculateCorrelation(returns1, returns2);
          return { 
            ...context, 
            computeResult: { 
              asset1, 
              asset2, 
              correlation: corr,
              dataPoints: Math.min(returns1.length, returns2.length),
            } 
          };
        }
        
        case 'correlation_matrix': {
          const matrix = calculateCorrelationMatrix(context.data, context.assets);
          return { ...context, computeResult: { assets: context.assets, matrix } };
        }
        
        case 'rolling_correlation': {
          if (context.assets.length < 2) {
            return { ...context, computeResult: { error: 'Need at least 2 assets' } };
          }
          const asset1 = config.asset1 || context.assets[0];
          const asset2 = config.asset2 || context.assets[1];
          const window = config.rollingWindow || 90;
          const returns1 = calculateReturns(context.data[asset1] || []);
          const returns2 = calculateReturns(context.data[asset2] || []);
          const rollingCorr = calculateRollingCorrelation(returns1, returns2, window);
          const rollingDates = context.dates.slice(window);
          return { 
            ...context, 
            computeResult: { 
              asset1, 
              asset2, 
              window,
              values: rollingCorr,
              dates: rollingDates,
            } 
          };
        }
        
        default:
          return context;
      }
    }
    
    case 'output':
      // Output block doesn't transform data, just marks how to display
      return context;
    
    default:
      return context;
  }
}

// Validate pipeline before execution
export function validatePipeline(blocks: AnalyticsBlock[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Must have at least data source and output
  const hasDataSource = blocks.some(b => b.type === 'data_source');
  const hasOutput = blocks.some(b => b.type === 'output');
  
  if (!hasDataSource) {
    errors.push('Pipeline requires a Data Source block');
  }
  
  if (!hasOutput) {
    errors.push('Pipeline requires an Output block');
  }
  
  // Check data source has assets
  const dataSource = blocks.find(b => b.type === 'data_source');
  if (dataSource) {
    const config = dataSource.config as DataSourceConfig;
    if (!config.assets || config.assets.length === 0) {
      errors.push('Data Source must have at least one asset selected');
    }
  }
  
  // Check compute block for correlation needs 2 assets
  const computeBlock = blocks.find(b => b.type === 'compute');
  if (computeBlock && dataSource) {
    const computeConfig = computeBlock.config as ComputeConfig;
    const dataConfig = dataSource.config as DataSourceConfig;
    
    if (['correlation_pair', 'rolling_correlation'].includes(computeConfig.function)) {
      if (dataConfig.assets.length < 2) {
        errors.push('Correlation calculations require at least 2 assets');
      }
    }
    
    if (computeConfig.function === 'correlation_matrix') {
      if (dataConfig.assets.length < 2) {
        errors.push('Correlation matrix requires at least 2 assets');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Execute the full pipeline
export function executePipeline(pipeline: AnalyticsPipeline): PipelineResult {
  const validation = validatePipeline(pipeline.blocks);
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join('; '),
      executedAt: new Date().toISOString(),
    };
  }
  
  // Sort blocks by position
  const sortedBlocks = [...pipeline.blocks].sort((a, b) => a.position - b.position);
  
  // Initialize context with default date range
  const defaultDateRange = generateDateRange({ preset: '6M' });
  let context: PipelineContext = {
    data: {},
    dates: defaultDateRange.dates,
    assets: [],
    dateRange: { start: defaultDateRange.start, end: defaultDateRange.end },
  };
  
  // Process date range first if exists
  const dateRangeBlock = sortedBlocks.find(b => b.type === 'date_range');
  if (dateRangeBlock) {
    context = processBlock(dateRangeBlock, context);
  }
  
  // Process remaining blocks in order
  for (const block of sortedBlocks) {
    if (block.type !== 'date_range') {
      context = processBlock(block, context);
    }
  }
  
  // Get output configuration
  const outputBlock = sortedBlocks.find(b => b.type === 'output');
  const outputConfig = outputBlock?.config as OutputConfig | undefined;
  
  // Format result based on output type
  let data: any = context.computeResult || context.data;
  let chartData: any = undefined;
  
  if (outputConfig?.outputType === 'line_chart' && context.computeResult?.values) {
    chartData = context.computeResult.dates.map((date: string, i: number) => ({
      date,
      value: context.computeResult.values[i],
    }));
  } else if (outputConfig?.outputType === 'heatmap' && context.computeResult?.matrix) {
    chartData = {
      labels: context.computeResult.assets,
      matrix: context.computeResult.matrix,
    };
  }
  
  return {
    success: true,
    data,
    chartData,
    outputType: outputConfig?.outputType,
    executedAt: new Date().toISOString(),
  };
}

// Storage keys
const PIPELINES_STORAGE_KEY = 'sufox_analytics_pipelines';

// Load saved pipelines from localStorage
export function loadSavedPipelines(): AnalyticsPipeline[] {
  try {
    const stored = localStorage.getItem(PIPELINES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save pipeline to localStorage
export function savePipeline(pipeline: AnalyticsPipeline): void {
  const pipelines = loadSavedPipelines();
  const existing = pipelines.findIndex(p => p.id === pipeline.id);
  
  if (existing >= 0) {
    pipelines[existing] = pipeline;
  } else {
    pipelines.push(pipeline);
  }
  
  localStorage.setItem(PIPELINES_STORAGE_KEY, JSON.stringify(pipelines));
}

// Delete pipeline from localStorage
export function deletePipeline(pipelineId: string): void {
  const pipelines = loadSavedPipelines();
  const filtered = pipelines.filter(p => p.id !== pipelineId);
  localStorage.setItem(PIPELINES_STORAGE_KEY, JSON.stringify(filtered));
}
