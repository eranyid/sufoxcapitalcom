import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  tooltip?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, className, tooltip }: KPICardProps) {
  return (
    <div className={cn("kpi-card min-h-[80px] sm:min-h-0", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="terminal-label truncate text-[9px] sm:text-[10px]">{title}</p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className={cn(
            "font-mono tabular-nums tracking-tight mt-0.5 text-base sm:text-xl",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
            trend === 'neutral' && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-1.5 sm:p-1 bg-primary/10 border border-primary/30">
            <Icon size={14} className="text-primary sm:w-3 sm:h-3" />
          </div>
        )}
      </div>
      {trendValue && (
        <div className={cn(
          "mt-1.5 text-[10px] font-mono font-medium",
          trend === 'up' && "positive",
          trend === 'down' && "negative"
        )}>
          {trend === 'up' && '▲ '}
          {trend === 'down' && '▼ '}
          {trendValue}
        </div>
      )}
    </div>
  );
}