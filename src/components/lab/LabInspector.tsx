import React from 'react';
import { 
  Settings2, 
  Check,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AnalyticsBlock, 
  DataSourceConfig,
  DateRangeConfig,
  TransformConfig,
  ComputeConfig,
  OutputConfig,
  FilterConfig,
  AggregateConfig,
  CompareConfig,
  ComputeFunction,
  ANALYTICS_BLOCK_LIBRARY,
} from '@/types/analyticsLab';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  COMPUTE_FUNCTION_REQUIREMENTS,
  isComputeFunctionValid,
  getComputeFunctionValidationMessage,
  getSelectedAssets,
  getRecommendedOutput,
} from '@/lib/pipelineValidation';

// Fallback common assets for when no real data is available
const FALLBACK_ASSETS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
  'BRK.B', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA',
  'SPY', 'QQQ', 'IWM', 'TLT', 'GLD', 'VTI', 'VEA', 'VWO',
];

// Define which compute functions are available for each data source type
const COMPUTE_FUNCTIONS_BY_SOURCE: Record<string, { value: ComputeFunction; label: string; description?: string }[]> = {
  prices: [
    { value: 'price_at_month_end', label: 'Price at Month End', description: 'Last available price in period' },
    { value: 'price_statistics', label: 'Price Statistics', description: 'Min, max, mean, median, std dev' },
    { value: 'return_over_period', label: 'Return Over Period', description: 'Start to end price change' },
    { value: 'cagr', label: 'CAGR', description: 'Compound annual growth rate' },
    { value: 'total_return_with_cost_basis', label: 'Total Return (Cost Basis)', description: 'P&L vs cost basis' },
    { value: 'drawdown_analysis', label: 'Drawdown Analysis', description: 'Max drawdown & recovery periods' },
    { value: 'max_drawdown', label: 'Max Drawdown', description: 'Maximum peak-to-trough decline' },
    { value: 'volatility', label: 'Volatility', description: 'Annualized price volatility' },
    { value: 'rolling_volatility', label: 'Rolling Volatility', description: 'Rolling window volatility chart' },
  ],
  returns: [
    { value: 'return_over_period', label: 'Cumulative Return', description: 'Sum of returns over period' },
    { value: 'volatility', label: 'Volatility', description: 'Annualized return volatility' },
    { value: 'rolling_volatility', label: 'Rolling Volatility', description: 'Rolling window volatility chart' },
    { value: 'sharpe_ratio', label: 'Sharpe Ratio', description: 'Risk-adjusted return (vs risk-free)' },
    { value: 'sortino_ratio', label: 'Sortino Ratio', description: 'Downside risk-adjusted return' },
    { value: 'calmar_ratio', label: 'Calmar Ratio', description: 'Return / Max Drawdown' },
    { value: 'var_analysis', label: 'VaR Analysis', description: 'Value at Risk 95/99 & CVaR' },
    { value: 'cvar_analysis', label: 'CVaR (Expected Shortfall)', description: 'Conditional VaR' },
    { value: 'skewness', label: 'Skewness', description: 'Distribution asymmetry' },
    { value: 'kurtosis', label: 'Kurtosis', description: 'Distribution tail heaviness' },
    { value: 'histogram', label: 'Return Histogram', description: 'Distribution visualization' },
    { value: 'beta', label: 'Beta (vs Benchmark)', description: 'Market sensitivity coefficient' },
    { value: 'alpha', label: 'Alpha (vs Benchmark)', description: 'Excess return over benchmark' },
    { value: 'information_ratio', label: 'Information Ratio', description: 'Active return / tracking error' },
    { value: 'correlation_pair', label: 'Correlation (2 Assets)', description: 'Pearson correlation coefficient' },
    { value: 'correlation_matrix', label: 'Correlation Matrix', description: 'Full pairwise correlation heatmap' },
    { value: 'rolling_correlation', label: 'Rolling Correlation', description: 'Time-varying correlation chart' },
  ],
  transactions: [
    { value: 'total_return_with_cost_basis', label: 'Total Return (Cost Basis)', description: 'P&L vs cost basis' },
    { value: 'contribution_to_return', label: 'Contribution to Return', description: 'Asset contribution analysis' },
  ],
  holdings: [
    { value: 'contribution_to_return', label: 'Contribution to Return', description: 'Asset contribution analysis' },
    { value: 'sector_attribution', label: 'Sector Attribution', description: 'Performance by sector' },
    { value: 'currency_attribution', label: 'Currency Attribution', description: 'Performance by currency' },
  ],
};

