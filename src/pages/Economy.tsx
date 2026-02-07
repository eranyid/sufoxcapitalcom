import { useRef, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, Globe } from 'lucide-react';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import EconomicIndicators from '@/components/dashboard/EconomicIndicators';

// Shared script loader - ensures widget.js is loaded once
let scriptLoaded = false;
const loadTEScript = () => {
  if (scriptLoaded) return;
  scriptLoaded = true;
  const script = document.createElement('script');
  script.src = 'https://embed.tradingeconomics.com/widget.js';
  script.async = true;
  document.body.appendChild(script);
};

interface TEWidgetBlockProps {
  title: string;
  icon: React.ReactNode;
  minHeight?: number;
  attrs: Record<string, string>;
}

const TEWidgetBlock = ({ title, icon, minHeight = 420, attrs }: TEWidgetBlockProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const embed = document.createElement('div');
    embed.className = 'te-embed';
    Object.entries(attrs).forEach(([key, value]) => {
      embed.setAttribute(`data-${key}`, value);
    });
    containerRef.current.appendChild(embed);

    // Reload widget script to pick up new embeds
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
        {icon}
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div ref={containerRef} style={{ minHeight }} />
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

      {/* SPX Market Index */}
      <TEWidgetBlock
        title="US500 MARKET INDEX"
        icon={<TrendingUp className="h-3.5 w-3.5 text-primary" />}
        attrs={{
          widget: 'tm-pro',
          index: 'SPX:IND',
          'index-full-name': 'United States Stock Market Index (US500)',
        }}
      />

      {/* TradingEconomics Calendar */}
      <TEWidgetBlock
        title="TRADING ECONOMICS"
        icon={<Globe className="h-3.5 w-3.5 text-primary" />}
        attrs={{
          widget: 'cl-pro',
          'color-theme': 'Dark',
        }}
      />
    </div>
  );
};

export default Economy;
