/**
 * MarketClock - Real-time clock with US and TASE market session status
 * 
 * Features:
 * - Real-time clock updating every second
 * - Timezone-aware session status for US (NYSE/Nasdaq) and TASE
 * - DST handling for both markets
 * - Holiday calendar awareness
 * - Responsive design for desktop and mobile
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Clock as ClockIcon, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getUSMarketSession,
  getTASEMarketSession,
  formatCountdown,
  getUSStatusColor,
  getTASEStatusColor,
  TIMEZONE_ISRAEL,
  TIMEZONE_US,
  type USMarketSession,
  type TASEMarketSession,
  type MarketSessionInfo,
} from '@/lib/marketSessionEngine';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============= CLOCK COMPONENT =============

interface ClockProps {
  className?: string;
}

export function Clock({ className }: ClockProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeStr = format(now, 'HH:mm:ss');
  const dateStr = format(now, 'dd/MM/yyyy');

  return (
    <div className={cn('flex items-center gap-2 font-mono', className)}>
      <ClockIcon className="h-3 w-3 text-muted-foreground" />
      <div className="flex flex-col items-end">
        <span className="text-sm tabular-nums font-medium">{timeStr}</span>
        <span className="text-[9px] text-muted-foreground tabular-nums">{dateStr}</span>
      </div>
    </div>
  );
}

// ============= MARKET STATUS BADGE =============

interface MarketStatusProps {
  market: 'US' | 'TASE';
  className?: string;
  showCountdown?: boolean;
}

export function MarketStatus({ market, className, showCountdown = true }: MarketStatusProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sessionInfo = useMemo(() => {
    return market === 'US' ? getUSMarketSession(now) : getTASEMarketSession(now);
  }, [market, now]);

  const statusColor = useMemo(() => {
    if (market === 'US') {
      return getUSStatusColor(sessionInfo.status as USMarketSession);
    }
    return getTASEStatusColor(sessionInfo.status as TASEMarketSession);
  }, [market, sessionInfo.status]);

  const countdown = useMemo(() => {
    if (!sessionInfo.nextChange) return null;
    return formatCountdown(sessionInfo.nextChange, now);
  }, [sessionInfo.nextChange, now]);

  const colorClasses = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    muted: 'bg-muted/50 text-muted-foreground border-border',
  };

  const dotClasses = {
    success: 'bg-emerald-400',
    warning: 'bg-blue-400',
    muted: 'bg-muted-foreground',
  };

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-medium">{market === 'US' ? 'NYSE/Nasdaq' : 'Tel Aviv Stock Exchange'}</div>
      <div className="text-muted-foreground">
        Exchange Time: {sessionInfo.exchangeTime} {sessionInfo.exchangeTimezone}
      </div>
      <div className="text-muted-foreground">
        Local Time: {formatInTimeZone(now, TIMEZONE_ISRAEL, 'HH:mm:ss')} IST
      </div>
      {sessionInfo.nextChange && sessionInfo.nextStatus && (
        <div className="text-muted-foreground">
          Next: {sessionInfo.nextStatus} in {countdown}
        </div>
      )}
      {sessionInfo.holidayName && (
        <div className="text-amber-400">📅 {sessionInfo.holidayName}</div>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono uppercase tracking-wide cursor-default',
              colorClasses[statusColor],
              className
            )}
          >
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotClasses[statusColor])} />
            <span className="font-medium">{market}</span>
            <span className="opacity-80">{sessionInfo.status}</span>
            {showCountdown && countdown && sessionInfo.status !== 'CLOSED' && (
              <span className="text-[8px] opacity-60 hidden sm:inline">({countdown})</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============= FULL MARKET CLOCK COMPONENT =============

interface MarketClockProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function MarketClock({ className, variant = 'compact' }: MarketClockProps) {
  if (variant === 'full') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Clock />
        <div className="flex flex-wrap gap-1.5">
          <MarketStatus market="US" />
          <MarketStatus market="TASE" />
        </div>
      </div>
    );
  }

  // Compact variant - inline
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Clock />
      <div className="hidden sm:flex items-center gap-1.5">
        <MarketStatus market="US" showCountdown={false} />
        <MarketStatus market="TASE" showCountdown={false} />
      </div>
    </div>
  );
}

// ============= MOBILE MARKET CLOCK =============

interface MobileMarketClockProps {
  className?: string;
}

export function MobileMarketClock({ className }: MobileMarketClockProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeStr = format(now, 'HH:mm:ss');
  const dateStr = format(now, 'dd/MM/yy');

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Time and Date row */}
      <div className="flex items-center gap-2 font-mono">
        <ClockIcon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs tabular-nums font-medium">{timeStr}</span>
        <span className="text-[9px] text-muted-foreground tabular-nums">{dateStr}</span>
      </div>
      {/* Market status badges */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        <MarketStatus market="US" showCountdown={false} />
        <MarketStatus market="TASE" showCountdown={false} />
      </div>
    </div>
  );
}

export default MarketClock;
