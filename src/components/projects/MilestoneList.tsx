import { useState } from 'react';
import {
  CheckCircle2, Circle, Clock, SkipForward, Trash2,
  GripVertical, Calendar, ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MILESTONE_STATUS_OPTIONS } from '@/types/projects';
import type { ProjectMilestone, MilestoneStatus } from '@/types/projects';
import { format } from 'date-fns';

const STATUS_ICON: Record<MilestoneStatus, React.ReactNode> = {
  pending: <Circle size={16} className="text-muted-foreground" />,
  in_progress: <Clock size={16} className="text-blue-400" />,
  completed: <CheckCircle2 size={16} className="text-emerald-400" />,
  skipped: <SkipForward size={16} className="text-muted-foreground/50" />,
};

const STATUS_COLOR: Record<MilestoneStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  skipped: 'bg-muted/50 text-muted-foreground/50',
};

interface MilestoneListProps {
  milestones: ProjectMilestone[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  onUpdateStatus: (id: string, status: MilestoneStatus) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAdd: (title: string, description?: string, dueDate?: string) => Promise<boolean>;
}

export function MilestoneList({
  milestones,
  completedCount,
  totalCount,
  percentComplete,
  onUpdateStatus,
  onDelete,
  onAdd,
}: MilestoneListProps) {
  const [expanded, setExpanded] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const success = await onAdd(
      newTitle.trim(),
      newDescription.trim() || undefined,
      newDueDate || undefined,
    );
    if (success) {
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setAddOpen(false);
    }
  };

  const cycleStatus = async (milestone: ProjectMilestone) => {
    const order: MilestoneStatus[] = ['pending', 'in_progress', 'completed', 'skipped'];
    const current = order.indexOf(milestone.status as MilestoneStatus);
    const next = order[(current + 1) % order.length];
    await onUpdateStatus(milestone.id, next);
  };

  if (milestones.length === 0) return null;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="flex items-center justify-between w-full p-4 md:p-6 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Milestones</h3>
          <Badge variant="outline" className="text-xs font-mono">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 w-32">
            <Progress value={percentComplete} className="h-1.5" />
            <span className="text-xs font-mono text-muted-foreground w-8">{percentComplete}%</span>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Milestone items */}
      {expanded && (
        <div className="border-t border-border">
          {milestones.map((milestone, idx) => {
            const status = milestone.status as MilestoneStatus;
            const isCompleted = status === 'completed';
            const isSkipped = status === 'skipped';

            return (
              <div
                key={milestone.id}
                className={`flex items-start gap-3 px-4 md:px-6 py-3 group transition-colors hover:bg-muted/30 ${
                  idx < milestones.length - 1 ? 'border-b border-border/50' : ''
                } ${isSkipped ? 'opacity-50' : ''}`}
              >
                {/* Status icon (clickable to cycle) */}
                <button
                  type="button"
                  className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                  onClick={() => cycleStatus(milestone)}
                  title="Click to cycle status"
                >
                  {STATUS_ICON[status]}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : isSkipped ? 'line-through' : ''}`}>
                      {milestone.title}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLOR[status]}`}>
                      {MILESTONE_STATUS_OPTIONS.find(o => o.value === status)?.label}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {milestone.description}
                    </p>
                  )}
                  {milestone.due_date && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar size={10} />
                      <span className="font-mono">{format(new Date(milestone.due_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                  onClick={() => onDelete(milestone.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            );
          })}

          {/* Add milestone row */}
          <div className="px-4 md:px-6 py-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={14} />
              Add Milestone
            </Button>
          </div>
        </div>
      )}

      {/* Add Milestone Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Milestone title"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
