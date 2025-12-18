import { BoardStatus } from '@/types/crm';

interface Props {
  status: string;
}

export function BoardStatusBadge({ status }: Props) {
  const getStatusStyle = () => {
    switch (status) {
      case 'working_on_it':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'done':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'stuck':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'working_on_it':
        return 'Working on it';
      case 'done':
        return 'Done';
      case 'stuck':
        return 'Stuck';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusStyle()}`}>
      {getLabel()}
    </span>
  );
}
