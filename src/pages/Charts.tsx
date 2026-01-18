import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart3, 
  RefreshCw, 
  Save,
  PanelLeftClose,
  PanelLeft,
  Bookmark,
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
  const [isPanelOpen, setIsPanelOpen] = useState(true);
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
    // Only calculate if we have data
    if (transactions.length === 0 && valuations.length === 0) {
      setResult(null);
      return;
    }
    
    // Use all assets if none selected
    const effectiveAssets = state.assets.length > 0 
      ? state.assets 
      : availableAssets.map(a => a.ticker);
    
    // Don't calculate if no assets available
    if (effectiveAssets.length === 0) {
      setResult(null);
      return;
    }
    
    // Debounce calculation
    const timer = setTimeout(() => {
      setIsCalculating(true);
      
      // Small delay for UI feedback
      setTimeout(() => {
        const effectiveState = {
          ...state,
          assets: effectiveAssets,
        };
        
        // TODO: Get benchmark returns from settings
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
  
  // Handle state updates
  const handleStateChange = useCallback((updates: Partial<ChartBuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Reset to defaults
  const handleReset = useCallback(() => {
    setState(getDefaultChartState());
    toast.success('Reset to defaults');
  }, []);
  
  // Save current view (to localStorage)
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
  
  // Builder panel content
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
        {/* Toolbar */}
        <div className="border-b border-border bg-card/50 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Charts</h1>
            </div>
            <Badge variant="secondary" className="text-[10px]">
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
            
            {/* Desktop panel toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
              >
                {isPanelOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile: Sheet drawer */}
          {isMobile ? (
            <>
              <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="fixed bottom-4 left-4 z-50 shadow-lg"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Builder
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  {builderContent}
                </SheetContent>
              </Sheet>
              
              {/* Chart canvas - full width on mobile */}
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
              {/* Desktop: Side panel */}
              {isPanelOpen && (
                <div className="w-72 border-r border-border bg-card/30 shrink-0">
                  {builderContent}
                </div>
              )}
              
              {/* Chart canvas */}
              <div className="flex-1 p-4">
                <ChartCanvas
                  result={result}
                  state={state}
                  isCalculating={isCalculating}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
