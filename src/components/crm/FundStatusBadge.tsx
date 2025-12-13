import { cn } from '@/lib/utils';
import { FundStatus, FUND_STATUS_OPTIONS } from '@/types/crm';

interface FundStatusBadgeProps {
  status: FundStatus;
  className?: string;
}

const statusStyles: Record<FundStatus, string> = {
  screening: 'bg-muted text-muted-foreground border-border',
  dd: 'bg-primary/20 text-primary border-primary/40',
  approved: 'bg-green-500/20 text-green-400 border-green-500/40',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export function FundStatusBadge({ status, className }: FundStatusBadgeProps) {
  const label = FUND_STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border',
      statusStyles[status],
      className
    )}>
      {label}
    </span>
  );
}
