import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GanttChart, ListFilter, CalendarClock, LayoutList } from 'lucide-react';
import { useAllMilestones } from '@/hooks/useAllMilestones';
import { MilestoneGanttChart, type GanttRow } from '@/components/projects/MilestoneGanttChart';
import { TemplateManagerDialog } from '@/components/projects/TemplateManagerDialog';
import { milestonesToGanttBars } from '@/lib/milestoneGantt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MILESTONE_STATUS_OPTIONS } from '@/types/projects';
import type { MilestoneStatus } from '@/types/projects';
import { format, isPast, isToday } from 'date-fns';

export default function Milestones() {
  const navigate = useNavigate();
  const { milestones, loading } = useAllMilestones();
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    milestones.forEach(m => map.set(m.project_id, m.project_name));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [milestones]);

  const filtered = useMemo(
    () =>
      milestones.filter(m => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (projectFilter !== 'all' && m.project_id !== projectFilter) return false;
        return true;
      }),
    [milestones, statusFilter, projectFilter],
  );

  // Group filtered milestones by project → Gantt rows.
  const ganttRows: GanttRow[] = useMemo(() => {
    const byProject = new Map<string, typeof filtered>();
    for (const m of filtered) {
      if (!byProject.has(m.project_id)) byProject.set(m.project_id, []);
      byProject.get(m.project_id)!.push(m);
    }
    return Array.from(byProject, ([projectId, group]) => {
      const sorted = [...group].sort((a, b) => a.sort_order - b.sort_order);
      return {
        groupId: projectId,
        groupLabel: group[0].project_name,
        onGroupClick: () => navigate(`/backoffice/projects/${projectId}`),
        bars: milestonesToGanttBars(sorted, sorted[0]?.project_start_date),
      };
    }).filter(r => r.bars.length > 0);
  }, [filtered, navigate]);

  const upcoming = useMemo(
    () =>
      filtered
        .filter(m => m.due_date && m.status !== 'completed' && m.status !== 'skipped')
        .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
        .slice(0, 8),
    [filtered],
  );

  const overdueCount = filtered.filter(
    m =>
      m.due_date &&
      m.status !== 'completed' &&
      m.status !== 'skipped' &&
      isPast(new Date(m.due_date)) &&
      !isToday(new Date(m.due_date)),
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Milestones</h1>
          <Badge variant="outline" className="text-xs font-mono">
            {filtered.length} across {projects.length} projects
          </Badge>
          {overdueCount > 0 && (
            <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
              {overdueCount} overdue
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setTemplatesOpen(true)}>
            <LayoutList size={14} />
            Templates
          </Button>
          <ListFilter size={16} className="text-muted-foreground" />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MilestoneStatus | 'all')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {MILESTONE_STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <GanttChart size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium">No milestones yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Generate milestones on a project — or batch-generate across several from the Projects page — to see them here.
          </p>
        </div>
      ) : (
        <>
          {/* Gantt */}
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <GanttChart size={16} />
            <span>Timeline</span>
          </div>
          {ganttRows.length > 0 ? (
            <MilestoneGanttChart rows={ganttRows} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No dated milestones match the current filters.
            </p>
          )}

          {/* Upcoming list */}
          {upcoming.length > 0 && (
            <div className="border border-border rounded-lg bg-card">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border text-sm font-semibold">
                <CalendarClock size={16} className="text-muted-foreground" />
                Upcoming
              </div>
              <div>
                {upcoming.map(m => {
                  const due = new Date(m.due_date!);
                  const overdue = isPast(due) && !isToday(due);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/backoffice/projects/${m.project_id}`)}
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{m.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">{m.project_name}</span>
                      </div>
                      <span
                        className={`text-xs font-mono shrink-0 ${
                          overdue ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        {format(due, 'MMM d, yyyy')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <TemplateManagerDialog open={templatesOpen} onOpenChange={setTemplatesOpen} />
    </div>
  );
}
