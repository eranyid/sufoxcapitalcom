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

  const getStatusStyle = (color: 'success' | 'warning' | 'muted') => {
    switch (color) {
      case 'success': return { dot: 'bg-emerald-500', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' };
      case 'warning': return { dot: 'bg-amber-500', border: 'border-amber-500/40', bg: 'bg-amber-500/10' };
      case 'muted': return { dot: 'bg-muted-foreground/50', border: 'border-muted-foreground/20', bg: 'bg-muted/30' };
    }
  };

  const getStatusLabel = (sessionStatus: string) => {
    switch (sessionStatus) {
      case 'open': return 'OPEN';
      case 'pre': return 'PRE';
      case 'after': return 'AFTER';
      case 'closed': return 'CLSD';
      default: return sessionStatus.toUpperCase().slice(0, 4);
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

  const usStyle = getStatusStyle(usColor);
  const taseStyle = getStatusStyle(taseColor);

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
          
          {/* Right: Notifications + Sample data indicator */}
          <div className="flex items-center gap-2">
            <NotificationBell 
              unreadCount={unreadNotifications} 
              onClick={onNotificationsClick} 
            />
            {sampleDataMode && (
              <Database className="h-3.5 w-3.5 text-primary opacity-60" />
            )}
          </div>
        </div>

        {/* ROW 2 — INFO BAR (Clock centered, market chips on sides) */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-between px-3 pb-2 pt-0.5">
            {/* Left: US Market chip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border ${usStyle.border} ${usStyle.bg} ${usChangingSoon ? 'ring-1 ring-amber-500/50 animate-pulse' : ''} transition-all`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${usStyle.dot}`} />
                  <span className="text-[10px] font-mono font-medium text-foreground/90">US</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{getStatusLabel(usSession.status)}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {renderMarketTooltip('US')}
              </TooltipContent>
            </Tooltip>

            {/* Center: Clock (primary) + Date (secondary) */}
            <div className="flex flex-col items-center">
              <span className="text-xl font-semibold font-mono text-primary tabular-nums leading-[1.1] tracking-tight">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-sm font-normal font-mono text-muted-foreground/75 tabular-nums mt-0.5">
                {time.toLocaleDateString('en-GB')}
              </span>
            </div>

            {/* Right: IL Market chip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border ${taseStyle.border} ${taseStyle.bg} ${taseChangingSoon ? 'ring-1 ring-amber-500/50 animate-pulse' : ''} transition-all`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${taseStyle.dot}`} />
                  <span className="text-[10px] font-mono font-medium text-foreground/90">IL</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{getStatusLabel(taseSession.status)}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {renderMarketTooltip('TASE')}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
