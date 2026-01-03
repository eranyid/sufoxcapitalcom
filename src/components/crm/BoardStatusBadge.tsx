import { Eye, FlaskConical, TrendingUp, LogOut, Pause } from 'lucide-react';

interface Props {
  status: string;
}

export function BoardStatusBadge({ status }: Props) {
  const getStatusConfig = () => {
    switch (status) {
      case 'research':
        return {
          style: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          label: 'research',
          icon: FlaskConical
        };
      case 'working_on_it':
        return {
          style: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          label: 'active',
          icon: TrendingUp
        };
      case 'monitoring':
        return {
          style: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          label: 'monitoring',
          icon: Eye
        };
      case 'done':
        return {
          style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          label: 'exited',
          icon: LogOut
        };
      case 'on_hold':
        return {
          style: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          label: 'on hold',
          icon: Pause
        };
      default:
        return {
          style: 'bg-muted text-muted-foreground border-border',
          label: status,
          icon: null
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${config.style}`}>
      {Icon && <Icon size={12} />}
      {config.label}
    </span>
  );
}
