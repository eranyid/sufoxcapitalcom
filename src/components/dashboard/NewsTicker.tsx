import { useEffect, useState, useRef, useCallback } from 'react';
import { useRssFeed } from '@/hooks/useRssFeed';
import { cn } from '@/lib/utils';

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

  // No RSS URL configured
  if (!rssUrl) {
    return (
      <div className="w-full bg-card border border-border rounded-md">
        <div className="flex items-center h-7 px-3">
          <span className="text-[10px] font-mono text-primary font-semibold tracking-wider mr-3 whitespace-nowrap">
            LIVE NEWS
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            Configure RSS feed in Settings
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <div className="w-full bg-card border border-border rounded-md">
        <div className="flex items-center h-7 px-3">
          <span className="text-[10px] font-mono text-primary font-semibold tracking-wider mr-3 whitespace-nowrap">
            LIVE NEWS
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            No news available
          </span>
        </div>
      </div>
    );
  }

  // No items
  if (items.length === 0) {
    return (
      <div className="w-full bg-card border border-border rounded-md">
        <div className="flex items-center h-7 px-3">
          <span className="text-[10px] font-mono text-primary font-semibold tracking-wider mr-3 whitespace-nowrap">
            LIVE NEWS
          </span>
          <span className="text-[10px] font-mono text-muted-foreground animate-pulse">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  const handleItemClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full bg-card border border-border rounded-md overflow-hidden">
      <div className="flex items-center h-9">
        {/* Label */}
        <div className="flex-shrink-0 px-4 border-r border-border h-full flex items-center bg-muted/30">
          <span className="text-xs font-mono text-primary font-semibold tracking-wider whitespace-nowrap">
            LIVE NEWS
          </span>
        </div>

        {/* Ticker container */}
        <div 
          className="flex-1 overflow-hidden relative"
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
                className="inline-flex items-center text-xs md:text-[13px] font-mono hover:text-primary transition-colors px-3 group flex-shrink-0"
              >
                <span className="text-primary/70 mr-1.5">{item.formattedTime}</span>
                {item.source && (
                  <span className="text-muted-foreground mr-1.5">[{item.source}]</span>
                )}
                <span className="text-foreground/90 group-hover:text-primary transition-colors">
                  {item.title}
                </span>
                <span className="text-muted-foreground/50 mx-3">•</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
