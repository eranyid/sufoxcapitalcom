import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, className }: KPICardProps) {
  return (
    <div className={cn("kpi-card", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="terminal-label truncate">{title}</p>
          <p className={cn(
            "terminal-value-lg mt-0.5",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive",
            trend === 'neutral' && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-1 bg-primary/10 border border-primary/30">
            <Icon size={12} className="text-primary" />
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