// All compute functions for fallback
const ALL_COMPUTE_FUNCTIONS: { value: ComputeFunction; label: string }[] = [
  { value: 'price_at_month_end', label: 'Price at Month End' },
  { value: 'price_statistics', label: 'Price Statistics' },
  { value: 'return_over_period', label: 'Return Over Period' },
  { value: 'cagr', label: 'CAGR' },
  { value: 'total_return_with_cost_basis', label: 'Total Return (Cost Basis)' },
  { value: 'drawdown_analysis', label: 'Drawdown Analysis' },
  { value: 'max_drawdown', label: 'Max Drawdown' },
  { value: 'volatility', label: 'Volatility' },
  { value: 'rolling_volatility', label: 'Rolling Volatility' },
  { value: 'sharpe_ratio', label: 'Sharpe Ratio' },
  { value: 'sortino_ratio', label: 'Sortino Ratio' },
  { value: 'calmar_ratio', label: 'Calmar Ratio' },
  { value: 'var_analysis', label: 'VaR Analysis' },
  { value: 'cvar_analysis', label: 'CVaR (Expected Shortfall)' },
  { value: 'skewness', label: 'Skewness' },
  { value: 'kurtosis', label: 'Kurtosis' },
  { value: 'histogram', label: 'Return Histogram' },
  { value: 'beta', label: 'Beta (vs Benchmark)' },
  { value: 'alpha', label: 'Alpha (vs Benchmark)' },
  { value: 'information_ratio', label: 'Information Ratio' },
  { value: 'correlation_pair', label: 'Correlation (2 Assets)' },
  { value: 'correlation_matrix', label: 'Correlation Matrix' },
  { value: 'rolling_correlation', label: 'Rolling Correlation' },
  { value: 'contribution_to_return', label: 'Contribution to Return' },
  { value: 'sector_attribution', label: 'Sector Attribution' },
  { value: 'currency_attribution', label: 'Currency Attribution' },
];

interface LabInspectorProps {
  selectedBlock: AnalyticsBlock | null;
  onUpdateBlock: (blockId: string, config: any) => void;
  /** Available assets from real database data */
  availableAssets?: string[];
  /** All blocks in the pipeline to determine data source type */
  pipelineBlocks?: AnalyticsBlock[];
}

