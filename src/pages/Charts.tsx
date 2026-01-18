import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart3, 
  RefreshCw, 
  Bookmark,
  Database,
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
        <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium tracking-wide">Charts</span>
            </div>
            <Badge 
              variant={availableAssets.length > 0 ? "default" : "secondary"} 
              className="text-[10px] gap-1"
            >
              <Database className="h-3 w-3" />
              {availableAssets.length} assets
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleSaveView}
            >
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Save View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleReset}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>
        
        {/* Main content */}
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
              {/* Left Panel - Compact Builder */}
              <div className="w-64 border-r border-border/50 bg-card/20 flex flex-col shrink-0">
                <div className="px-3 py-2.5 border-b border-border/30">
                  <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Chart Builder
                  </h2>
                </div>
                <div className="flex-1 overflow-auto">
                  {builderContent}
                </div>
              </div>
              
              {/* Main Panel - Chart Canvas (dominant) */}
              <div className="flex-1 flex flex-col min-w-0 p-4 bg-background">
                {/* Canvas container with Lab-style styling */}
                <div className="flex-1 relative rounded-xl border border-border/40 bg-card/10 overflow-hidden shadow-[0_0_60px_-15px_hsl(var(--primary)/0.15)]">
                  {/* Chart content */}
                  <div className="relative z-10 h-full p-4">
                    <ChartCanvas
                      result={result}
                      state={state}
                      isCalculating={isCalculating}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}