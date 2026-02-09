import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';

const Research = () => {
  return (
    <div className="animate-fade-in">
      <TradingViewTickerTape />
      <div className="mt-2">
        <EconomicIndicators />
      </div>
    </div>
  );
};

export default Research;
