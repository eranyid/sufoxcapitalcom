import { Database } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getUSMarketSession, getTASEMarketSession, getUSStatusColor, getTASEStatusColor, formatCountdown, TIMEZONE_ISRAEL } from '@/lib/marketSessionEngine';
import { formatInTimeZone } from 'date-fns-tz';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRssFeed } from '@/hooks/useRssFeed';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MobileHeaderProps {
  status: 'ok' | 'warning' | 'error';
  errorCount: number;
  warningCount: number;
  onWatchdogClick: () => void;
  isOnline: boolean;
  unreadNotifications: number;
  onNotificationsClick: () => void;
}

export function MobileHeader({
  status,
  errorCount,
  warningCount,
  onWatchdogClick,
  isOnline,
  unreadNotifications,
  onNotificationsClick
}: MobileHeaderProps) {
  const { sampleDataMode } = usePortfolio();
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [rssFeedUrl, setRssFeedUrl] = useState<string | null>(null);
  
  // Fetch RSS feed URL from settings
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('portfolio_settings')
        .select('rss_feed_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.rss_feed_url) setRssFeedUrl(data.rss_feed_url);
    };
    fetchSettings();
  }, [user]);

  const { items: newsItems } = useRssFeed(rssFeedUrl, { maxAgeHours: 48, minItems: 3 });
  
  // News ticker animation
  const tickerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const positionRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

  const animate = useCallback(() => {
    if (!tickerRef.current || isPaused) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    const ticker = tickerRef.current;
    const halfWidth = ticker.scrollWidth / 2;
    positionRef.current -= 0.5;
    if (Math.abs(positionRef.current) >= halfWidth) {
      positionRef.current = 0;
    }
    ticker.style.transform = `translateX(${positionRef.current}px)`;
    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused]);

  useEffect(() => {
    if (newsItems.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [newsItems, animate]);
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get market sessions
  const usSession = getUSMarketSession(time);
  const taseSession = getTASEMarketSession(time);
  const usColor = getUSStatusColor(usSession.status as any);
  const taseColor = getTASEStatusColor(taseSession.status as any);
  const usCountdown = usSession.nextChange ? formatCountdown(usSession.nextChange, time) : null;
  const taseCountdown = taseSession.nextChange ? formatCountdown(taseSession.nextChange, time) : null;

  // Check if session change is within 5 minutes (300000ms)
  const usChangingSoon = usSession.nextChange && (usSession.nextChange.getTime() - time.getTime()) <= 300000;
  const taseChangingSoon = taseSession.nextChange && (taseSession.nextChange.getTime() - time.getTime()) <= 300000;

  const getStatusDotColor = (color: 'success' | 'warning' | 'muted') => {
    switch (color) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'muted': return 'bg-muted-foreground';
    }
  };

  const renderMarketTooltip = (market: 'US' | 'TASE') => {
    const session = market === 'US' ? usSession : taseSession;
    const countdown = market === 'US' ? usCountdown : taseCountdown;
    return (
      <div className="space-y-1 text-xs">
        <div className="font-medium">{market === 'US' ? 'NYSE/Nasdaq' : 'Tel Aviv Stock Exchange'}</div>
        <div className="text-muted-foreground">
          Exchange Time: {session.exchangeTime} {session.exchangeTimezone}
        </div>
        <div className="text-muted-foreground">
          Local Time: {formatInTimeZone(time, TIMEZONE_ISRAEL, 'HH:mm:ss')} IST
        </div>
        {session.nextChange && session.nextStatus && (
          <div className="text-muted-foreground">
            Next: {session.nextStatus} in {countdown}
          </div>
        )}
        {session.holidayName && (
          <div className="text-amber-400">📅 {session.holidayName}</div>
        )}
      </div>
    );
  };

  // Get day name
  const dayName = time.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border md:hidden">
      {/* Bloomberg gradient bar */}
      <div className="bloomberg-gradient-bar" />
      
      {/* Safe area padding for iOS notch */}
      <div className="pt-safe">
        {/* ROW 1 — SYSTEM BAR (compact, low visual weight) */}
        <div className="flex items-center justify-between px-4 h-7">
          {/* Left: Logo + Brand (muted) */}
          <div className="flex items-center gap-1.5">
            <img 
              alt="SUFOX" 
              className="h-4 w-4 object-contain opacity-80" 
              src="/lovable-uploads/1273449c-bfbb-4032-9057-0c06b65c76b2.png" 
            />
            <span className="text-[9px] font-medium text-muted-foreground tracking-wider">
              SUFOX
            </span>
          </div>

          {/* Right: Combined status + notifications */}
          <div className="flex items-center gap-1.5">
            {/* Combined status pill */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/30 rounded text-[8px] text-muted-foreground font-mono">
              <span className={`w-1 h-1 rounded-full ${
                status === 'ok' ? 'bg-emerald-500' : 
                status === 'warning' ? 'bg-amber-500' : 'bg-destructive'
              }`} />
              <span>{status === 'ok' ? 'OK' : status === 'warning' ? `${warningCount}W` : `${errorCount}E`}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className={isOnline ? 'text-emerald-500' : 'text-destructive'}>{isOnline ? '●' : '○'}</span>
            </div>
            
            <NotificationBell 
              unreadCount={unreadNotifications} 
              onClick={onNotificationsClick} 
            />
            
            {sampleDataMode && (
              <Database className="h-2.5 w-2.5 text-primary opacity-60" />
            )}
          </div>
        </div>

        {/* ROW 2 — MARKET BAR (Clock + Market + News inline) */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-2 px-4 pb-1.5 pt-0.5">
            {/* Left: Clock (primary) + Date (secondary) - tighter spacing */}
            <div className="flex flex-col flex-shrink-0">
              <span className="text-lg font-mono text-primary font-bold tabular-nums leading-[1.1] tracking-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground tabular-nums leading-none">
                {time.toLocaleDateString('en-GB')} · {dayName}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border/50 flex-shrink-0" />

            {/* Market status inline */}
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                    <span className={`w-1 h-1 rounded-full ${getStatusDotColor(usColor)} ${usChangingSoon ? 'animate-pulse' : ''}`} />
                    US {usSession.status.toUpperCase()}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {renderMarketTooltip('US')}
                </TooltipContent>
              </Tooltip>
              <span className="text-muted-foreground/40">·</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                    <span className={`w-1 h-1 rounded-full ${getStatusDotColor(taseColor)} ${taseChangingSoon ? 'animate-pulse' : ''}`} />
                    IL {taseSession.status.toUpperCase()}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {renderMarketTooltip('TASE')}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Divider */}
            {newsItems.length > 0 && (
              <div className="w-px h-6 bg-border/50 flex-shrink-0" />
            )}

            {/* Inline News Ticker */}
            {newsItems.length > 0 && (
              <div 
                className="flex-1 overflow-hidden relative min-w-0"
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-primary/70 font-semibold flex-shrink-0">LIVE</span>
                  <div className="flex-1 overflow-hidden">
                    <div 
                      ref={tickerRef}
                      className="inline-flex items-center whitespace-nowrap will-change-transform"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {[...newsItems, ...newsItems].map((item, index) => (
                        <span
                          key={`${item.link}-${index}`}
                          className="inline-flex items-center text-[9px] font-mono text-muted-foreground px-2 flex-shrink-0"
                        >
                          <span className="text-foreground/80 truncate max-w-[200px]">
                            {item.title}
                          </span>
                          <span className="text-muted-foreground/30 mx-2">•</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}