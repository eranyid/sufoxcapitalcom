import { useEffect, useRef } from 'react';

interface TradingViewTickerTapeProps {
  label?: string;
}

// Macro Cross-Asset Watchlist Configuration
const macroCrossAssetTicker = [
  // INDICES / FX & COMMODITIES
  { proName: "FX_IDC:USDILS", title: "USD/ILS" },
  { proName: "INDEX:DXY", title: "DXY" },
  { proName: "FX_IDC:EURILS", title: "EUR/ILS" },
  { proName: "AMEX:USO", title: "USO" },
  { proName: "AMEX:USL", title: "USL" },
  { proName: "CBOE:VIX", title: "VIX" },
  { proName: "TVC:GOLD", title: "XAUUSD" },
  { proName: "TVC:SILVER", title: "XAGUSD" },
  
  // ECONOMIC
  { proName: "ECONOMICS:USGDG", title: "US Debt/GDP" },
  { proName: "ECONOMICS:USGDPYY", title: "US GDP YoY" },
  { proName: "TVC:US02Y", title: "US 2Y Yield" },
  { proName: "TVC:US10Y", title: "US 10Y Yield" },
  { proName: "ECONOMICS:USCCPI", title: "US Core CPI" },
  { proName: "FRED:WALCL", title: "Fed Balance Sheet" },
  { proName: "ECONOMICS:USM2", title: "US M2" },
  { proName: "FRED:UNRATENSA", title: "US Unemployment" },
  { proName: "FRED:MORTGAGE30US", title: "30Y Mortgage" },
  
  // FUTURES / SECTORS
  { proName: "CME_MINI:ES1!", title: "ES Futures" },
  { proName: "AMEX:XLF", title: "XLF Financials" },
  { proName: "AMEX:XLK", title: "XLK Tech" },
  { proName: "AMEX:XLRE", title: "XLRE Real Estate" },
];

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
    
    // TradingView Ticker Tape configuration with macro cross-asset watchlist
    script.innerHTML = JSON.stringify({
      symbols: macroCrossAssetTicker,
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
      <div 
        ref={containerRef} 
        className="w-full overflow-hidden"
        style={{ minHeight: '48px' }}
      />
    </div>
  );
};

export default TradingViewTickerTape;
