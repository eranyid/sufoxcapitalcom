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
    <div className={cn("kpi-card animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-semibold tracking-tight",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon size={20} className="text-primary" />
          </div>
        )}
      </div>
      {trendValue && (
        <div className={cn(
          "mt-2 text-xs font-medium",
          trend === 'up' && "positive",
          trend === 'down' && "negative"
        )}>
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {trendValue}
        </div>
      )}
    </div>
  );
}
