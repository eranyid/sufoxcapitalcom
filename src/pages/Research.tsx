import { useMemo } from 'react';
import { Search } from 'lucide-react';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';

import { EfficientFrontier } from '@/components/dashboard/EfficientFrontier';
import { MonteCarloSimulation } from '@/components/dashboard/MonteCarloSimulation';
import { RebalanceTool } from '@/components/dashboard/RebalanceTool';
import { BlackLittermanOptimizer } from '@/components/research/BlackLittermanOptimizer';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateAssetMonthlyReturns, calculateCorrelationMatrix } from '@/lib/calculations';

const Research = () => {
  const { performanceMetrics, riskMetrics, settings, transactions, valuations, computedData } = usePortfolio();

  const hasData = riskMetrics !== null && performanceMetrics !== null;

  // Calculate asset-level data for multivariate Monte Carlo
  const assetReturns = useMemo(() => {
    if (transactions.length === 0 || valuations.length === 0) return undefined;
    return calculateAssetMonthlyReturns(transactions, valuations);
  }, [transactions, valuations]);

  const correlationMatrix = useMemo(() => {
    if (transactions.length === 0 || valuations.length === 0) return undefined;
    const result = calculateCorrelationMatrix(transactions, valuations);
    if (result.tickers.length < 2) return undefined;
    return result;
  }, [transactions, valuations]);

  // Build asset weights and names from computed holdings
  const assetWeights = useMemo(() => {
    if (!computedData.holdings || computedData.holdings.length === 0) return undefined;
    const totalValue = computedData.holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const weights: Record<string, number> = {};
    computedData.holdings.forEach(h => {
      weights[h.ticker] = totalValue > 0 ? h.currentValue / totalValue : 0;
    });
    return weights;
  }, [computedData.holdings]);

  const assetNames = useMemo(() => {
    if (!computedData.holdings || computedData.holdings.length === 0) return undefined;
    const names: Record<string, string> = {};
    computedData.holdings.forEach(h => {
      names[h.ticker] = h.name;
    });
    return names;
  }, [computedData.holdings]);

  return (
    <div className="animate-fade-in">
      {/* TradingView Ticker Tape */}
      <TradingViewTickerTape />
      
      {/* Economic Indicators */}
      <div className="mt-2">
        <EconomicIndicators />
      </div>

      
      <div className="section-spacing">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-mono text-foreground tracking-tight">RESEARCH</h1>
        </div>

        {/* Monte Carlo Simulation - Now with multivariate support */}
        {hasData && (
          <MonteCarloSimulation 
            monthlyReturns={performanceMetrics.monthlyReturns.map(m => m.return)} 
            currentValue={performanceMetrics.totalValue}
            portfolioCAGR={performanceMetrics.twr > 0 ? performanceMetrics.twr : undefined}
            portfolioVolatility={riskMetrics.volatility}
            portfolioSharpe={riskMetrics.sharpeRatio}
            riskFreeRate={settings.riskFreeRate}
            // Multivariate simulation data
            assetReturns={assetReturns}
            correlationMatrix={correlationMatrix}
            assetWeights={assetWeights}
            assetNames={assetNames}
          />
        )}

        {/* Efficient Frontier Module */}
        <div className="mt-4">
          <EfficientFrontier />
        </div>

        {/* Black-Litterman Optimizer */}
        <div className="mt-4">
          <BlackLittermanOptimizer />
        </div>

        {/* Rebalance Tool (Unified with Tax Optimization) */}
        <div className="mt-4">
          <RebalanceTool />
        </div>
      </div>
    </div>
  );
};

export default Research;
