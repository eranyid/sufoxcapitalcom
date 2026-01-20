import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart3, 
  RefreshCw, 
  Bookmark,
  Database,
  TrendingUp,
  TrendingDown,
  Percent,
  PieChart,
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
import { PowerBIChartDashboard } from '@/components/charts/PowerBIChartDashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

export default function Charts() {
  const { transactions, valuations, settings, performanceMetrics, riskMetrics } = usePortfolio();
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
  
  const hasData = transactions.length > 0 || valuations.length > 0;
  
  return (
    <>
      <Helmet>
        <title>Charts | SUFOX Capital</title>
      </Helmet>
      
      <div className="h-[calc(100vh-64px)] flex flex-col bg-background">
        {/* Header Bar - Power BI style with yellow accent */}
        <div className="border-b border-border/50 bg-gradient-to-r from-[#F2C811]/10 via-card to-card px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#F2C811]">
                <BarChart3 className="h-4 w-4 text-black" />
              </div>
              <span className="text-sm font-semibold tracking-wide">Analytics Dashboard</span>
            </div>
            <Badge 
              variant="outline" 
              className="text-[10px] gap-1 border-[#F2C811]/30 text-[#F2C811]"
            >
              <Database className="h-3 w-3" />
              {availableAssets.length} assets
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border/50 hover:border-[#F2C811]/50"
              onClick={handleSaveView}
            >
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Save View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border/50 hover:border-[#F2C811]/50"
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
              
              <div className="flex-1 p-4 overflow-auto">
                <PowerBIChartDashboard 
                  transactions={transactions}
                  valuations={valuations}
                  performanceMetrics={performanceMetrics}
                  riskMetrics={riskMetrics}
                  availableAssets={availableAssets}
                />
              </div>
            </>
          ) : (
            <>
              {/* Left Panel - Compact Builder */}
              <div className="w-64 border-r border-border/50 bg-card flex flex-col shrink-0">
                <div className="px-3 py-2.5 border-b border-border/30 bg-[#F2C811]/5">
                  <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#F2C811]">
                    Chart Builder
                  </h2>
                </div>
                <div className="flex-1 overflow-auto">
                  {builderContent}
                </div>
              </div>
              
              {/* Main Panel - Power BI Dashboard Style */}
              <div className="flex-1 flex flex-col min-w-0 p-4 bg-[#F3F2F1] dark:bg-background overflow-auto">
                <PowerBIChartDashboard 
                  transactions={transactions}
                  valuations={valuations}
                  performanceMetrics={performanceMetrics}
                  riskMetrics={riskMetrics}
                  availableAssets={availableAssets}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
