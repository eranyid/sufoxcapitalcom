import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';
import TradingViewStockHeatmap from '@/components/dashboard/TradingViewStockHeatmap';

const Research = () => {
  return (
    <div className="animate-fade-in">
      <TradingViewTickerTape />
      <div className="mt-2">
        <EconomicIndicators />
      </div>
      <div className="mt-4 section-spacing">
        <h2 className="text-lg font-mono text-foreground tracking-tight mb-3">STOCK HEATMAP</h2>
        <div className="rounded border border-border overflow-hidden">
          <TradingViewStockHeatmap />
        </div>
      </div>
    </div>
  );
};

export default Research;
