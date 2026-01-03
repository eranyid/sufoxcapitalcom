import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

interface TradingViewTickerTapeProps {
  label?: string;
}

const TradingViewTickerTape = ({ label = "LIVE MARKETS" }: TradingViewTickerTapeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    // Create and configure the script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    
    // TradingView Ticker Tape configuration
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "AMEX:SPY", title: "SPY" },
        { proName: "NASDAQ:QQQ", title: "QQQ" },
        { proName: "XETR:DBXD", title: "DX5E" },
        { proName: "TASE:TA125", title: "TA-125" },
        { proName: "FX_IDC:USDILS", title: "USD/ILS" },
        { proName: "FX_IDC:EURILS", title: "EUR/ILS" },
        { proName: "INDEX:DXY", title: "DXY" },
        { proName: "AMEX:USO", title: "USO" },
        { proName: "AMEX:VIXY", title: "VIX ETF" },
        { proName: "TVC:GOLD", title: "XAUUSD" }
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
      largeChartUrl: ""
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full bg-card border border-border overflow-hidden">
      {/* Header - matching EconomicIndicators style */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-b border-border">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          {label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">
            Source: TradingView
          </span>
        </div>
      </div>

      {/* Widget Container */}
      <div 
        ref={containerRef} 
        className="w-full overflow-hidden bg-card"
        style={{ minHeight: '48px' }}
      />
      
      {/* Hide TradingView copyright */}
      <style>{`
        .tradingview-widget-copyright {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default TradingViewTickerTape;
