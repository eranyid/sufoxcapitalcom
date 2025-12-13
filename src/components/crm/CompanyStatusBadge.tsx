import { cn } from '@/lib/utils';
import { CompanyStatus, COMPANY_STATUS_OPTIONS } from '@/types/crm';

interface CompanyStatusBadgeProps {
  status: CompanyStatus;
  className?: string;
}

const statusStyles: Record<CompanyStatus, string> = {
  research: 'bg-muted text-muted-foreground border-border',
  contacted: 'bg-primary/20 text-primary border-primary/40',
  monitoring: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export function CompanyStatusBadge({ status, className }: CompanyStatusBadgeProps) {
  const label = COMPANY_STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  
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
