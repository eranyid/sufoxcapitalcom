import { useEffect, useRef } from 'react';

interface TradingViewTickerTapeProps {
  label?: string;
}

const TradingViewTickerTape = ({ label = "RESEARCH MARKETS" }: TradingViewTickerTapeProps) => {
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
        { proName: "TVC:DXY", title: "DXY" },
        { proName: "AMEX:USO", title: "USO" },
        { proName: "TVC:VIX", title: "VIX" },
        { proName: "TVC:GOLD", title: "XAUUSD" }
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en"
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
    <div className="w-full bg-card border border-border rounded-md overflow-hidden">
      <div className="flex items-center h-12 md:h-10">
        {/* Label */}
        <div className="flex-shrink-0 px-3 border-r border-border h-full flex items-center bg-muted/30">
          <span className="text-[10px] font-mono text-primary font-semibold tracking-wider whitespace-nowrap">
            {label}
          </span>
        </div>
        
        {/* TradingView Widget Container */}
        <div 
          ref={containerRef} 
          className="flex-1 overflow-hidden h-full flex items-center"
          style={{ minHeight: '40px' }}
        />
      </div>
    </div>
  );
};

export default TradingViewTickerTape;
