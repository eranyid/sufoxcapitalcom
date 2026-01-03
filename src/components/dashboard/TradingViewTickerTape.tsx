import { useEffect, useRef } from 'react';

const TradingViewTickerTape = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing content
    containerRef.current.innerHTML = '';

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    // Create script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    
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
    <>
      <style>{`
        .tradingview-widget-copyright {
          display: none !important;
        }
        .tradingview-widget-container,
        .tradingview-widget-container__widget {
          background: #131722 !important;
        }
        .tradingview-widget-container__widget::before,
        .tradingview-widget-container__widget::after {
          display: none !important;
        }
        .tv-ticker-tape__wrapper {
          background: #131722 !important;
        }
      `}</style>
      <div 
        ref={containerRef}
        style={{ 
          width: '100%',
          height: '46px',
          overflow: 'hidden',
          backgroundColor: '#131722'
        }}
      />
    </>
  );
};

export default TradingViewTickerTape;
