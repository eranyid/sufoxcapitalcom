import { Search } from 'lucide-react';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';

const Research = () => {
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
      </div>
    </div>
  );
};

export default Research;
