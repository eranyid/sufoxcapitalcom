import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';
import TradingViewStockHeatmap from '@/components/dashboard/TradingViewStockHeatmap';
import TradingViewEconomicCalendar from '@/components/dashboard/TradingViewEconomicCalendar';

const Research = () => {
  return (
    <div className="animate-fade-in">
      <TradingViewTickerTape />
      <div className="mt-2">
        <EconomicIndicators />
      </div>
      <div className="mt-4 section-spacing">
        <div className="w-full bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-b border-border">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">STOCK HEATMAP</span>
          </div>
          <TradingViewStockHeatmap />
        </div>
      </div>
      <div className="mt-4 section-spacing">
        <div className="w-full bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-b border-border">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">UPCOMING ECONOMIC EVENTS</span>
          </div>
          <TradingViewEconomicCalendar height={1000} />
        </div>
      </div>
    </div>
  );
};

export default Research;
