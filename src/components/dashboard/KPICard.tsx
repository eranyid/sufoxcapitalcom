import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  className,
  tooltip,
  size = 'md'
}: KPICardProps) {
  const content = (
    <div className={cn(
      "kpi-card group",
      size === 'sm' && "p-1.5",
      size === 'lg' && "p-3",
      className
    )}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="terminal-label truncate">{title}</p>
          <p className={cn(
            "font-mono tabular-nums mt-0.5",
            size === 'sm' && "text-sm",
            size === 'md' && "text-lg",
            size === 'lg' && "text-2xl",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
            trend === 'neutral' && "text-foreground",
            !trend && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xxs text-muted-foreground font-mono mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-1 bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors">
            <Icon size={10} className="text-primary" />
          </div>
        )}
      </div>
      {trendValue && (
        <div className={cn(
          "mt-1 text-xxs font-mono font-medium flex items-center gap-1",
          trend === 'up' && "positive",
          trend === 'down' && "negative"
        )}>
          {trend === 'up' && <span className="text-success">▲</span>}
          {trend === 'down' && <span className="text-destructive">▼</span>}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xxs font-mono max-w-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}