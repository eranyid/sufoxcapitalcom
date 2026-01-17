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

  return (
    <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border md:hidden">
      {/* Bloomberg gradient bar */}
      <div className="bloomberg-gradient-bar" />
      
      {/* Safe area padding for iOS notch */}
      <div className="pt-safe">
        {/* Main header row */}
        <div className="flex items-center justify-between px-3 h-10">
          {/* Logo & Brand */}
          <div className="gap-1.5 flex items-center flex-shrink-0">
            <img alt="SUFOX" className="h-6 w-6 object-contain" src="/lovable-uploads/1273449c-bfbb-4032-9057-0c06b65c76b2.png" />
            <div>
              <h1 className="text-xs font-semibold text-primary tracking-wider leading-none">SUFOX</h1>
              <p className="text-[7px] text-muted-foreground font-mono tracking-widest leading-none">CAPITAL</p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <OnlineStatusIndicator 
              isOnline={isOnline} 
              dataStatus={status}
              errorCount={errorCount}
              warningCount={warningCount}
              onDataClick={onWatchdogClick}
            />
            <NotificationBell 
              unreadCount={unreadNotifications} 
              onClick={onNotificationsClick} 
            />
            {sampleDataMode && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/20 border border-primary/50 text-primary text-[8px] font-semibold rounded animate-pulse">
                <Database className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </div>

        {/* Date & Market Status Row - like desktop */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-between px-3 pb-1">
            {/* Clock & Date - stacked like desktop */}
            <div className="flex flex-col items-start">
              <span className="text-sm font-mono text-primary font-bold tabular-nums leading-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                {time.toLocaleDateString('en-GB')}
              </span>
            </div>

            {/* Market Status Badges - inline */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-2 py-0.5 bg-muted/50 border rounded text-[9px] cursor-pointer active:bg-muted/70 ${usChangingSoon ? 'border-amber-500/50' : 'border-border/50'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(usColor)} ${usChangingSoon ? 'animate-pulse' : ''}`} />
                    <span className="text-muted-foreground font-mono">US {usSession.status}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {renderMarketTooltip('US')}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-2 py-0.5 bg-muted/50 border rounded text-[9px] cursor-pointer active:bg-muted/70 ${taseChangingSoon ? 'border-amber-500/50' : 'border-border/50'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(taseColor)} ${taseChangingSoon ? 'animate-pulse' : ''}`} />
                    <span className="text-muted-foreground font-mono">IL {taseSession.status}</span>
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