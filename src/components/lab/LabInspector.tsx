import React from 'react';
import { 
  Settings2, 
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AnalyticsBlock, 
  DataSourceConfig,
  DateRangeConfig,
  TransformConfig,
  ComputeConfig,
  OutputConfig,
  ANALYTICS_BLOCK_LIBRARY,
} from '@/types/analyticsLab';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Fallback common assets for when no real data is available
const FALLBACK_ASSETS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
  'BRK.B', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA',
  'SPY', 'QQQ', 'IWM', 'TLT', 'GLD', 'VTI', 'VEA', 'VWO',
];

interface LabInspectorProps {
  selectedBlock: AnalyticsBlock | null;
  onUpdateBlock: (blockId: string, config: any) => void;
  /** Available assets from real database data */
  availableAssets?: string[];
}

export function LabInspector({ selectedBlock, onUpdateBlock, availableAssets = [] }: LabInspectorProps) {
  // Use real assets if available, otherwise fallback
  const assetsToShow = availableAssets.length > 0 ? availableAssets : FALLBACK_ASSETS;
  const hasRealData = availableAssets.length > 0;
  
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
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Function</Label>
          <Select
            value={config.function}
            onValueChange={(value) => 
              onUpdateBlock(selectedBlock.id, { ...config, function: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_at_month_end">Price at Month End</SelectItem>
              <SelectItem value="return_over_period">Return Over Period</SelectItem>
              <SelectItem value="total_return_with_cost_basis">Total Return (Cost Basis)</SelectItem>
              <SelectItem value="cagr">CAGR</SelectItem>
              <SelectItem value="price_statistics">Price Statistics</SelectItem>
              <SelectItem value="volatility">Volatility</SelectItem>
              <SelectItem value="rolling_volatility">Rolling Volatility</SelectItem>
              <SelectItem value="sharpe_ratio">Sharpe Ratio</SelectItem>
              <SelectItem value="sortino_ratio">Sortino Ratio</SelectItem>
              <SelectItem value="beta">Beta (vs Benchmark)</SelectItem>
              <SelectItem value="var_analysis">VaR Analysis</SelectItem>
              <SelectItem value="drawdown_analysis">Drawdown Analysis</SelectItem>
              <SelectItem value="correlation_pair">Correlation (2 Assets)</SelectItem>
              <SelectItem value="correlation_matrix">Correlation Matrix</SelectItem>
              <SelectItem value="rolling_correlation">Rolling Correlation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
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
          <div>
            <Label className="text-xs">Benchmark Asset</Label>
            <Input
              value={config.benchmarkAsset || 'SPY'}
              onChange={(e) => 
                onUpdateBlock(selectedBlock.id, { ...config, benchmarkAsset: e.target.value })
              }
              className="h-8 text-xs mt-1"
              placeholder="SPY, QQQ, etc."
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Asset to compare against (must be in data source)
            </p>
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
      case 'transform':
        return renderTransformConfig();
      case 'compute':
        return renderComputeConfig();
      case 'output':
        return renderOutputConfig();
      default:
        return null;
    }
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
