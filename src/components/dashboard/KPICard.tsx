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
      "bg-[#121212] border border-[#1E1E1E] p-2 transition-all duration-100 hover:border-[#00FFFF]/50 group",
      size === 'sm' && "p-1.5",
      size === 'lg' && "p-3",
      className
    )}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-[#00FFFF] text-[9px] uppercase tracking-widest font-semibold font-mono truncate">{title}</p>
          <p className={cn(
            "font-mono tabular-nums mt-0.5",
            size === 'sm' && "text-sm",
            size === 'md' && "text-lg",
            size === 'lg' && "text-2xl"
          )} style={{
            color: trend === 'up' ? '#00FF00' : trend === 'down' ? '#FF4D4D' : '#FFFFFF'
          }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xxs text-[#D0D0D0] font-mono mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-1 bg-[#00FFFF]/10 border border-[#00FFFF]/20 group-hover:border-[#00FFFF]/40 transition-colors">
            <Icon size={10} className="text-[#00FFFF]" />
          </div>
        )}
      </div>
      {trendValue && (
        <div className="mt-1 text-xxs font-mono font-medium flex items-center gap-1">
          {trend === 'up' && <span style={{ color: '#00FF00' }}>▲</span>}
          {trend === 'down' && <span style={{ color: '#FF4D4D' }}>▼</span>}
          <span style={{ color: trend === 'up' ? '#00FF00' : trend === 'down' ? '#FF4D4D' : '#D0D0D0' }}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xxs font-mono max-w-xs bg-[#121212] border-[#1E1E1E] text-[#D0D0D0]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}