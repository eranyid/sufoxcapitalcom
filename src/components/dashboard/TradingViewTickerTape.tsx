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
    <div 
      className="w-full rounded-lg overflow-hidden relative"
      style={{ 
        backgroundColor: '#131722',
        height: '56px'
      }}
    >
      {/* Hide TradingView branding, corner dots and copyright */}
      <style>{`
        .tradingview-widget-container__widget {
          pointer-events: none;
        }
        .tradingview-widget-copyright {
          display: none !important;
        }
        /* Hide corner resize handles/dots */
        .tradingview-widget-container iframe {
          border-radius: 8px;
        }
        /* Clip any overflow content including corner elements */
        .tv-ticker-tape-wrapper {
          border-radius: 8px !important;
        }
      `}</style>
      <div 
        ref={containerRef} 
        className="w-full overflow-hidden"
        style={{ 
          height: '56px',
          backgroundColor: '#131722',
          marginBottom: '-24px',
          clipPath: 'inset(0 4px 0 4px round 8px)'
        }}
      />
    </div>
  );
};

export default TradingViewTickerTape;
