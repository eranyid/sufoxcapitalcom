import { Search } from 'lucide-react';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import { SectorMap } from '@/components/dashboard/SectorMap';

const Research = () => {
  return (
    <div className="animate-fade-in">
      {/* TradingView Ticker Tape */}
      <TradingViewTickerTape />
      
      <div className="section-spacing">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-mono text-foreground tracking-tight">RESEARCH</h1>
        </div>

        {/* Sector Map Card */}
        <div className="mt-6">
          <SectorMap />
        </div>
      </div>
    </div>
  );
};

export default Research;
