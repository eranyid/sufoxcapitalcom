import { Database } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
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
        {/* ROW 1 — SYSTEM BAR (compact, low visual weight) */}
        <div className="flex items-center justify-between px-4 h-8">
          {/* Left: Logo + Brand (muted) */}
          <div className="flex items-center gap-1.5">
            <img 
              alt="SUFOX" 
              className="h-5 w-5 object-contain opacity-80" 
              src="/lovable-uploads/1273449c-bfbb-4032-9057-0c06b65c76b2.png" 
            />
            <span className="text-[10px] font-medium text-muted-foreground tracking-wider">
              SUFOX CAPITAL
            </span>
          </div>

          {/* Right: Combined status + notifications */}
          <div className="flex items-center gap-2">
            {/* Combined status pill */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/30 rounded text-[9px] text-muted-foreground font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'ok' ? 'bg-emerald-500' : 
                status === 'warning' ? 'bg-amber-500' : 'bg-destructive'
              }`} />
              <span>{status === 'ok' ? 'OK' : status === 'warning' ? `${warningCount} warn` : `${errorCount} err`}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className={isOnline ? 'text-emerald-500' : 'text-destructive'}>{isOnline ? 'Online' : 'Offline'}</span>
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

        {/* ROW 2 — MARKET BAR (primary context) */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            {/* Left: Clock (primary) + Date (secondary) */}
            <div className="flex flex-col">
              <span className="text-lg font-mono text-primary font-bold tabular-nums leading-none tracking-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums mt-0.5">
                {time.toLocaleDateString('en-GB')} · {dayName}
              </span>
            </div>

            {/* Right: Market status (text, not heavy pills) */}
            <div className="flex flex-col items-end gap-0.5 text-[10px] font-mono">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(usColor)} ${usChangingSoon ? 'animate-pulse' : ''}`} />
                    <span>US · {usSession.status}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {renderMarketTooltip('US')}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(taseColor)} ${taseChangingSoon ? 'animate-pulse' : ''}`} />
                    <span>IL · {taseSession.status}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {renderMarketTooltip('TASE')}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}