import { cn } from '@/lib/utils';
import { TaskUrgency, URGENCY_OPTIONS } from '@/types/crm';
import { AlertTriangle, SignalHigh, SignalMedium, SignalLow, Minus, Check, LucideIcon } from 'lucide-react';

interface TaskUrgencyBadgeProps {
  urgency: TaskUrgency;
  className?: string;
  showIcon?: boolean;
  showCheck?: boolean;
}

const urgencyConfig: Record<TaskUrgency, { 
  icon: LucideIcon;
  style: string;
  iconStyle: string;
}> = {
  none: {
    icon: Minus,
    style: 'text-muted-foreground',
    iconStyle: 'text-muted-foreground',
  },
  urgent: {
    icon: AlertTriangle,
    style: 'text-orange-400',
    iconStyle: 'text-orange-400 fill-orange-400/20',
  },
  high: {
    icon: SignalHigh,
    style: 'text-rose-400',
    iconStyle: 'text-rose-400',
  },
  medium: {
    icon: SignalMedium,
    style: 'text-amber-400',
    iconStyle: 'text-amber-400',
  },
  low: {
    icon: SignalLow,
    style: 'text-blue-400',
    iconStyle: 'text-blue-400',
  },
};

export function TaskUrgencyBadge({ urgency, className, showIcon = true, showCheck = false }: TaskUrgencyBadgeProps) {
  const config = urgencyConfig[urgency] || urgencyConfig.none;
  const label = URGENCY_OPTIONS.find(u => u.value === urgency)?.label || 'No priority';
  const Icon = config.icon;

  // Get background color based on urgency
  const bgColorMap: Record<TaskUrgency, string> = {
    none: 'bg-muted/30',
    urgent: 'bg-orange-500/20',
    high: 'bg-rose-500/20',
    medium: 'bg-amber-500/20',
    low: 'bg-blue-500/20',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full',
      bgColorMap[urgency] || 'bg-muted/30',
      config.style,
      className
    )}>
      {showIcon && <Icon size={16} className={config.iconStyle} />}
      {!showIcon && <span className="text-sm font-medium">{label}</span>}
      {showCheck && <Check size={14} className="ml-auto text-primary" />}
    </span>
  );
}

// Dropdown item version for use in select menus
export function TaskUrgencyOption({ urgency, isSelected }: { urgency: TaskUrgency; isSelected?: boolean }) {
  const config = urgencyConfig[urgency] || urgencyConfig.none;
  const label = URGENCY_OPTIONS.find(u => u.value === urgency)?.label || 'No priority';
  const Icon = config.icon;
  
  return (
    <div className="flex items-center gap-2 w-full">
      <Icon size={14} className={config.iconStyle} />
      <span className={config.style}>{label}</span>
      {isSelected && <Check size={14} className="ml-auto text-primary" />}
    </div>
  );
}
