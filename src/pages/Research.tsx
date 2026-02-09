import { useNavigate } from 'react-router-dom';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';
import TradingViewStockHeatmap from '@/components/dashboard/TradingViewStockHeatmap';
import TradingViewEconomicCalendar from '@/components/dashboard/TradingViewEconomicCalendar';
import { FundamentalsIcon } from '@/components/icons/FundamentalsIcon';
import { Button } from '@/components/ui/button';

const Research = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/market')}
          className="gap-2"
        >
          <FundamentalsIcon size={16} />
          Fundamentals
        </Button>
      </div>
      <TradingViewTickerTape />
      <div className="mt-2">
        <EconomicIndicators />
      </div>
      <div className="mt-4 section-spacing">
        <h2 className="text-lg font-mono text-foreground tracking-tight mb-3">UPCOMING ECONOMIC EVENTS</h2>
        <div className="rounded border border-border overflow-hidden">
          <TradingViewEconomicCalendar height={700} />
        </div>
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
