import { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';

const TradingEconomicsWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const embed = document.createElement('div');
    embed.className = 'te-embed';
    embed.setAttribute('data-widget', 'cl-pro');
    embed.setAttribute('data-color-theme', 'Dark');
    containerRef.current.appendChild(embed);

    const script = document.createElement('script');
    script.src = 'https://embed.tradingeconomics.com/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      script.remove();
    };
  }, []);

  return (
    <div className="w-full bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-b border-border">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          TRADING ECONOMICS
        </span>
      </div>
      <div ref={containerRef} style={{ minHeight: 420 }} />
    </div>
  );
};

const Economy = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold tracking-tight text-foreground">ECONOMY</h1>
      </div>

      {/* Ticker Tape */}
      <TradingViewTickerTape />

      {/* FRED Indicators */}
      <EconomicIndicators />

      {/* TradingEconomics Widget */}
      <TradingEconomicsWidget />
    </div>
  );
};

export default Economy;
