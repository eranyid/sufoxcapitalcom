import { Wifi, WifiOff, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  compact?: boolean;
  className?: string;
  // Data watchdog props (optional)
  dataStatus?: 'ok' | 'warning' | 'error';
  errorCount?: number;
  warningCount?: number;
  onDataClick?: () => void;
}

export function OnlineStatusIndicator({ 
  isOnline, 
  compact = false,
  className,
  dataStatus,
  errorCount = 0,
  warningCount = 0,
  onDataClick
}: OnlineStatusIndicatorProps) {
  const hasDataInfo = dataStatus !== undefined;

  const getDataIcon = () => {
    switch (dataStatus) {
      case 'error':
        return <ShieldX className="h-3 w-3" />;
      case 'warning':
        return <ShieldAlert className="h-3 w-3" />;
      default:
        return <ShieldCheck className="h-3 w-3" />;
    }
  };

  const getDataLabel = () => {
    switch (dataStatus) {
      case 'error':
        return `${errorCount} Error${errorCount > 1 ? 's' : ''}`;
      case 'warning':
        return `${warningCount} Warning${warningCount > 1 ? 's' : ''}`;
      default:
        return 'Data OK';
    }
  };

  const getDataStatusStyles = () => {
    switch (dataStatus) {
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  // Combined component with data info
  if (hasDataInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onDataClick}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded text-[10px] font-medium transition-all hover:bg-muted/50 active:bg-muted/70",
                "bg-green-500/10 border border-green-500/30",
                dataStatus === 'error' && "bg-destructive/10 border-destructive/30 animate-pulse",
                dataStatus === 'warning' && "bg-yellow-500/10 border-yellow-500/30",
                className
              )}
            >
              {/* Data Status */}
              <span className={cn("flex items-center gap-1", getDataStatusStyles())}>
                {getDataIcon()}
                <span className="font-semibold">{getDataLabel()}</span>
              </span>

              {/* Separator */}
              <span className="w-px h-3 bg-border/50" />

              {/* Online Status */}
              <span className={cn(
                "flex items-center gap-1",
                isOnline ? "text-green-500" : "text-orange-500"
              )}>
                <span 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isOnline 
                      ? "bg-green-500 animate-pulse" 
                      : "bg-orange-500"
                  )} 
                />
                {!compact && (
                  <span className="uppercase tracking-wider">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                )}
                {isOnline ? (
                  <Wifi className="h-3 w-3 opacity-60" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-1">
              <div className={getDataStatusStyles()}>
                {dataStatus === 'ok' 
                  ? 'All data validations passed' 
                  : dataStatus === 'warning' 
                    ? `${warningCount} validation warning${warningCount > 1 ? 's' : ''}`
                    : `${errorCount} validation error${errorCount > 1 ? 's' : ''}`
                }
              </div>
              <div className={isOnline ? "text-green-500" : "text-orange-500"}>
                {isOnline 
                  ? "Connected to network" 
                  : "No internet connection"}
              </div>
              <div className="text-muted-foreground">Click to view details</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Original simple component (without data info)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors",
              isOnline 
                ? "text-green-500" 
                : "text-orange-500 bg-orange-500/10 border border-orange-500/30",
              className
            )}
          >
            <span 
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isOnline 
                  ? "bg-green-500 animate-pulse" 
                  : "bg-orange-500"
              )} 
            />
            {!compact && (
              <span className="uppercase tracking-wider">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
            {isOnline ? (
              <Wifi className="h-3 w-3 opacity-60" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isOnline 
            ? "Connected to network" 
            : "No internet connection – some features unavailable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
