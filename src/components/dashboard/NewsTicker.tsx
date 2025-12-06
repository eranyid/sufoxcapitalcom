import { useEffect, useState, useRef, useCallback } from 'react';
import { useRssFeed } from '@/hooks/useRssFeed';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface NewsTickerProps {
  rssUrl: string | null;
}

export function NewsTicker({ rssUrl }: NewsTickerProps) {
  const { items, error } = useRssFeed(rssUrl);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const contentWidthRef = useRef(0);

  const animate = useCallback(() => {
    if (!tickerRef.current || isPaused) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Get content width on first run or when it changes
    if (contentWidthRef.current === 0) {
      contentWidthRef.current = tickerRef.current.scrollWidth / 2;
    }

    // Move ticker
    positionRef.current -= 0.5; // Speed: pixels per frame

    // Reset position when first set of items is fully scrolled
    if (Math.abs(positionRef.current) >= contentWidthRef.current) {
      positionRef.current = 0;
    }

    tickerRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused]);

  useEffect(() => {
    if (items.length > 0) {
      // Reset content width when items change
      contentWidthRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items, animate]);

  const handleItemClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Render content based on state
  const renderContent = () => {
    // No RSS URL configured
    if (!rssUrl) {
      return (
        <span className="text-xs sm:text-sm font-mono text-muted-foreground">
          Configure RSS feed in Settings
        </span>
      );
    }

    // Error state
    if (error && items.length === 0) {
      return (
        <span className="text-xs sm:text-sm font-mono text-muted-foreground">
          No news available
        </span>
      );
    }

    // Loading state
    if (items.length === 0) {
      return (
        <span className="text-xs sm:text-sm font-mono text-muted-foreground animate-pulse">
          Loading...
        </span>
      );
    }

    // Ticker content
    return (
      <div 
        className="overflow-hidden relative flex-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div 
          ref={tickerRef}
          className={cn(
            "inline-flex items-center whitespace-nowrap will-change-transform"
          )}
          style={{
            backfaceVisibility: 'hidden',
            perspective: 1000,
          }}
        >
          {/* Duplicate content for seamless loop */}
          {[...items, ...items].map((item, index) => (
            <button
              key={`${item.link}-${index}`}
              onClick={() => handleItemClick(item.link)}
              className="inline-flex items-center text-xs sm:text-sm font-mono hover:text-primary transition-colors px-2 sm:px-3 group flex-shrink-0"
            >
              <span className="text-primary/70 mr-1.5 sm:mr-2">{item.formattedTime}</span>
              {item.source && (
                <span className="text-muted-foreground mr-1.5 sm:mr-2">[{item.source}]</span>
              )}
              <span className="text-foreground/90 group-hover:text-primary transition-colors">
                {item.title}
              </span>
              <span className="text-muted-foreground/50 mx-3 sm:mx-4">•</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="kpi-card w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="terminal-label text-[10px] sm:text-xs">LIVE NEWS</p>
        <div className="p-1.5 bg-primary/10 border border-primary/30">
          <Zap size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
        </div>
      </div>
      
      {/* Ticker content area */}
      <div className="min-h-[32px] sm:min-h-[28px] flex items-center">
        {renderContent()}
      </div>
    </div>
  );
}