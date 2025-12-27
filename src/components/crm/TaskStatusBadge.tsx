import { cn } from '@/lib/utils';
import { TaskStatus, STATUS_OPTIONS } from '@/types/crm';
import { Circle, CheckCircle2, XCircle } from 'lucide-react';

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

const statusConfig: Record<TaskStatus, { 
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
}> = {
  backlog: { 
    icon: BacklogIcon, 
    bgColor: 'bg-amber-500/20', 
    textColor: 'text-amber-500' 
  },
  planned: { 
    icon: PlannedIcon, 
    bgColor: 'bg-muted', 
    textColor: 'text-muted-foreground' 
  },
  in_progress: { 
    icon: InProgressIcon, 
    bgColor: 'bg-amber-500/20', 
    textColor: 'text-amber-500' 
  },
  completed: { 
    icon: CheckCircle2, 
    bgColor: 'bg-indigo-500/20', 
    textColor: 'text-indigo-400' 
  },
  canceled: { 
    icon: XCircle, 
    bgColor: 'bg-muted', 
    textColor: 'text-muted-foreground' 
  },
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const config = statusConfig[status] || statusConfig.backlog;
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium rounded-md',
      config.bgColor,
      config.textColor,
      className
    )}>
      <span className={cn('flex items-center justify-center w-5 h-5 rounded', config.bgColor)}>
        <Icon className="w-4 h-4" />
      </span>
      {label}
    </span>
  );
}
