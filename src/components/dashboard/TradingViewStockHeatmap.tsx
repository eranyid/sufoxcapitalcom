import { useEffect, useRef, useState } from 'react';
import { WidgetGridLoader } from '@/components/LoadingSkeleton';

const TradingViewStockHeatmap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.async = true;
    script.type = 'text/javascript';
    script.onload = () => setTimeout(() => setLoading(false), 1200);

    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "en",
      symbolUrl: "",
      colorTheme: "dark",
      hasTopBar: true,
      isDataSet498: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: "100%",
      height: "100%"
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
      <style>{`.tradingview-widget-copyright { display: none !important; }`}</style>
      <div className="relative" style={{ width: '100%', height: '600px', overflow: 'hidden', backgroundColor: '#131722' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#131722]">
            <WidgetGridLoader label="STOCK HEATMAP" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </>
  );
};

export default TradingViewStockHeatmap;
