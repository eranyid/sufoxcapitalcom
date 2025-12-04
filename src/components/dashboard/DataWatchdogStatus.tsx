import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataWatchdogStatusProps {
  status: 'ok' | 'warning' | 'error';
  errorCount: number;
  warningCount: number;
  onClick: () => void;
}

export function DataWatchdogStatus({ status, errorCount, warningCount, onClick }: DataWatchdogStatusProps) {
  const getIcon = () => {
    switch (status) {
      case 'error':
        return <ShieldX className="h-3 w-3" />;
      case 'warning':
        return <ShieldAlert className="h-3 w-3" />;
      default:
        return <ShieldCheck className="h-3 w-3" />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'error':
        return `${errorCount} Error${errorCount > 1 ? 's' : ''}`;
      case 'warning':
        return `${warningCount} Warning${warningCount > 1 ? 's' : ''}`;
      default:
        return 'Data OK';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all hover:opacity-80",
        status === 'ok' && "bg-green-500/20 border border-green-500/50 text-green-400",
        status === 'warning' && "bg-yellow-500/20 border border-yellow-500/50 text-yellow-400",
        status === 'error' && "bg-destructive/20 border border-destructive/50 text-destructive animate-pulse"
      )}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </button>
  );
}
