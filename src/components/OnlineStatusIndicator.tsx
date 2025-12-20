import { Wifi, WifiOff } from 'lucide-react';
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
}

export function OnlineStatusIndicator({ 
  isOnline, 
  compact = false,
  className 
}: OnlineStatusIndicatorProps) {
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
