import { useEffect, useRef } from 'react';

export function MarketTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !containerRef.current) return;
    
    // Clear any existing content
    containerRef.current.innerHTML = '';
    
    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    
    const widgetInner = document.createElement('div');
    widgetInner.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetInner);
    
    // Create and configure the script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:USDILS", title: "USD / ILS" },
        { proName: "FOREXCOM:EURILS", title: "EUR / ILS" },
        { proName: "TVC:NI225", title: "Nikkei 225" },
        { proName: "NASDAQ:NDX", title: "NASDAQ 100" },
        { proName: "SP:SPX", title: "S&P 500" },
        { proName: "TVC:VIX", title: "VIX" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "TVC:GOLD", title: "Gold" }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en"
    });
    
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);
    scriptLoaded.current = true;
  }, []);

  return (
    <div className="w-full bg-background border-b border-primary/30 overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-[46px] md:h-[44px]"
      />
    </div>
  );
}
