import { BarChart3, CheckSquare, FolderKanban, CalendarPlus, MapPin, Clock, AlertCircle, Calendar } from 'lucide-react';

interface AnalysisShareCardProps {
  title: string;
  type: string;
  snapshot: Record<string, unknown> | null;
  senderName: string;
  analysisId?: string;
}

const typeLabels: Record<string, string> = {
  dcf: 'DCF Valuation',
  risk: 'Risk Analysis',
  allocation: 'Allocation',
  scenario: 'Scenario Analysis',
  research: 'Research Note',
  valuation: 'Valuation',
  research_note: 'Research Note',
  calculator: 'Calculator',
  task: 'Task',
  project: 'Project',
  calendar_event: 'Calendar Invite',
  unknown: 'Analysis',
};

function getIcon(type: string) {
  if (type === 'task') return <CheckSquare size={14} className="text-primary" />;
  if (type === 'project') return <FolderKanban size={14} className="text-primary" />;
  if (type === 'calendar_event') return <CalendarPlus size={14} className="text-primary" />;
  return <BarChart3 size={14} className="text-primary" />;
}

function getAccentColor(type: string) {
  if (type === 'task') return 'border-accent/30 bg-accent/5';
  if (type === 'project') return 'border-secondary/30 bg-secondary/5';
  if (type === 'calendar_event') return 'border-orange-500/30 bg-orange-500/5';
  return 'border-primary/30 bg-primary/5';
}

const urgencyColors: Record<string, string> = {
  urgent: 'text-destructive',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-muted-foreground',
};

export function AnalysisShareCard({ title, type, snapshot, senderName }: AnalysisShareCardProps) {
  const statusLabel = snapshot?.status as string | undefined;
  const urgency = snapshot?.urgency as string | undefined;
  const dueDate = snapshot?.due_date as string | undefined;
  const targetDate = snapshot?.target_date as string | undefined;
  const priority = snapshot?.priority as string | undefined;
  const healthStatus = snapshot?.health_status as string | undefined;
  const owner = snapshot?.owner as string | undefined;
  const description = snapshot?.description as string | undefined;
  const summary = snapshot?.summary as string | undefined;
  const ticker = snapshot?.ticker as string | undefined;
  const dateLabel = snapshot?.date as string | undefined;
  const timeLabel = snapshot?.time as string | undefined;
  const locationLabel = snapshot?.location as string | undefined;

  return (
    <div className={`border rounded-md p-2.5 space-y-1.5 ${getAccentColor(type)}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-primary/20 flex items-center justify-center shrink-0">
          {getIcon(type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-primary font-mono uppercase tracking-wider">
              {typeLabels[type] || type}
            </span>
            {statusLabel && (
              <span className="text-[10px] text-muted-foreground font-mono uppercase">
                {statusLabel.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task details */}
      {type === 'task' && (
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {urgency && urgency !== 'none' && (
              <span className={`text-[10px] font-mono uppercase ${urgencyColors[urgency] || 'text-muted-foreground'}`}>
                ● {urgency}
              </span>
            )}
            {owner && (
              <span className="text-[10px] text-muted-foreground font-mono">
                → {owner}
              </span>
            )}
            {dueDate && (
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                <Calendar size={8} /> {new Date(dueDate).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[10px] text-muted-foreground line-clamp-3">{description}</p>
          )}
        </div>
      )}

      {/* Project details */}
      {type === 'project' && (
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {priority && (
              <span className="text-[10px] text-primary/80 font-mono uppercase">
                {priority}
              </span>
            )}
            {healthStatus && (
              <span className="text-[10px] text-muted-foreground font-mono uppercase flex items-center gap-0.5">
                <AlertCircle size={8} /> {healthStatus}
              </span>
            )}
            {targetDate && (
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                <Calendar size={8} /> {new Date(targetDate).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[10px] text-muted-foreground line-clamp-3">{description}</p>
          )}
        </div>
      )}

      {/* Calendar event details */}
      {type === 'calendar_event' && (dateLabel || timeLabel || locationLabel) && (
        <div className="space-y-0.5 pt-0.5">
          {dateLabel && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={8} /> {dateLabel} {timeLabel && `· ${timeLabel}`}
            </p>
          )}
          {locationLabel && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin size={8} /> {locationLabel}
            </p>
          )}
        </div>
      )}

      {/* Analysis details */}
      {type !== 'task' && type !== 'project' && type !== 'calendar_event' && (
        <div className="space-y-1 pt-0.5">
          {ticker && (
            <span className="text-[10px] text-primary font-mono">{ticker}</span>
          )}
          {(summary || description) && (
            <p className="text-[10px] text-muted-foreground line-clamp-3">{summary || description}</p>
          )}
        </div>
      )}
    </div>
  );
}