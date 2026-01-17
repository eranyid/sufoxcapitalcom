import { Database } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useState, useEffect, useMemo } from 'react';
import { getUSMarketSession, getTASEMarketSession, getUSStatusColor, getTASEStatusColor, formatCountdown, TIMEZONE_ISRAEL, TIMEZONE_US } from '@/lib/marketSessionEngine';
import { formatInTimeZone } from 'date-fns-tz';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MobileHeaderProps {
  status: 'ok' | 'warning' | 'error';
  errorCount: number;
  warningCount: number;
  onWatchdogClick: () => void;
  isOnline: boolean;
  unreadNotifications: number;
  onNotificationsClick: () => void;
}

interface MarketSessionWidgetProps {
  market: 'US' | 'IL';
  session: ReturnType<typeof getUSMarketSession>;
  color: 'success' | 'warning' | 'muted';
  countdown: string | null;
  changingSoon: boolean;
  currentTime: Date;
}

function MarketSessionWidget({ market, session, color, countdown, changingSoon, currentTime }: MarketSessionWidgetProps) {
  // Calculate progress to next session (0-100)
  const progress = useMemo(() => {
    if (!session.nextChange) return 0;
    
    // Estimate session duration based on status
    const sessionDurations: Record<string, number> = {
      'PRE-MARKET': 5.5 * 60 * 60 * 1000,
      'MARKET OPEN': 6.5 * 60 * 60 * 1000,
      'AFTER-HOURS': 4 * 60 * 60 * 1000,
      'CLOSED': 14 * 60 * 60 * 1000,
      'PRE-OPEN': 0.75 * 60 * 60 * 1000,
      'OPEN': 7.67 * 60 * 60 * 1000,
      'AUCTION': 0.17 * 60 * 60 * 1000,
    };
    
    const estimatedDuration = sessionDurations[session.status] || 6 * 60 * 60 * 1000;
    const timeToNext = session.nextChange.getTime() - currentTime.getTime();
    const elapsed = estimatedDuration - timeToNext;
    
    return Math.min(100, Math.max(0, (elapsed / estimatedDuration) * 100));
  }, [session, currentTime]);

  const getStatusStyle = () => {
    switch (color) {
      case 'success': return { 
        border: 'border-emerald-500', 
        bg: 'bg-emerald-500/5', 
        dot: 'bg-emerald-500',
        progress: 'bg-emerald-500',
        glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]'
      };
      case 'warning': return { 
        border: 'border-amber-500', 
        bg: 'bg-amber-500/5', 
        dot: 'bg-amber-500',
        progress: 'bg-amber-500',
        glow: ''
      };
      case 'muted': return { 
        border: 'border-muted-foreground/30', 
        bg: 'bg-muted/20', 
        dot: 'bg-muted-foreground/50',
        progress: 'bg-muted-foreground/30',
        glow: ''
      };
    }
  };

  const getFullStatusLabel = (status: string) => {
    switch (status) {
      case 'MARKET OPEN': return 'OPEN';
      case 'PRE-MARKET': return 'PRE';
      case 'AFTER-HOURS': return 'AFTER';
      case 'CLOSED': return 'CLOSED';
      case 'OPEN': return 'OPEN';
      case 'PRE-OPEN': return 'PRE';
      case 'AUCTION': return 'AUCTION';
      default: return status;
    }
  };

  const isMarketOpen = (status: string) => {
    return status === 'MARKET OPEN' || status === 'OPEN';
  };

  const formatCompactCountdown = (cd: string | null) => {
    if (!cd) return null;
    // Parse countdown like "2h 15m 30s" and make it compact
    const parts = cd.split(' ');
    if (parts.length >= 2) {
      // Return first two parts (hours and minutes, or minutes and seconds)
      return parts.slice(0, 2).join(' ');
    }
    return cd;
  };

  const style = getStatusStyle();
  const isOpen = isMarketOpen(session.status);
  const compactCountdown = formatCompactCountdown(countdown);
  
  const timezone = market === 'US' ? TIMEZONE_US : TIMEZONE_ISRAEL;
  const exchangeTime = formatInTimeZone(currentTime, timezone, 'HH:mm');
  const timezoneLabel = market === 'US' ? 'ET' : 'IST';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={`
            relative flex flex-col min-w-[72px] rounded-md overflow-hidden
            border-l-2 ${style.border} ${style.bg}
            ${isOpen ? style.glow : ''}
            ${changingSoon ? 'ring-1 ring-amber-500/50' : ''}
            transition-all active:scale-95
          `}
          onClick={() => {
            // Haptic feedback on mobile
            if ('vibrate' in navigator) {
              navigator.vibrate(10);
            }
          }}
        >
          {/* Main content */}
          <div className="flex items-center gap-1.5 px-2 py-1">
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${changingSoon ? 'animate-pulse' : ''}`} />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-semibold text-foreground/90">{market}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{getFullStatusLabel(session.status)}</span>
              </div>
              {compactCountdown && (
                <span className="text-[8px] font-mono text-muted-foreground/70 leading-none">
                  {compactCountdown}
                </span>
              )}
            </div>
          </div>
          
          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-muted/30">
            <div 
              className={`h-full ${style.progress} transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        side="bottom" 
        align={market === 'US' ? 'start' : 'end'}
        className="w-56 p-3 pointer-events-auto"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{market === 'US' ? 'NYSE / Nasdaq' : 'Tel Aviv (TASE)'}</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${style.bg} ${isOpen ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {getFullStatusLabel(session.status)}
            </span>
          </div>
          
          {/* Exchange Time */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Exchange Time</div>
            <div className="text-lg font-mono font-semibold tabular-nums">
              {exchangeTime} <span className="text-xs text-muted-foreground">{timezoneLabel}</span>
            </div>
          </div>
          
          {/* Next Session */}
          {session.nextChange && session.nextStatus && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next Change</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{session.nextStatus}</span>
                <span className="text-xs font-mono text-muted-foreground">in {countdown}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {formatInTimeZone(session.nextChange, timezone, 'HH:mm')} {timezoneLabel}
              </div>
            </div>
          )}
          
          {/* Holiday Notice */}
          {session.holidayName && (
            <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-500">📅</span>
              <span className="text-xs text-amber-400">{session.holidayName}</span>
            </div>
          )}
          
          {/* Today's Schedule */}
          <div className="space-y-1 pt-2 border-t border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Today's Schedule</div>
            {market === 'US' ? (
              <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
                <div>Pre-Market: 04:00 - 09:30 ET</div>
                <div>Regular: 09:30 - 16:00 ET</div>
                <div>After-Hours: 16:00 - 20:00 ET</div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
                <div>Pre-Auction: 09:00 - 09:45</div>
                <div>Continuous: 09:45 - 17:25</div>
                <div>Closing: 17:25 - 17:35</div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
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
  const usColor = getUSStatusColor(usSession.status as Parameters<typeof getUSStatusColor>[0]);
  const taseColor = getTASEStatusColor(taseSession.status as Parameters<typeof getTASEStatusColor>[0]);
  const usCountdown = usSession.nextChange ? formatCountdown(usSession.nextChange, time) : null;
  const taseCountdown = taseSession.nextChange ? formatCountdown(taseSession.nextChange, time) : null;

  // Check if session change is within 5 minutes (300000ms)
  const usChangingSoon = usSession.nextChange && (usSession.nextChange.getTime() - time.getTime()) <= 300000;
  const taseChangingSoon = taseSession.nextChange && (taseSession.nextChange.getTime() - time.getTime()) <= 300000;

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

        {/* ROW 2 — INFO BAR (Market widgets flanking centered clock) */}
        <div className="flex items-center justify-between px-3 pb-2 pt-0.5 gap-2">
          {/* Left: US Market Widget */}
          <MarketSessionWidget
            market="US"
            session={usSession}
            color={usColor}
            countdown={usCountdown}
            changingSoon={!!usChangingSoon}
            currentTime={time}
          />

          {/* Center: Clock (primary) + Date (secondary) - slightly reduced */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-lg font-semibold font-mono text-primary tabular-nums leading-[1.1] tracking-tight">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
            <span className="text-sm font-normal font-mono text-muted-foreground/75 tabular-nums mt-0.5">
              {time.toLocaleDateString('en-GB')}
            </span>
          </div>

          {/* Right: IL Market Widget */}
          <MarketSessionWidget
            market="IL"
            session={taseSession}
            color={taseColor}
            countdown={taseCountdown}
            changingSoon={!!taseChangingSoon}
            currentTime={time}
          />
        </div>
      </div>
    </header>
  );
}
