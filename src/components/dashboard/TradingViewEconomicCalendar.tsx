import { useEffect, useRef, useState } from 'react';
import { WidgetGridLoader } from '@/components/LoadingSkeleton';

interface Props {
  height?: number;
}

export default function TradingViewEconomicCalendar({ height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.type = 'text/javascript';
    script.onload = () => setTimeout(() => setLoading(false), 1200);

    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: false,
      width: '100%',
      height: '100%',
      locale: 'en',
      importanceFilter: '-1,0,1',
      countryFilter: 'us,eu,gb,jp,cn,il',
    });

    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div className="relative tradingview-widget-container h-full" style={height ? { height } : undefined}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backgroundColor: '#131722' }}>
          <WidgetGridLoader label="UPCOMING ECONOMIC EVENTS" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full">
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}
