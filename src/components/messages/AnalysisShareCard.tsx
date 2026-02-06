import { BarChart3, Eye, CheckSquare, FolderKanban, CalendarPlus, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

function getViewRoute(type: string, id?: string): string | null {
  if (!id) return null;
  switch (type) {
    case 'task': return `/backoffice/tasks`;
    case 'project': return `/projects/${id}`;
    case 'calendar_event': return `/calendar`;
    case 'research_note':
    case 'research':
    case 'calculator':
      return `/research`;
    default:
      return `/analysis`;
  }
}

export function AnalysisShareCard({ title, type, snapshot, senderName, analysisId }: AnalysisShareCardProps) {
  const navigate = useNavigate();
  const statusLabel = snapshot?.status as string | undefined;
  const dateLabel = snapshot?.date as string | undefined;
  const timeLabel = snapshot?.time as string | undefined;
  const locationLabel = snapshot?.location as string | undefined;
  const description = snapshot?.description as string | undefined;

  const route = getViewRoute(type, analysisId);

  return (
    <div className={`border rounded-md p-2.5 space-y-2 ${getAccentColor(type)}`}>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-primary/20 flex items-center justify-center">
          {getIcon(type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-primary font-mono uppercase tracking-wider">
              {typeLabels[type] || type}
            </p>
            {statusLabel && (
              <span className="text-[10px] text-muted-foreground font-mono uppercase">
                {statusLabel.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
      {type === 'calendar_event' && (dateLabel || timeLabel || locationLabel) && (
        <div className="space-y-0.5">
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
      {type !== 'calendar_event' && description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">{description}</p>
      )}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] flex-1 gap-1"
          onClick={() => route && navigate(route)}
          disabled={!route}
        >
          <Eye size={10} /> View
        </Button>
      </div>
    </div>
  );
}