import { Search } from 'lucide-react';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';
import { EfficientFrontier } from '@/components/dashboard/EfficientFrontier';
import { MonteCarloSimulation } from '@/components/dashboard/MonteCarloSimulation';
import { RebalanceTool } from '@/components/dashboard/RebalanceTool';
import { usePortfolio } from '@/context/PortfolioContext';

const Research = () => {
  const { performanceMetrics, riskMetrics, settings } = usePortfolio();

  const hasData = riskMetrics !== null && performanceMetrics !== null;

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

        {/* Monte Carlo Simulation */}
        {hasData && (
          <MonteCarloSimulation 
            monthlyReturns={performanceMetrics.monthlyReturns.map(m => m.return)} 
            currentValue={performanceMetrics.totalValue}
            portfolioCAGR={performanceMetrics.twr > 0 ? performanceMetrics.twr : undefined}
            portfolioVolatility={riskMetrics.volatility}
            portfolioSharpe={riskMetrics.sharpeRatio}
            riskFreeRate={settings.riskFreeRate}
          />
        )}

        {/* Efficient Frontier Module */}
        <EfficientFrontier />

        {/* Rebalance Tool (Unified with Tax Optimization) */}
        <div className="mt-4">
          <RebalanceTool />
        </div>
      </div>
    </div>
  );
};

export default Research;
