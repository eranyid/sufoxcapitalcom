import { Database } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useState, useEffect } from 'react';
import { getUSMarketSession, getTASEMarketSession, getUSStatusColor, getTASEStatusColor, formatCountdown, TIMEZONE_ISRAEL } from '@/lib/marketSessionEngine';
import { formatInTimeZone } from 'date-fns-tz';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [time, setTime] = useState(new Date());
  
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
        {/* ROW 1 — BRAND BAR (minimal, logo only) */}
        <div className="flex items-center justify-between px-4 h-7">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-2">
            <img 
              alt="SUFOX" 
              className="h-6 w-6 object-contain opacity-80" 
              src="/lovable-uploads/1273449c-bfbb-4032-9057-0c06b65c76b2.png" 
            />
            <span className="text-sm font-normal text-muted-foreground/80 tracking-wide">
              SUFOX CAPITAL
            </span>
          </div>
        </div>

        {/* ROW 2 — INFO BAR (Clock centered, status left, market right) */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            {/* Left: Status pill (compact, low weight) */}
            <div className="flex items-center min-w-[50px]">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/20 rounded text-xs text-muted-foreground font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'ok' ? 'bg-emerald-500' : 
                  status === 'warning' ? 'bg-amber-500' : 'bg-destructive'
                }`} />
                <span>{status === 'ok' ? 'OK' : status === 'warning' ? `${warningCount}W` : `${errorCount}E`}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className={isOnline ? 'text-emerald-500' : 'text-destructive'}>{isOnline ? '●' : '○'}</span>
              </div>
            </div>

            {/* Center: Clock (primary) + Date (secondary) */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-xl font-semibold font-mono text-primary tabular-nums leading-[1.1] tracking-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-sm font-normal font-mono text-muted-foreground/75 tabular-nums mt-0.5">
                {time.toLocaleDateString('en-GB')} · {dayName}
              </span>
            </div>

            {/* Right: Market status + Notifications */}
            <div className="flex items-center gap-3 min-w-[90px] justify-end">
              {/* Market status inline */}
              <div className="flex items-center gap-2 text-sm font-medium font-mono text-muted-foreground tracking-[0.02em]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(usColor)} ${usChangingSoon ? 'animate-pulse' : ''}`} />
                      <span>US</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {renderMarketTooltip('US')}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(taseColor)} ${taseChangingSoon ? 'animate-pulse' : ''}`} />
                      <span>IL</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {renderMarketTooltip('TASE')}
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <NotificationBell 
                unreadCount={unreadNotifications} 
                onClick={onNotificationsClick} 
              />
              
              {sampleDataMode && (
                <Database className="h-3 w-3 text-primary opacity-60" />
              )}
            </div>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
