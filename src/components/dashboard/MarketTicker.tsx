import { useEffect, useRef, useMemo } from 'react';
import { useTickerSymbols } from '@/hooks/useTickerSymbols';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MarketTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptIdRef = useRef<string | null>(null);
  const { enabledSymbols, isLoading } = useTickerSymbols();

  // Memoize symbols config to prevent unnecessary re-renders
  const symbolsConfig = useMemo(() => {
    return enabledSymbols.map(s => ({
      proName: s.tv_symbol,
      title: s.label,
    }));
  }, [enabledSymbols]);

  useEffect(() => {
    if (isLoading || !containerRef.current || symbolsConfig.length === 0) return;

    // Generate a unique ID for this render
    const scriptId = `tv-ticker-${Date.now()}`;
    
    // Only recreate if symbols have changed
    if (scriptIdRef.current === JSON.stringify(symbolsConfig)) return;
    scriptIdRef.current = JSON.stringify(symbolsConfig);

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.id = scriptId;

    const widgetInner = document.createElement('div');
    widgetInner.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetInner);

    // Create and configure the script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbols: symbolsConfig,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbolsConfig, isLoading]);

  // Show empty state if no symbols configured
  if (!isLoading && enabledSymbols.length === 0) {
    return (
      <div className="w-full bg-background border-b border-primary/30 overflow-hidden">
        <div className="flex items-center justify-center gap-2 h-[46px] md:h-[44px] text-muted-foreground text-sm">
          <Settings className="h-4 w-4" />
          <span>No market symbols configured.</span>
          <Link to="/settings" className="text-primary hover:underline">
            Add symbols in Settings → Market Ticker
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background border-b border-primary/30 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-[46px] md:h-[44px]"
      />
    </div>
  );
}
