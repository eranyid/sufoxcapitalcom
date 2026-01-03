import { useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

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
    widgetContainer.style.backgroundColor = '#000000';
    
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.backgroundColor = '#000000';
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
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
      largeChartUrl: ""
    });
    
    // Force dark background on iframe when it loads
    const observer = new MutationObserver(() => {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe) {
        iframe.style.backgroundColor = '#1a1a1a';
      }
    });
    
    observer.observe(widgetContainer, { childList: true, subtree: true });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      observer.disconnect();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full border border-border rounded-md overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
      <div 
        ref={containerRef} 
        className="w-full overflow-hidden"
        style={{ minHeight: '48px', backgroundColor: '#1a1a1a' }}
      />
    </div>
  );
};

export default TradingViewTickerTape;
