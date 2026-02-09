import { useEffect, useRef } from 'react';

const TradingViewStockHeatmap = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      <style>{`
        .tradingview-widget-copyright {
          display: none !important;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '600px',
          overflow: 'hidden',
          backgroundColor: '#131722'
        }}
      />
    </>
  );
};

export default TradingViewStockHeatmap;
