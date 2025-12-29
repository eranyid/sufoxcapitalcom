import { cn } from '@/lib/utils';
import { TaskStatus, STATUS_OPTIONS } from '@/types/crm';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

// Custom icon components for specific statuses
function BacklogIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" strokeDasharray="2 2" />
    </svg>
  );
}

function PlannedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
    </svg>
  );
}

function InProgressIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 8L11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const statusConfig: Record<TaskStatus, { 
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  hexColor: string; // For charts/battery bar
}> = {
  backlog: { 
    icon: BacklogIcon, 
    bgColor: 'bg-amber-500/20', 
    textColor: 'text-amber-500',
    hexColor: '#f59e0b', // amber-500
  },
  planned: { 
    icon: PlannedIcon, 
    bgColor: 'bg-red-500/20', 
    textColor: 'text-red-400',
    hexColor: '#c94a4a', // muted institutional red
  },
  in_progress: { 
    icon: InProgressIcon, 
    bgColor: 'bg-emerald-500/20', 
    textColor: 'text-emerald-400',
    hexColor: '#4caf5f', // crypto-institutional green
  },
  completed: { 
    icon: CheckCircle2, 
    bgColor: 'bg-indigo-500/20', 
    textColor: 'text-indigo-400',
    hexColor: '#818cf8', // indigo-400
  },
  canceled: { 
    icon: XCircle, 
    bgColor: 'bg-muted', 
    textColor: 'text-muted-foreground',
    hexColor: '#6b7280', // gray-500
  },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const config = statusConfig[status] || statusConfig.backlog;
  const Icon = config.icon;
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full',
      config.bgColor,
      config.textColor,
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// Option component for Select dropdowns
export function TaskStatusOption({ status, isSelected }: { status: TaskStatus; isSelected?: boolean }) {
  const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const config = statusConfig[status] || statusConfig.backlog;
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-2 text-sm font-medium',
      config.textColor
    )}>
      <span className={cn('flex items-center justify-center w-5 h-5 rounded', config.bgColor)}>
        <Icon className="w-4 h-4" />
      </span>
      {label}
    </span>
  );
}
