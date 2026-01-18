import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart3, 
  RefreshCw, 
  Bookmark,
  Download,
  FileText,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/context/PortfolioContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ChartBuilderState, 
  getDefaultChartState,
} from '@/types/chartBuilder';
import { calculateChartData, ChartResult } from '@/lib/chartCalculations';
import { ChartBuilderPanel } from '@/components/charts/ChartBuilderPanel';
import { ChartCanvas } from '@/components/charts/ChartCanvas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

export default function Charts() {
  const { transactions, valuations, settings } = usePortfolio();
  const isMobile = useIsMobile();
  
  const [state, setState] = useState<ChartBuilderState>(getDefaultChartState);
  const [result, setResult] = useState<ChartResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Get available assets from transactions
  const availableAssets = useMemo(() => {
    const assetMap = new Map<string, string>();
    transactions.forEach(tx => {
      if (!assetMap.has(tx.ticker)) {
        assetMap.set(tx.ticker, tx.assetName);
      }
    });
    return Array.from(assetMap.entries()).map(([ticker, name]) => ({ ticker, name }));
  }, [transactions]);
  
  // Calculate chart data when state changes
  useEffect(() => {
    if (transactions.length === 0 && valuations.length === 0) {
      setResult(null);
      return;
    }
    
    const effectiveAssets = state.assets.length > 0 
      ? state.assets 
      : availableAssets.map(a => a.ticker);
    
    if (effectiveAssets.length === 0) {
      setResult(null);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsCalculating(true);
      
      setTimeout(() => {
        const effectiveState = {
          ...state,
          assets: effectiveAssets,
        };
        
        const benchmarkReturns = settings.benchmarkReturns 
          ? Object.values(settings.benchmarkReturns).map(v => Number(v))
          : undefined;
        
        const calculatedResult = calculateChartData(
          effectiveState,
          transactions,
          valuations,
          benchmarkReturns
        );
        
        setResult(calculatedResult);
        setIsCalculating(false);
      }, 100);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [state, transactions, valuations, availableAssets, settings.benchmarkReturns]);
  
  const handleStateChange = useCallback((updates: Partial<ChartBuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const handleReset = useCallback(() => {
    setState(getDefaultChartState());
    toast.success('Reset to defaults');
  }, []);
  
  const handleSaveView = useCallback(() => {
    try {
      const savedViews = JSON.parse(localStorage.getItem('chart-saved-views') || '[]');
      const newView = {
        id: crypto.randomUUID(),
        name: `${state.metric} - ${new Date().toLocaleDateString()}`,
        state,
        createdAt: new Date().toISOString(),
      };
      savedViews.push(newView);
      localStorage.setItem('chart-saved-views', JSON.stringify(savedViews));
      toast.success('View saved');
    } catch (error) {
      toast.error('Failed to save view');
    }
  }, [state]);
  
  const builderContent = (
    <ChartBuilderPanel
      state={state}
      onChange={handleStateChange}
      availableAssets={availableAssets}
      onReset={handleReset}
    />
  );
  
  return (
    <>
      <Helmet>
        <title>Charts | SUFOX Capital</title>
      </Helmet>
      
      <div className="h-[calc(100vh-64px)] flex flex-col bg-background">
        {/* Toolbar - matching Lab style */}
        <div className="border-b border-border bg-card/50 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Charts</span>
            </div>
            <Badge 
              variant={availableAssets.length > 0 ? "default" : "secondary"} 
              className="text-[10px] gap-1"
            >
              {availableAssets.length} assets
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleSaveView}
            >
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Save View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleReset}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>
        
        {/* Main content - 2 panel layout */}
        <div className="flex-1 flex overflow-hidden">
          {isMobile ? (
            <>
              <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="fixed bottom-20 left-4 z-50 shadow-lg"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Builder
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  {builderContent}
                </SheetContent>
              </Sheet>
              
              <div className="flex-1 p-4">
                <ChartCanvas
                  result={result}
                  state={state}
                  isCalculating={isCalculating}
                />
              </div>
            </>
          ) : (
            <>
              {/* Main Panel - Chart Canvas (expanded) */}
              <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
                <div className="px-4 py-3 border-b border-border/50 bg-card/30">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Chart Canvas
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Visualize your portfolio data
                  </p>
                </div>
                <div className="flex-1 p-6 overflow-auto">
                  <ChartCanvas
                    result={result}
                    state={state}
                    isCalculating={isCalculating}
                  />
                </div>
              </div>
              
              {/* Right Panel - Builder & Export */}
              <div className="w-72 border-l border-border bg-card/30 flex flex-col shrink-0">
                <div className="px-4 py-3 border-b border-border/50">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Chart Builder
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Configure chart parameters
                  </p>
                </div>
                <div className="flex-1 overflow-auto">
                  {builderContent}
                </div>
                
                {/* Export section */}
                <div className="border-t border-border/50 p-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Export
                  </h3>
                  {result ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 justify-start text-xs"
                        onClick={() => toast.info('PNG export coming soon')}
                      >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Export as PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 justify-start text-xs"
                        onClick={() => toast.info('PDF export coming soon')}
                      >
                        <FileText className="h-3.5 w-3.5 mr-2" />
                        Export as PDF
                      </Button>
                      
                      {/* Chart info */}
                      <div className="pt-3 mt-3 border-t border-border/30 space-y-1.5 text-[10px]">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Type</span>
                          <span className="font-mono text-foreground">{result.dataType}</span>
                        </div>
                        {result.metadata && (
                          <>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Assets</span>
                              <span className="font-mono text-foreground">{result.metadata.assetsWithData.length}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Period</span>
                              <span className="font-mono text-foreground">{result.metadata.dateRange.start} → {result.metadata.dateRange.end}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Configure chart to export</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
