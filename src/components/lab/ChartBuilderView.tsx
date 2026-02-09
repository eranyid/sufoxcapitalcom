import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Bookmark,
  Database,
} from 'lucide-react';
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

export function ChartBuilderView() {
  const { transactions, valuations, settings } = usePortfolio();
  const isMobile = useIsMobile();
  
  const [state, setState] = useState<ChartBuilderState>(getDefaultChartState);
  const [result, setResult] = useState<ChartResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const availableAssets = useMemo(() => {
    const assetMap = new Map<string, string>();
    transactions.forEach(tx => {
      if (!assetMap.has(tx.ticker)) {
        assetMap.set(tx.ticker, tx.assetName);
      }
    });
    return Array.from(assetMap.entries()).map(([ticker, name]) => ({ ticker, name }));
  }, [transactions]);
  
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
    <div className="flex-1 flex overflow-hidden">
      {isMobile ? (
        <>
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="fixed bottom-20 left-4 z-50 shadow-lg bg-[#F2C811] hover:bg-[#F2C811]/90 text-black"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Builder
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              {builderContent}
            </SheetContent>
          </Sheet>
          
          <div className="flex-1 p-4 overflow-auto bg-[#1e1e1e]">
            <div className="h-full bg-card rounded-lg border border-border/50 shadow-xl p-4">
              <ChartCanvas 
                result={result}
                state={state}
                isCalculating={isCalculating}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-72 border-r border-border/50 bg-card flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-border/30 bg-primary/5 flex items-center justify-between">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Chart Builder
              </h2>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline" 
                  className="text-[9px] gap-1 border-primary/30 text-primary"
                >
                  <Database className="h-2.5 w-2.5" />
                  {availableAssets.length}
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {builderContent}
            </div>
            <div className="border-t border-border/30 p-2 flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] flex-1"
                onClick={handleSaveView}
              >
                <Bookmark className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] flex-1"
                onClick={handleReset}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-w-0 p-6 bg-[#1e1e1e] dark:bg-[#1e1e1e] overflow-auto">
            <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-2xl p-6 min-h-[500px]">
              <ChartCanvas 
                result={result}
                state={state}
                isCalculating={isCalculating}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