export function LabInspector({ selectedBlock, onUpdateBlock, availableAssets = [], pipelineBlocks = [] }: LabInspectorProps) {
  // Use real assets if available, otherwise fallback
  const assetsToShow = availableAssets.length > 0 ? availableAssets : FALLBACK_ASSETS;
  const hasRealData = availableAssets.length > 0;
  
  // Determine the data source type from the pipeline
  const dataSourceBlock = pipelineBlocks.find(b => b.type === 'data_source');
  const dataSourceType = (dataSourceBlock?.config as DataSourceConfig | undefined)?.sourceType;
  
  // Get selected assets count from the pipeline
  const selectedAssets = getSelectedAssets(pipelineBlocks);
  const assetCount = selectedAssets.length;
  
  // Get available compute functions based on data source AND filter by asset count validity
  const baseComputeFunctions = dataSourceType 
    ? COMPUTE_FUNCTIONS_BY_SOURCE[dataSourceType] || ALL_COMPUTE_FUNCTIONS
    : ALL_COMPUTE_FUNCTIONS;
  
  if (!selectedBlock) {
    return (
      <div className="h-full flex flex-col bg-card/50 border-l border-border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Inspector
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Settings2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Select a block to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  const blockMeta = ANALYTICS_BLOCK_LIBRARY.find(b => b.type === selectedBlock.type);

  const renderDataSourceConfig = () => {
    const config = selectedBlock.config as DataSourceConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Data Type</Label>
          <Select
            value={config.sourceType}
            onValueChange={(value) => 
              onUpdateBlock(selectedBlock.id, { ...config, sourceType: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prices">Prices</SelectItem>
              <SelectItem value="returns">Returns</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Assets</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {config.assets.map((asset) => (
              <Badge 
                key={asset} 
                variant="secondary" 
                className="text-[10px] cursor-pointer hover:bg-destructive/20 hover:text-destructive"
                onClick={() => {
                  onUpdateBlock(selectedBlock.id, {
                    ...config,
                    assets: config.assets.filter(a => a !== asset),
                  });
                }}
              >
                {asset} <X className="h-2.5 w-2.5 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="mt-2">
            {hasRealData && (
              <p className="text-[10px] text-primary mb-1.5">From your portfolio:</p>
            )}
            <div className="flex flex-wrap gap-1">
              {assetsToShow.filter(a => !config.assets.includes(a)).slice(0, 15).map((asset) => (
                <button
                  key={asset}
                  onClick={() => {
                    onUpdateBlock(selectedBlock.id, {
                      ...config,
                      assets: [...config.assets, asset],
                    });
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-border hover:border-primary hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  + {asset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDateRangeConfig = () => {
    const config = selectedBlock.config as DateRangeConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Preset</Label>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {['1M', '3M', '6M', '12M', 'YTD'].map((preset) => (
              <button
                key={preset}
                onClick={() => 
                  onUpdateBlock(selectedBlock.id, { ...config, preset, customStart: undefined, customEnd: undefined })
                }
                className={cn(
                  "text-xs py-1.5 rounded border transition-colors",
                  config.preset === preset
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary hover:bg-primary/10"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground">Or custom range</Label>
          <div className="mt-2 space-y-2">
            <div>
              <Label className="text-[10px]">Start</Label>
              <Input
                type="date"
                value={config.customStart || ''}
                onChange={(e) => 
                  onUpdateBlock(selectedBlock.id, { ...config, preset: undefined, customStart: e.target.value })
                }
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px]">End</Label>
              <Input
                type="date"
                value={config.customEnd || ''}
                onChange={(e) => 
                  onUpdateBlock(selectedBlock.id, { ...config, preset: undefined, customEnd: e.target.value })
                }
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransformConfig = () => {
    const config = selectedBlock.config as TransformConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Resample</Label>
          <Select
            value={config.resample || 'daily'}
            onValueChange={(value) => 
              onUpdateBlock(selectedBlock.id, { ...config, resample: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Return Type</Label>
          <Select
            value={config.returnType || 'simple'}
            onValueChange={(value) => 
              onUpdateBlock(selectedBlock.id, { ...config, returnType: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="log">Log</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">FX Mode</Label>
          <Select
            value={config.fxMode || 'nominal'}
            onValueChange={(value) => 
              onUpdateBlock(selectedBlock.id, { ...config, fxMode: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nominal">Nominal</SelectItem>
              <SelectItem value="real">Real (FX-adjusted)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderComputeConfig = () => {
    const config = selectedBlock.config as ComputeConfig;
    
    // Filter functions by asset count validity and mark invalid ones
    const functionsWithValidity = baseComputeFunctions.map(func => ({
      ...func,
      isValid: isComputeFunctionValid(func.value, assetCount),
      validationMessage: getComputeFunctionValidationMessage(func.value, assetCount),
    }));
    
    // Separate valid and invalid functions
    const validFunctions = functionsWithValidity.filter(f => f.isValid);
    const invalidFunctions = functionsWithValidity.filter(f => !f.isValid);
    
    // Check if current function is valid
    const currentFunctionValid = isComputeFunctionValid(config.function, assetCount);
    const currentValidationMessage = getComputeFunctionValidationMessage(config.function, assetCount);
    
    return (
      <div className="space-y-4">
        {!dataSourceType && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
            <p className="text-[10px] text-amber-400">
              Add a Data Source block to see relevant functions
            </p>
          </div>
        )}
        
        {/* Asset count indicator */}
        {assetCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">
              {assetCount} asset{assetCount !== 1 ? 's' : ''} selected • {validFunctions.length} compatible functions
            </p>
          </div>
        )}
        
        {/* Show warning if current function is invalid */}
        {!currentFunctionValid && currentValidationMessage && (
          <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
            <p className="text-[10px] text-destructive">
              {currentValidationMessage}
            </p>
          </div>
        )}
        
        <div>
          <Label className="text-xs">Function</Label>
          <Select
            value={config.function}
            onValueChange={(value) => {
              const fn = value as ComputeFunction;
              const recommendedOutput = getRecommendedOutput(fn);
              
              // Auto-set asset1/asset2 for pair functions if exactly 2 assets
              let updates: Partial<ComputeConfig> = { function: fn };
              if (assetCount === 2 && COMPUTE_FUNCTION_REQUIREMENTS[fn]?.requiresSpecificAssets) {
                updates.asset1 = selectedAssets[0];
                updates.asset2 = selectedAssets[1];
              }
              
              onUpdateBlock(selectedBlock.id, { ...config, ...updates });
              
              // Also update output block if exists
              const outputBlock = pipelineBlocks.find(b => b.type === 'output');
              if (outputBlock) {
                const outputConfig = outputBlock.config as OutputConfig;
                if (outputConfig.outputType !== recommendedOutput) {
                  onUpdateBlock(outputBlock.id, { ...outputConfig, outputType: recommendedOutput });
                }
              }
            }}
          >
            <SelectTrigger className={cn(
              "mt-1",
              !currentFunctionValid && "border-destructive"
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Valid functions first */}
              {validFunctions.length > 0 && (
                <>
                  {validFunctions.map((func) => (
                    <SelectItem key={func.value} value={func.value}>
                      <div className="flex items-center gap-2">
                        <span>{func.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {/* Separator and invalid functions */}
              {invalidFunctions.length > 0 && validFunctions.length > 0 && (
                <div className="px-2 py-1.5 border-t border-border mt-1">
                  <p className="text-[10px] text-muted-foreground">Requires different asset count:</p>
                </div>
              )}
              
              {invalidFunctions.map((func) => (
                <SelectItem 
                  key={func.value} 
                  value={func.value} 
                  disabled
                  className="opacity-50"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <span>{func.label}</span>
                          <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {func.validationMessage}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dataSourceType && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {validFunctions.length} of {baseComputeFunctions.length} functions available for {assetCount} asset{assetCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {/* Asset selection for pair functions (correlation_pair, rolling_correlation) */}
        {(config.function === 'correlation_pair' || config.function === 'rolling_correlation') && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-medium">Select 2 assets to compare</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Asset 1</Label>
                <Select
                  value={config.asset1 || ''}
                  onValueChange={(value) => 
                    onUpdateBlock(selectedBlock.id, { ...config, asset1: value })
                  }
                >
                  <SelectTrigger className={cn(
                    "mt-1 h-8 text-xs",
                    !config.asset1 && "border-amber-500/50"
                  )}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAssets.filter(a => a !== config.asset2).map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-[10px] text-muted-foreground">Asset 2</Label>
                <Select
                  value={config.asset2 || ''}
                  onValueChange={(value) => 
                    onUpdateBlock(selectedBlock.id, { ...config, asset2: value })
                  }
                >
                  <SelectTrigger className={cn(
                    "mt-1 h-8 text-xs",
                    !config.asset2 && "border-amber-500/50"
                  )}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAssets.filter(a => a !== config.asset1).map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {config.asset1 && config.asset2 && (
              <p className="text-[10px] text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {config.asset1} ↔ {config.asset2}
              </p>
            )}
          </div>
        )}
        
        {(config.function === 'rolling_correlation' || config.function === 'rolling_volatility') && (
          <div>
            <Label className="text-xs">Rolling Window (days)</Label>
            <Input
              type="number"
              value={config.rollingWindow || (config.function === 'rolling_volatility' ? 30 : 90)}
              onChange={(e) => 
                onUpdateBlock(selectedBlock.id, { ...config, rollingWindow: parseInt(e.target.value) })
              }
              className="h-8 text-xs mt-1"
              min={7}
              max={365}
            />
          </div>
        )}
        
        {(config.function === 'sharpe_ratio' || config.function === 'sortino_ratio') && (
          <div>
            <Label className="text-xs">Risk-Free Rate (%)</Label>
            <Input
              type="number"
              value={(config.riskFreeRate ?? 0.04) * 100}
              onChange={(e) => 
                onUpdateBlock(selectedBlock.id, { ...config, riskFreeRate: parseFloat(e.target.value) / 100 })
              }
              className="h-8 text-xs mt-1"
              step={0.1}
              min={0}
              max={20}
            />
          </div>
        )}
        
        {config.function === 'beta' && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-medium">Select asset and benchmark</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Asset</Label>
                <Select
                  value={config.asset1 || ''}
                  onValueChange={(value) => 
                    onUpdateBlock(selectedBlock.id, { ...config, asset1: value })
                  }
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAssets.filter(a => a !== config.benchmarkAsset).map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-[10px] text-muted-foreground">Benchmark</Label>
                <Select
                  value={config.benchmarkAsset || ''}
                  onValueChange={(value) => 
                    onUpdateBlock(selectedBlock.id, { ...config, benchmarkAsset: value })
                  }
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAssets.filter(a => a !== config.asset1).map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        
        {config.function === 'var_analysis' && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-[10px] text-muted-foreground">
              Calculates Value at Risk (95% & 99%), Conditional VaR, and worst day analysis.
            </p>
          </div>
        )}
        
        {config.function === 'total_return_with_cost_basis' && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-[10px] text-muted-foreground">
              Calculates total return using cost basis from your transaction history.
            </p>
          </div>
        )}
        
        {config.function === 'drawdown_analysis' && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-[10px] text-muted-foreground">
              Calculates maximum drawdown, recovery periods, and current drawdown from price data.
            </p>
          </div>
        )}
        
        {config.function === 'cagr' && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-[10px] text-muted-foreground">
              Compound Annual Growth Rate over the selected period.
            </p>
          </div>
        )}
        
        {config.function === 'price_statistics' && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-[10px] text-muted-foreground">
              Min, max, mean, median, standard deviation, and current vs average.
            </p>
          </div>
        )}
        
        {config.function === 'sortino_ratio' && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-[10px] text-muted-foreground">
              Like Sharpe but uses only downside deviation (negative returns).
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderOutputConfig = () => {
    const config = selectedBlock.config as OutputConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Output Type</Label>
          <Select
            value={config.outputType}
            onValueChange={(value) => 
              onUpdateBlock(selectedBlock.id, { ...config, outputType: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="line_chart">Line Chart</SelectItem>
              <SelectItem value="heatmap">Heatmap</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Title (optional)</Label>
          <Input
            value={config.title || ''}
            onChange={(e) => 
              onUpdateBlock(selectedBlock.id, { ...config, title: e.target.value })
            }
            placeholder="Result title..."
            className="h-8 text-xs mt-1"
          />
        </div>
      </div>
    );
  };

  const renderConfig = () => {
    switch (selectedBlock.type) {
      case 'data_source':
        return renderDataSourceConfig();
      case 'date_range':
        return renderDateRangeConfig();
      case 'filter':
        return renderFilterConfig();
      case 'transform':
        return renderTransformConfig();
      case 'aggregate':
        return renderAggregateConfig();
      case 'compute':
        return renderComputeConfig();
      case 'compare':
        return renderCompareConfig();
      case 'output':
        return renderOutputConfig();
      default:
        return <p className="text-xs text-muted-foreground">No configuration available</p>;
    }
  };
  
  const renderFilterConfig = () => {
    const config = selectedBlock.config as FilterConfig;
    return (
      <div className="space-y-4">
        <div className="p-2 bg-muted/50 rounded-md">
          <p className="text-[10px] text-muted-foreground">
            Filter data by specific conditions. Select field, operator, and value.
          </p>
        </div>
        <div>
          <Label className="text-xs">Field</Label>
          <Select value={config.field || 'ticker'} onValueChange={(v) => onUpdateBlock(selectedBlock.id, { ...config, field: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ticker">Ticker</SelectItem>
              <SelectItem value="asset_type">Asset Type</SelectItem>
              <SelectItem value="geography">Geography</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderAggregateConfig = () => {
    const config = selectedBlock.config as AggregateConfig;
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Aggregate Function</Label>
          <Select value={config.function || 'mean'} onValueChange={(v) => onUpdateBlock(selectedBlock.id, { ...config, function: v as any })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="mean">Mean</SelectItem>
              <SelectItem value="median">Median</SelectItem>
              <SelectItem value="min">Min</SelectItem>
              <SelectItem value="max">Max</SelectItem>
              <SelectItem value="std">Std Dev</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Group By</Label>
          <Select value={config.groupBy || 'asset'} onValueChange={(v) => onUpdateBlock(selectedBlock.id, { ...config, groupBy: v as any })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="sector">Sector</SelectItem>
              <SelectItem value="geography">Geography</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderCompareConfig = () => {
    const config = selectedBlock.config as CompareConfig;
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Compare Mode</Label>
          <Select value={config.mode || 'vs_benchmark'} onValueChange={(v) => onUpdateBlock(selectedBlock.id, { ...config, mode: v as any })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vs_benchmark">vs Benchmark</SelectItem>
              <SelectItem value="vs_period">vs Previous Period</SelectItem>
              <SelectItem value="rank">Rank Assets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {config.mode === 'vs_benchmark' && (
          <div>
            <Label className="text-xs">Benchmark</Label>
            <Select value={config.benchmark || 'SPY'} onValueChange={(v) => onUpdateBlock(selectedBlock.id, { ...config, benchmark: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SPY">S&P 500 (SPY)</SelectItem>
                <SelectItem value="QQQ">Nasdaq 100 (QQQ)</SelectItem>
                <SelectItem value="IWM">Russell 2000 (IWM)</SelectItem>
                <SelectItem value="AGG">US Bonds (AGG)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card/50 border-l border-border">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-md"
            style={{ backgroundColor: `${blockMeta?.color || 'hsl(var(--primary))'}20` }}
          >
            <Settings2 
              className="h-3.5 w-3.5" 
              style={{ color: blockMeta?.color || 'hsl(var(--primary))' }} 
            />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {blockMeta?.label || selectedBlock.type}
          </h3>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderConfig()}
        </div>
      </ScrollArea>
    </div>
  );
}
